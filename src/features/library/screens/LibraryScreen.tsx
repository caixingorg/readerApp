import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import ScreenLayout from '../../../components/ScreenLayout';
import FeaturedBook from '../components/FeaturedBook';
import RecentBooksList from '../components/RecentBooksList';
import BookItem from '../components/BookItem';
import EmptyState from '../components/EmptyState';
import EditBookModal from '../components/EditBookModal';
import ActionSheetModal, { ActionItem } from '../../../components/ActionSheetModal';
import { View } from 'react-native';
import { ReadingSessionRepository } from '../../../services/database/ReadingSessionRepository';
import { calculateStreak } from '../../stats/utils/statsUtils';
import { useBooks, useDeleteBook, useUpdateBook } from '../hooks/useBooks';
import { Theme } from '../../../theme/theme';
import { RootStackParamList } from '../../../types/navigation';
import { Book } from '../../../services/database';
import { useLibrarySettings } from '../stores/useLibrarySettings';
import Toast from 'react-native-toast-message';
import ViewLayoutToggle from '../components/ViewLayoutToggle';
import { MOCK_BOOKS } from '../data/mockBooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = height * 0.65; // Use 65% of screen height to fill vertical space
const SPACING = (width - CARD_WIDTH) / 2;

const LibraryScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const { t, i18n } = useTranslation();
    const { data: books = [], isLoading, refetch: loadBooks } = useBooks();
    const deleteBook = useDeleteBook();
    const updateBook = useUpdateBook();
    const [searchQuery, setSearchQuery] = useState('');

    // UI States - from Store
    const {
        viewMode,
        setViewMode,
        sortMode, setSortMode,
        showFileSize,
        showFormatLabel
    } = useLibrarySettings();

    const [editingBook, setEditingBook] = useState<Book | null>(null);

    // ActionSheet Configuration
    const [actionSheetVisible, setActionSheetVisible] = useState(false);
    const [actionSheetTitle, setActionSheetTitle] = useState('');
    const [actionSheetActions, setActionSheetActions] = useState<ActionItem[]>([]);

    // Stats State
    const [streak, setStreak] = useState(0);

    useFocusEffect(
        useCallback(() => {
            loadBooks();
            // Fetch Streak
            const fetchStats = async () => {
                const stats = await ReadingSessionRepository.getDailyReadingStats(14);
                setStreak(calculateStreak(stats));
            };
            fetchStats();
        }, [loadBooks])
    );



    /**
     * Sort books
     */
    const processedBooks = useMemo(() => {
        // Merge real books with mock books for demo purposes
        // Filter out mocks if real books with same ID exist (though unlikely with string vs mock_ prefix)
        // Or simply concat.
        let result = [...books, ...MOCK_BOOKS];

        // Search Filter (only if needed)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(book =>
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query)
            );
        }

        // Sort
        switch (sortMode) {
            case 'title':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'author':
                result.sort((a, b) => a.author.localeCompare(b.author));
                break;
            case 'recent':
            default:
                result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                break;
        }

        return result;
    }, [books, searchQuery, sortMode]);

    /**
     * Actions
     */
    const showActionSheet = (title: string, actions: ActionItem[]) => {
        setActionSheetTitle(title);
        setActionSheetActions(actions);
        setActionSheetVisible(true);
    };

    const handleMenuAction = (book: Book) => {
        showActionSheet(t('library.actions.option_title', { title: book.title }), [
            { label: t('library.actions.edit_info'), onPress: () => setEditingBook(book) },
            { label: t('library.actions.delete'), destructive: true, keepOpenOnPress: true, onPress: () => confirmDeleteBook(book) },
            { label: t('library.actions.cancel'), cancel: true, onPress: () => { } }
        ]);
    };

    const confirmDeleteBook = (book: Book) => {
        showActionSheet(t('library.actions.delete_confirm', { title: book.title }), [
            { label: t('library.actions.confirm_delete'), destructive: true, onPress: () => executeDeleteBook(book.id) },
            { label: t('library.actions.cancel'), cancel: true, onPress: () => { } }
        ]);
    };

    const executeDeleteBook = async (bookId: string) => {
        try {
            await deleteBook.mutateAsync(bookId);
            Toast.show({ type: 'success', text1: t('library.toast.deleted_success') });
        } catch (error) {
            Toast.show({ type: 'error', text1: t('library.toast.delete_failed'), text2: String(error) });
        }
    };

    const handleSaveBook = async (id: string, updates: Partial<Book>) => {
        await updateBook.mutateAsync({ id, data: updates });
        Toast.show({ type: 'success', text1: t('library.toast.updated_success') });
    };

    const handleBookPress = (bookId: string) => {
        navigation.navigate('Reader', { bookId });
    };

    const handleFilterPress = () => {
        showActionSheet(t('library.actions.sort_title') || 'Sort Books', [
            { label: t('library.sort.recent') || 'Recent', onPress: () => setSortMode('recent') },
            { label: t('library.sort.title') || 'Title', onPress: () => setSortMode('title') },
            { label: t('library.sort.author') || 'Author', onPress: () => setSortMode('author') },
            { label: t('common.cancel'), cancel: true, onPress: () => { } }
        ]);
    };

    // Handler for View Toggle
    const handleToggleView = (layout: 'carousel' | 'list') => {
        setViewMode(layout);
    };

    if (isLoading) {
        return (
            <Box flex={1} backgroundColor="mainBackground" justifyContent="center" alignItems="center">
                <Text variant="body" color="textSecondary">{t('library.loading')}</Text>
            </Box>
        );
    }

    return (
        <ScreenLayout>
            {/* Editorial Header */}
            <Box
                paddingHorizontal="m"
                paddingTop="m"
                paddingBottom="m"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                backgroundColor="mainBackground"
            >
                <Box>
                    <Text variant="header" fontSize={32} fontWeight="800" letterSpacing={-0.5} color="textPrimary">
                        {t('library.title')}
                    </Text>
                    {/* Date or Greeting */}
                    <Text variant="caption" color="textSecondary" textTransform="uppercase" letterSpacing={1}>
                        {new Date().toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                </Box>

                {/* Stats / Streak Chip */}
                <Box flexDirection="row" alignItems="center">
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: theme.colors.cardSecondary,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            marginRight: 16
                        }}
                    >
                        <Ionicons name="flame" size={16} color={theme.colors.primary} />
                        <Text variant="caption" fontWeight="bold" marginLeft="s" color="textPrimary">
                            {streak} {t('stats.streak')}
                        </Text>
                    </View>

                    <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                        <Ionicons name="search" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                </Box>
            </Box>

            {/* Content Area */}
            <FlatList
                data={processedBooks}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: 100
                }}
                ListHeaderComponent={
                    <Box marginBottom="xl">
                        {/* Featured Book Section (Hero) */}
                        {processedBooks.length > 0 && (
                            <Box paddingHorizontal="m" marginBottom="xl" marginTop="s">
                                <FeaturedBook
                                    book={processedBooks[0]}
                                    onPress={() => handleBookPress(processedBooks[0].id)}
                                />
                            </Box>
                        )}

                        {/* Recent / On Your Desk Section */}
                        {processedBooks.length > 1 && (
                            <Box marginBottom="xl">
                                <RecentBooksList
                                    books={processedBooks.slice(1, 6)} // Next 5 books
                                    onBookPress={handleBookPress}
                                    onMorePress={() => setSortMode('recent')}
                                />
                            </Box>
                        )}

                        {/* "All Books" Section Title */}
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m" paddingHorizontal="m">
                            <Text variant="subheader" fontSize={20} color="textPrimary" fontWeight="700">
                                {t('library.collection')}
                            </Text>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={handleFilterPress}
                            >
                                <Text variant="caption" color="textSecondary" marginRight="s">
                                    {t('library.items_count', { count: processedBooks.length })}
                                </Text>
                                <Ionicons name="filter" size={16} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </Box>
                    </Box>
                }
                renderItem={({ item, index }) => {
                    // Skip the first 6 items if they are shown in Featured or Recent
                    // Wait, designs usually duplicate "Recent" in "All" or remove them.
                    // For "All Books", usually users expect *all* books.
                    // Let's show all books in the list for completeness, or just skip the featured one.
                    // To keep it simple and useful: "Collection" is the full alphabetized/sorted list.

                    return (
                        <Box paddingHorizontal="m">
                            <BookItem
                                book={item}
                                viewMode="list"
                                onPress={() => handleBookPress(item.id)}
                                onMenuPress={() => handleMenuAction(item)}
                                onLongPress={() => handleMenuAction(item)}
                                showFileSize={false}
                                showFormatLabel={true}
                            />
                        </Box>
                    );
                }}
                ListEmptyComponent={
                    <Box flex={1} alignItems="center" marginTop="xl">
                        <EmptyState onImport={() => navigation.navigate('Import')} onWiFi={() => navigation.navigate('Import')} />
                    </Box>
                }
            />

            {/* Import FAB */}
            <Box
                position="absolute"
                bottom={insets.bottom + 80} // TabBar height (~60-70) + extra spacing
                right={24}
                style={{
                    shadowColor: theme.colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Import')}
                >
                    <Box
                        width={56}
                        height={56}
                        borderRadius="full"
                        backgroundColor="primary"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Ionicons name="add" size={32} color="white" />
                    </Box>
                </TouchableOpacity>
            </Box>

            <EditBookModal
                key={editingBook?.id}
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
