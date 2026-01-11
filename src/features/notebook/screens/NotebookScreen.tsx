import React, { useCallback, useState, useMemo, useRef } from 'react';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import NoteShareCard from '@/features/share/components/NoteShareCard';
import { FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';
import ScreenLayout from '@/components/ScreenLayout';
import NotebookItem from '@/features/notebook/components/NotebookItem';
import NotebookFilterModal from '@/features/notebook/components/NotebookFilterModal';
import SharePreviewModal from '@/features/share/components/SharePreviewModal';
import ShareEditModal from '@/features/share/components/ShareEditModal';
import { BookRepository } from '@/services/database/BookRepository';
import { NoteRepository } from '@/services/database/NoteRepository';
import { Book, Note } from '@/services/database/types';
import Input from '@/components/Input';

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

    // Share Logic State
    const [sharingItem, setSharingItem] = useState<AnnotationItem | null>(null);
    const [previewUri, setPreviewUri] = useState<string | null>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);

    // Edit Logic State
    const [isEditVisible, setIsEditVisible] = useState(false);
    const [customQuote, setCustomQuote] = useState('');
    const [customNote, setCustomNote] = useState('');

    const viewShotRef = useRef<ViewShot>(null);

    // Filters
    const [filters, setFilters] = useState({
        type: 'All Items',
        dateRange: 'all', // '7days', '30days', 'all', 'custom'
        bookIds: [] as string[],
        tags: [] as string[],
    });

    const activeTab = filters.type;
    const setActiveTab = (type: string) => setFilters(prev => ({ ...prev, type: type as any }));

    const searchInputStyle = useMemo(() => [
        styles.searchInput,
        { backgroundColor: theme.colors.cardSecondary }
    ], [theme.colors.cardSecondary]);

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

    /**
     * Step 1: User clicks Share. Open Edit Modal.
     */
    const handleShare = (item: AnnotationItem) => {
        setSharingItem(item);

        // Initialize with existing data
        const initialQuote = item.type === 'highlight' ? (item.data as any).fullText : '';
        const initialNote = item.type === 'note' ? (item.data as any).note : '';

        setCustomQuote(initialQuote || '');
        setCustomNote(initialNote || '');

        setIsEditVisible(true);
    };

    /**
     * Step 2: User confirms edits. Close Edit Modal, Wait for Render, Capture.
     */
    const handleConfirmEdit = (quote: string, note: string) => {
        setCustomQuote(quote);
        setCustomNote(note);
        setIsEditVisible(false);

        // Wait for next render cycle so NoteShareCard updates with new text
        setTimeout(async () => {
            try {
                if (viewShotRef.current?.capture) {
                    const uri = await viewShotRef.current.capture();
                    setPreviewUri(uri);
                    setIsPreviewVisible(true);
                }
            } catch (e) {
                console.error("Share capture failed", e);
                setSharingItem(null);
            }
        }, 300); // 300ms to be safe for layout update
    };

    const handleConfirmShare = async () => {
        if (!previewUri) return;

        try {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(previewUri, {
                    mimeType: 'image/png',
                    dialogTitle: t('notebook.share_title') || 'Share Note',
                    UTI: 'public.png'
                });
            }
        } catch (error) {
            console.error("Sharing failed", error);
        } finally {
            // Optional: Close modal after sharing or keep it open? 
            // Usually nice to close it if share was successful or initiated.
            setIsPreviewVisible(false);
            setSharingItem(null);
        }
    };

    const handleClosePreview = () => {
        setIsPreviewVisible(false);
        setSharingItem(null);
        setPreviewUri(null);
    };

    return (
        <ScreenLayout>
            {/* Hidden Share Card */}
            {sharingItem && (
                <Box position="absolute" left={-1000} top={0} opacity={0}>
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
                        <NoteShareCard
                            type={sharingItem.type as any}
                            quote={customQuote} // Use the custom (edited) quote
                            note={customNote}   // Use the custom (edited) note
                            bookTitle={books[sharingItem.data.bookId]?.title || t('common.unknown_book')}
                            author={books[sharingItem.data.bookId]?.author || t('common.unknown_author')}
                            date={new Date(sharingItem.date).toLocaleDateString()}
                        />
                    </ViewShot>
                </Box>
            )}
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
                        style={searchInputStyle}
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
                        contentContainerStyle={styles.chipsContent}
                        renderItem={({ item }) => {
                            const isActive = activeTab === item;

                            const chipStyle = [
                                styles.chip,
                                isActive && {
                                    shadowColor: theme.colors.primary,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 8,
                                    elevation: 3
                                }
                            ];

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
                                        style={chipStyle}
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
                        style={styles.filterButton}
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
                style={styles.flex1}
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
                        }}
                        onDelete={() => handleDelete(item)}
                        onShare={() => handleShare(item)}
                    />
                )}
                contentContainerStyle={styles.listContent}
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

            <SharePreviewModal
                visible={isPreviewVisible}
                imageUri={previewUri}
                onClose={handleClosePreview}
                onShare={handleConfirmShare}
            />

            <ShareEditModal
                visible={isEditVisible}
                initialQuote={customQuote}
                initialNote={customNote}
                onClose={() => {
                    setIsEditVisible(false);
                    setSharingItem(null);
                }}
                onConfirm={handleConfirmEdit}
            />
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    searchInput: {
        borderRadius: 12,
        paddingVertical: 12,
        borderWidth: 0,
        height: 44
    },
    chipsContent: {
        gap: 8,
        paddingRight: 8
    },
    chip: {
        // Shadow removed from inactive state for cleaner look
    },
    filterButton: {
        height: 36,
        width: 36
    },
    flex1: {
        flex: 1
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 80,
        paddingTop: 8
    }
});

export default NotebookScreen;
