import React, { useState, useMemo, useCallback } from 'react';
import { FlatList, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import ScreenLayout from '../../../components/ScreenLayout';
import BookItem from '../components/BookItem';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import { useBooks, useCreateBook, useDeleteBook } from '../hooks/useBooks';
import { Theme } from '../../../theme/theme';
import { epubService } from '../../reader/utils/EpubService';
import { RootStackParamList } from '../../../types/navigation';

const LibraryScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { data: books = [], isLoading } = useBooks();
    const createBook = useCreateBook();
    const deleteBook = useDeleteBook();
    const [searchQuery, setSearchQuery] = useState('');

    const [isImporting, setIsImporting] = useState(false);

    /**
     * Handle importing a book file
     */
    const handleImport = async () => {
        try {
            console.log('[Library] Starting import process (Strategy: System Copy)...');

            // 1. Pick the file
            // Ref: Boilerplate uses 'copyTo: documentDirectory' & 'allFiles'.
            // We mimic this with copyToCacheDirectory: true and type: '*/*'.
            console.log('[Library] Opening DocumentPicker...');

            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // Broadest possible type to avoid UTI issues
                copyToCacheDirectory: true, // Let system handle the copy/download from iCloud
                multiple: false,
            });

            console.log('[Library] DocumentPicker result:', JSON.stringify(result));

            if (result.canceled) {
                console.log('[Library] Import cancelled by user');
                return;
            }

            const file = result.assets?.[0];
            if (!file) {
                throw new Error('未能获取文件信息 (No assets)');
            }

            setIsImporting(true); // START LOADING

            // 2. Decode URI (Crucial fix from Boilerplate analysis)
            // Files from pickers sometimes have encoded characters (%20) that filesystem APIs dislike
            let sourceUri = file.uri;
            try {
                sourceUri = decodeURIComponent(sourceUri);
                console.log('[Library] Decoded URI:', sourceUri);
            } catch (e) {
                console.warn('[Library] Failed to decode URI, using original:', e);
            }

            console.log('[Library] Selected file details:', {
                name: file.name,
                mimeType: file.mimeType,
                size: file.size,
                originalUri: file.uri,
                decodedUri: sourceUri
            });

            // 3. Determine file type
            let fileType: 'txt' | 'epub' = 'txt';
            const lowerName = file.name.toLowerCase();
            if (lowerName.endsWith('.epub') || file.mimeType === 'application/epub+zip') {
                fileType = 'epub';
            } else if (!lowerName.endsWith('.txt') && !file.mimeType?.includes('text')) {
                // Determine loosely if it's text-like or default to txt error?
                // Actually boilerplate is strict. Let's be semi-strict.
                // If it's not epub, assume txt if extension matches, else error.
                if (!lowerName.endsWith('.txt')) {
                    // Final check: is it really unsupported?
                    // Let's just try to import as txt if not epub, 
                    // but maybe warn user?
                    // For now, consistent with previous logic:
                    console.warn('[Library] Unknown file type, defaulting to TXT');
                }
            }
            console.log('[Library] File type identified:', fileType);

            // 4. Prepare Destination
            const booksDir = FileSystem.documentDirectory + 'books/';
            const dirInfo = await FileSystem.getInfoAsync(booksDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(booksDir, { intermediates: true });
            }

            // 5. Sanitize Filename & Move to Permanent Storage
            // Even though picker copied to cache, we want it in our permanent 'books/' folder
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const uniqueName = `book_${Date.now()}_${sanitizedName}`;
            const destPath = `${booksDir}${uniqueName}`;

            console.log('[Library] Moving from Cache to Permanent:', destPath);

            // Move (since it's already in cache) is faster than Copy
            // But 'copyAsync' is safer if cache is read-only. Let's use copy.
            await FileSystem.copyAsync({
                from: sourceUri,
                to: destPath,
            });
            console.log('[Library] File moved/copied successful');

            // 6. Meta Extraction & DB Entry
            let title = file.name.replace(/\.(txt|epub)$/i, '');
            let author = 'Unknown Author';
            let cover: string | undefined;
            let totalChapters = 0;

            if (fileType === 'epub') {
                try {
                    const tempId = `temp_${Date.now()}`;
                    console.log('[Library] Parsing EPUB meta...');
                    await epubService.unzipBook(destPath, tempId);
                    const bookStruct = await epubService.parseBook(tempId);

                    if (bookStruct.metadata.title) title = bookStruct.metadata.title;
                    if (bookStruct.metadata.author) author = bookStruct.metadata.author;
                    if (bookStruct.metadata.cover) cover = bookStruct.metadata.cover;
                    if (bookStruct.spine) totalChapters = bookStruct.spine.length;

                    console.log('[Library] EPUB Parsed:', title);
                } catch (e) {
                    console.warn('[Library] Failed to parse EPUB metadata:', e);
                    // Non-blocking error
                }
            }

            const bookData = {
                title,
                author,
                cover,
                filePath: destPath,
                fileType,
                progress: 0,
                readingPosition: 0,
                currentChapterIndex: 0,
                currentScrollPosition: 0,
                totalChapters,
                lastRead: 0,
            };

            console.log('[Library] Saving to DB:', bookData);
            await createBook.mutateAsync(bookData);

            console.log('[Library] Import Complete');
            Alert.alert('成功', `书籍《${title}》导入成功！`);

        } catch (error: any) {
            console.error('[Library] Import error:', error);

            // 更友好的错误提示
            let errorMessage = error.message || '未知错误';
            if (error.code === 'ERR_DOCUMENT_PICKER_CANCELED') {
                // 用户取消，不显示错误
                return;
            }

            Alert.alert('导入失败', errorMessage);
        } finally {
            setIsImporting(false); // END LOADING
        }
    };

    /**
     * Filter books by search query
     */
    const filteredBooks = useMemo(() => {
        if (!searchQuery.trim()) {
            return books;
        }
        const query = searchQuery.toLowerCase();
        return books.filter(book =>
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query)
        );
    }, [books, searchQuery]);

    /**
     * Handle delete book
     */
    const handleDeleteBook = (bookId: string, bookTitle: string) => {
        Alert.alert(
            '确认删除',
            `确定要删除《${bookTitle}》吗？`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '删除',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteBook.mutateAsync(bookId);
                            Alert.alert('成功', '书籍已删除');
                        } catch (error) {
                            Alert.alert('错误', '删除失败');
                        }
                    }
                }
            ]
        );
    };

    /**
     * Handle book press (navigate to reader)
     */
    const handleBookPress = (bookId: string) => {
        navigation.navigate('Reader', { bookId });
    };

    if (isLoading) {
        return (
            <Box flex={1} backgroundColor="background" justifyContent="center" alignItems="center">
                <Text variant="body" color="textSecondary">
                    加载中...
                </Text>
            </Box>
        );
    }

    return (
        <ScreenLayout>
            {/* Header */}
            <Box
                paddingHorizontal="l"
                paddingTop="m"
                paddingBottom="m"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <Text variant="header">书库</Text>
                {books.length > 0 && (
                    <Button
                        title="导入"
                        variant="primary"
                        size="small"
                        onPress={handleImport}
                        disabled={isImporting}
                    />
                )}
            </Box>

            {/* Search bar */}
            {books.length > 0 && (
                <Box paddingHorizontal="l" marginBottom="m">
                    <SearchBar
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onClear={() => setSearchQuery('')}
                    />
                </Box>
            )}

            {/* Book list */}
            {filteredBooks.length === 0 ? (
                searchQuery ? (
                    <Box flex={1} justifyContent="center" alignItems="center" padding="xl">
                        <Ionicons name="search-outline" size={60} color={theme.colors.textTertiary} />
                        <Text variant="title" marginTop="m" marginBottom="s">
                            未找到匹配的书籍
                        </Text>
                        <Text variant="body" color="textSecondary">
                            试试其他关键词
                        </Text>
                    </Box>
                ) : (
                    <EmptyState onImport={handleImport} />
                )
            ) : (
                <FlatList
                    data={filteredBooks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <BookItem
                            book={item}
                            onPress={() => handleBookPress(item.id)}
                            onDelete={() => handleDeleteBook(item.id, item.title)}
                        />
                    )}
                    contentContainerStyle={{
                        padding: theme.spacing.l,
                    }}
                />
            )}

            {/* Loading Overlay */}
            {isImporting && (
                <Box
                    position="absolute" left={0} right={0} top={0} bottom={0}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    justifyContent="center" alignItems="center"
                    zIndex={999}
                >
                    <Box backgroundColor="background" padding="l" borderRadius="m" shadowOpacity={0.2}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text variant="body" marginTop="s">正在导入书稿...</Text>
                    </Box>
                </Box>
            )}
        </ScreenLayout>
    );
};

export default LibraryScreen;
