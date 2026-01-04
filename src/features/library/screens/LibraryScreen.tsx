import React, { useState, useMemo, useCallback } from 'react';
import { FlatList, Alert, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
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
import { useBooks, useCreateBook, useDeleteBook, useUpdateBook } from '../hooks/useBooks';
import { Theme } from '../../../theme/theme';
import { epubService } from '../../reader/utils/EpubService';
import { RootStackParamList } from '../../../types/navigation';
import { Book } from '../../../services/database';
import { useLibrarySettings } from '../stores/useLibrarySettings';

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
    const handleMenuAction = (book: Book) => {
        Alert.alert(
            book.title,
            '选择操作',
            [
                { text: '编辑信息', onPress: () => setEditingBook(book) },
                { text: '删除书籍', onPress: () => handleDeleteBook(book.id, book.title), style: 'destructive' },
                { text: '取消', style: 'cancel' }
            ]
        );
    };

    const handleSaveBook = async (id: string, updates: Partial<Book>) => {
        await updateBook.mutateAsync({ id, data: updates });
    };

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
                        } catch (error) {
                            Alert.alert('错误', '删除失败');
                        }
                    }
                }
            ]
        );
    };

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
                        <TouchableOpacity onPress={() => {
                            Alert.alert('排序方式', '选择排序方式', [
                                { text: '最近阅读', onPress: () => setSortMode('recent') },
                                { text: '添加时间', onPress: () => setSortMode('scan') },
                                { text: '名称', onPress: () => setSortMode('title') },
                                { text: '取消', style: 'cancel' }
                            ]);
                        }}>
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


        </ScreenLayout>
    );
};

export default LibraryScreen;
