import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import ScreenLayout from '../../../components/ScreenLayout';
import NotebookItem from '../components/NotebookItem';
import NotebookFilterModal from '../components/NotebookFilterModal';
import { BookRepository } from '../../../services/database/BookRepository';
import { NoteRepository } from '../../../services/database/NoteRepository';
// BookmarkRepository removed
import { Book, Note } from '../../../services/database/types';
import Input from '../../../components/Input';

// Unified type for list items
type AnnotationItem =
    | { type: 'note' | 'highlight', data: Note, date: number };

const NotebookScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    const [books, setBooks] = useState<Record<string, Book>>({});
    const [allItems, setAllItems] = useState<AnnotationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        type: 'All Items',
        dateRange: 'all', // '7days', '30days', 'all', 'custom'
        bookIds: [] as string[],
        tags: [] as string[],
    });

    const activeTab = filters.type;
    const setActiveTab = (type: string) => setFilters(prev => ({ ...prev, type: type as any }));

    const fetchData = useCallback(async (options?: { silent?: boolean }) => {
        try {
            if (!options?.silent) setLoading(true);
            const [fetchedBooks, fetchedNotes] = await Promise.all([
                BookRepository.getAll(),
                NoteRepository.getAll(),
            ]);

            // Create Book Map
            const bookMap: Record<string, Book> = {};
            fetchedBooks.forEach(book => {
                bookMap[book.id] = book;
            });
            setBooks(bookMap);

            // Combine Notes only
            const combinedItems: AnnotationItem[] = [
                ...fetchedNotes.map(n => ({ type: n.type as 'note' | 'highlight', data: n, date: n.createdAt })),
            ];

            // Sort by Date Descending
            combinedItems.sort((a, b) => b.date - a.date);
            setAllItems(combinedItems);
        } catch (error) {
            console.error('Failed to fetch notebook data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData({ silent: true });
        }, [fetchData])
    );

    const filteredItems = useMemo(() => {
        let items = allItems;

        // 1. Tab Filter
        if (activeTab === 'Highlights') {
            items = items.filter(i => i.type === 'highlight');
        } else if (activeTab === 'Notes') {
            items = items.filter(i => i.type === 'note');
        }

        // 2. Search Filter (Search content or book title)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item => {
                const bookTitle = books[item.data.bookId]?.title?.toLowerCase() || '';
                const content = (item.data as Note).fullText?.toLowerCase() || (item.data as Note).note?.toLowerCase() || '';

                return bookTitle.includes(query) || content.includes(query);
            });
        }

        // 3. Advanced Filters (Date, Book)
        // Book Filter
        if (filters.bookIds.length > 0) {
            items = items.filter(item => filters.bookIds.includes(item.data.bookId));
        }

        // Date Filter
        const now = Date.now();
        if (filters.dateRange === '7days') {
            const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
            items = items.filter(item => item.date >= sevenDaysAgo);
        } else if (filters.dateRange === '30days') {
            const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
            items = items.filter(item => item.date >= thirtyDaysAgo);
        }

        return items;
    }, [allItems, activeTab, searchQuery, filters, books]);

    const handleDelete = async (item: AnnotationItem) => {
        try {
            if (item.type === 'note' || item.type === 'highlight') {
                await NoteRepository.delete(item.data.id);
            }
            fetchData(); // Refresh
        } catch (e) {
            console.error("Failed to delete", e);
        }
    };

    return (
        <ScreenLayout>
            {/* Custom Header with Search */}
            <Box
                paddingHorizontal="m"
                paddingTop="l"
                paddingBottom="m"
                marginBottom="s"
            >
                {/* Top Row: Title */}
                <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m">
                    <Box>
                        <Text variant="header" fontSize={32} lineHeight={40} fontWeight="700">
                            {t('notebook.title')}
                        </Text>
                        {/* <Text variant="body" color="textSecondary" letterSpacing={1} fontSize={14} marginTop="xs">
                            {t('notebook.subtitle')}
                        </Text> */}
                    </Box>
                </Box>

                {/* Search Bar */}
                <Box>
                    <Input
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={t('notebook.search_placeholder')}
                        leftIcon="search-outline"
                        containerClassName="border-none"
                        style={{
                            backgroundColor: theme.colors.cardSecondary,
                            borderRadius: 12,
                            paddingVertical: 12,
                            borderWidth: 0,
                            height: 44
                        }}
                    />
                </Box>
            </Box>

            {/* Filter Chips Row with Advanced Button */}
            <Box
                marginBottom="s"
                paddingHorizontal="m"
                flexDirection="row"
                alignItems="center"
                gap="s"
            >
                {/* Scrollable Chips */}
                <Box flex={1}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={['All Items', 'Highlights', 'Notes']}
                        keyExtractor={(item) => item}
                        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                        renderItem={({ item }) => {
                            const isActive = activeTab === item;
                            return (
                                <TouchableOpacity
                                    onPress={() => setActiveTab(item)}
                                    activeOpacity={0.7}
                                >
                                    <Box
                                        paddingHorizontal="m"
                                        paddingVertical="s"
                                        borderRadius="full"
                                        backgroundColor={isActive ? 'primary' : 'cardSecondary'}
                                        borderWidth={1}
                                        borderColor={isActive ? 'primary' : 'border'}
                                        style={{
                                            // Slight shadow for active item
                                            shadowColor: isActive ? theme.colors.primary : 'transparent',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: isActive ? 0.3 : 0,
                                            shadowRadius: 4,
                                            elevation: isActive ? 4 : 0
                                        }}
                                    >
                                        <Text
                                            variant="caption"
                                            fontWeight="600"
                                            color={isActive ? 'white' : 'textSecondary'}
                                        >
                                            {item === 'All Items' ? t('notebook.types.all') :
                                                item === 'Highlights' ? t('notebook.types.highlight') :
                                                    item === 'Notes' ? t('notebook.types.note') : item}
                                        </Text>
                                    </Box>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </Box>

                {/* Advanced Filter Button (Fixed on Right) */}
                <TouchableOpacity
                    onPress={() => setIsFilterVisible(true)}
                    activeOpacity={0.7}
                >
                    <Box
                        padding="s"
                        borderRadius="full"
                        backgroundColor="cardSecondary"
                        borderWidth={1}
                        borderColor="border"
                        height={36}
                        width={36}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Ionicons
                            name="options-outline"
                            size={18}
                            color={theme.colors.textPrimary}
                        />
                    </Box>
                </TouchableOpacity>
            </Box>

            {/* List */}
            <FlatList
                style={{ flex: 1 }}
                contentInsetAdjustmentBehavior="never"
                data={filteredItems}
                keyExtractor={item => `${item.type}_${item.data.id}`}
                renderItem={({ item }) => (
                    <NotebookItem
                        type={item.type as any}
                        data={item.data}
                        book={books[item.data.bookId]}
                        onPress={() => {
                            // Navigate to Reader with correct location
                            // Note: Need to implement deep linking/navigation param to jump to CFI
                        }}
                        onDelete={() => handleDelete(item)}
                        onShare={() => { }}
                    />
                )}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, paddingTop: 8 }}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchData} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <Box flex={1} justifyContent="center" alignItems="center" marginTop="xl">
                            <Text variant="subheader" color="textSecondary" marginBottom="s">{t('notebook.empty.title')}</Text>
                            <Text variant="body" color="textSecondary" textAlign="center">{t('notebook.empty.subtitle')}</Text>
                        </Box>
                    ) : null
                }
            />

            <NotebookFilterModal
                visible={isFilterVisible}
                onClose={() => setIsFilterVisible(false)}
                books={Object.values(books)}
                currentFilters={filters as any}
                onApply={(newFilters) => {
                    setFilters(newFilters as any);
                    setIsFilterVisible(false);
                }}
            />
        </ScreenLayout>
    );
};

export default NotebookScreen;
