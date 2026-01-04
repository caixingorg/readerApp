import React, { useState, useMemo, useCallback } from 'react';
import { FlatList, Platform, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as FileSystem from 'expo-file-system/legacy';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import ScreenLayout from '../../../components/ScreenLayout';
import BookItem from '../components/BookItem';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import EditBookModal from '../components/EditBookModal';
import ActionSheetModal, { ActionItem } from '../../../components/ActionSheetModal';
import { useBooks, useCreateBook, useDeleteBook, useUpdateBook } from '../hooks/useBooks';
import { Theme } from '../../../theme/theme';
import { epubService } from '../../reader/utils/EpubService';
import { RootStackParamList } from '../../../types/navigation';
import { Book } from '../../../services/database';
import { useLibrarySettings } from '../stores/useLibrarySettings';
import Toast from 'react-native-toast-message';

const LibraryScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { data: books = [], isLoading } = useBooks();
    const createBook = useCreateBook();
    const deleteBook = useDeleteBook();
    const updateBook = useUpdateBook();
    const [searchQuery, setSearchQuery] = useState('');

    // UI States
    const {
        viewMode, setViewMode,
        sortMode, setSortMode,
        showFileSize, showFormatLabel
    } = useLibrarySettings();
    const [editingBook, setEditingBook] = useState<Book | null>(null);

    // ActionSheet Configuration
    const [actionSheetVisible, setActionSheetVisible] = useState(false);
    const [actionSheetTitle, setActionSheetTitle] = useState('');
    const [actionSheetActions, setActionSheetActions] = useState<ActionItem[]>([]);

    /**
     * Sort and Filter books
     */
    const processedBooks = useMemo(() => {
        let result = [...books];

        // 1. Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(book =>
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query)
            );
        }

        // 2. Sort
        switch (sortMode) {
            case 'title':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'scan': // Scan/Import time (createdAt) - Newest first
                result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                break;
            case 'recent': // Recently Read - Most progress/recent first (assuming lastRead is timestamp)
                // If lastRead is missing, fallback to createdAt
                result.sort((a, b) => (b.lastRead || b.createdAt || 0) - (a.lastRead || a.createdAt || 0));
                break;
        }

        return result;
    }, [books, searchQuery, sortMode]);

    /**
     * Action handlers
     */
    const showActionSheet = (title: string, actions: ActionItem[]) => {
        setActionSheetTitle(title);
        setActionSheetActions(actions);
        setActionSheetVisible(true);
    };

    const handleMenuAction = (book: Book) => {
        showActionSheet(`操作: ${book.title}`, [
            {
                label: '编辑信息',
                onPress: () => setEditingBook(book)
            },
            {
                label: '删除书籍',
                destructive: true,
                onPress: () => confirmDeleteBook(book)
            },
            { label: '取消', cancel: true, onPress: () => { } }
        ]);
    };

    const confirmDeleteBook = (book: Book) => {
        // Double confirm for deletion using same ActionSheet logic or directly if separate sheet preferred
        // Using a slight delay to allow first sheet to close or just replace it
        setTimeout(() => {
            showActionSheet(`确认删除《${book.title}》吗？`, [
                {
                    label: '确认删除',
                    destructive: true,
                    onPress: () => executeDeleteBook(book.id)
                },
                { label: '取消', cancel: true, onPress: () => { } }
            ]);
        }, 300);
    };

    const executeDeleteBook = async (bookId: string) => {
        try {
            await deleteBook.mutateAsync(bookId);
            Toast.show({
                type: 'success',
                text1: '删除成功',
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: '删除失败',
                text2: String(error)
            });
        }
    };

    const handleSaveBook = async (id: string, updates: Partial<Book>) => {
        await updateBook.mutateAsync({ id, data: updates });
        Toast.show({ type: 'success', text1: '更新成功' });
    };

    const handleBookPress = (bookId: string) => {
        navigation.navigate('Reader', { bookId });
    };

    const handleSortPress = () => {
        showActionSheet('排序方式', [
            { label: '最近阅读', onPress: () => setSortMode('recent') },
            { label: '添加时间', onPress: () => setSortMode('scan') },
            { label: '名称', onPress: () => setSortMode('title') },
            { label: '取消', cancel: true, onPress: () => { } }
        ]);
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
                paddingBottom="s"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <Text variant="header">书库</Text>

                {/* Import Button (Kept in Header) */}
                <TouchableOpacity onPress={() => navigation.navigate('Import')}>
                    <Box padding="s" backgroundColor="primary" borderRadius="full">
                        <Ionicons name="add" size={20} color="white" />
                    </Box>
                </TouchableOpacity>
            </Box>

            {/* Search & Actions Row */}
            {books.length > 0 && (
                <Box paddingHorizontal="l" marginBottom="m" flexDirection="row" alignItems="center" gap="s">
                    {/* Search Bar (Flex) */}
                    <Box flex={1}>
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onClear={() => setSearchQuery('')}
                        />
                    </Box>

                    {/* Actions Group */}
                    <Box flexDirection="row" gap="s">
                        {/* Sort Button */}
                        <TouchableOpacity onPress={handleSortPress}>
                            <Box padding="s" backgroundColor="card" borderRadius="m" borderWidth={1} borderColor="border">
                                <Ionicons name="filter-outline" size={20} color={theme.colors.primary} />
                            </Box>
                        </TouchableOpacity>

                        {/* View Toggle */}
                        <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                            <Box padding="s" backgroundColor="card" borderRadius="m" borderWidth={1} borderColor="border">
                                <Ionicons name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'} size={20} color={theme.colors.primary} />
                            </Box>
                        </TouchableOpacity>
                    </Box>
                </Box>
            )}

            {/* Book list */}
            {processedBooks.length === 0 ? (
                searchQuery ? (
                    <Box flex={1} justifyContent="center" alignItems="center" padding="xl">
                        <Ionicons name="search-outline" size={60} color={theme.colors.textTertiary} />
                        <Text variant="title" marginTop="m" marginBottom="s">
                            未找到匹配的书籍
                        </Text>
                    </Box>
                ) : (
                    <EmptyState
                        onImport={() => navigation.navigate('Import')}
                        onWiFi={() => navigation.navigate('Import')}
                    />
                )
            ) : (
                <FlatList
                    key={viewMode} // Force re-render on mode switch
                    data={processedBooks}
                    keyExtractor={(item) => item.id}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    renderItem={({ item }) => (
                        <BookItem
                            book={item}
                            viewMode={viewMode}
                            onPress={() => handleBookPress(item.id)}
                            onLongPress={() => handleMenuAction(item)}
                            onMenuPress={() => handleMenuAction(item)}
                            showFileSize={showFileSize}
                            showFormatLabel={showFormatLabel}
                        />
                    )}
                    contentContainerStyle={{
                        padding: viewMode === 'grid' ? theme.spacing.s : theme.spacing.l,
                    }}
                    columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'flex-start' } : undefined}
                />
            )}

            <EditBookModal
                visible={!!editingBook}
                book={editingBook}
                onClose={() => setEditingBook(null)}
                onSave={handleSaveBook}
            />

            <ActionSheetModal
                visible={actionSheetVisible}
                title={actionSheetTitle}
                actions={actionSheetActions}
                onClose={() => setActionSheetVisible(false)}
            />

        </ScreenLayout>
    );
};

export default LibraryScreen;
