import { useState, useMemo, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { Theme } from '@/theme/theme';
import { useTheme } from '@shopify/restyle';
import { ReadingSessionRepository } from '@/services/database/ReadingSessionRepository';
import { calculateStreak } from '@/features/stats/utils/statsUtils';
import { useBooks, useDeleteBook, useUpdateBook } from './useBooks';
import { useLibrarySettings } from '@/features/library/stores/useLibrarySettings';
import { Book } from '@/services/database';
import { RootStackParamList } from '@/types/navigation';
import { ActionItem } from '@/components/ActionSheetModal';

export const useLibraryLogic = () => {
    const theme = useTheme<Theme>();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { t } = useTranslation();

    // Data Hooks
    const { data: books = [], isLoading, refetch: loadBooks } = useBooks();
    const deleteBook = useDeleteBook();
    const updateBook = useUpdateBook();

    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [streak, setStreak] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // Settings Store
    const { viewMode, setViewMode, sortMode, setSortMode } = useLibrarySettings();

    // Action Sheet State
    const [actionSheetVisible, setActionSheetVisible] = useState(false);
    const [actionSheetTitle, setActionSheetTitle] = useState('');
    const [actionSheetActions, setActionSheetActions] = useState<ActionItem[]>([]);

    const loadStatsAndBooks = useCallback(async () => {
        loadBooks();
        const stats = await ReadingSessionRepository.getDailyReadingStats(14);
        setStreak(calculateStreak(stats));
    }, [loadBooks]);

    // --- Effects ---

    useFocusEffect(
        useCallback(() => {
            loadStatsAndBooks();
        }, [loadStatsAndBooks]),
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadStatsAndBooks();
        setRefreshing(false);
    }, [loadStatsAndBooks]);

    // --- Data Processing (Sort/Filter) ---

    const processedBooks = useMemo(() => {
        let result = [...books];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (book) =>
                    book.title.toLowerCase().includes(query) ||
                    book.author.toLowerCase().includes(query),
            );
        }

        switch (sortMode) {
            case 'title':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'author':
                result.sort((a, b) => a.author.localeCompare(b.author));
                break;
            case 'recent':
            default:
                result.sort((a, b) => {
                    const timeA = a.lastRead || a.createdAt || 0;
                    const timeB = b.lastRead || b.createdAt || 0;
                    return timeB - timeA;
                });
                break;
        }
        return result;
    }, [books, searchQuery, sortMode]);

    // --- Actions ---

    const showActionSheet = (title: string, actions: ActionItem[]) => {
        setActionSheetTitle(title);
        setActionSheetActions(actions);
        setActionSheetVisible(true);
    };

    const confirmDeleteBook = (book: Book) => {
        showActionSheet(t('library.actions.delete_confirm', { title: book.title }), [
            {
                label: t('library.actions.confirm_delete'),
                destructive: true,
                onPress: async () => {
                    try {
                        await deleteBook.mutateAsync(book.id);
                        Toast.show({ type: 'success', text1: t('library.toast.deleted_success') });
                    } catch (error) {
                        Toast.show({
                            type: 'error',
                            text1: t('library.toast.delete_failed'),
                            text2: String(error),
                        });
                    }
                },
            },
            { label: t('library.actions.cancel'), cancel: true, onPress: () => {} },
        ]);
    };

    const handleMenuAction = (book: Book) => {
        showActionSheet(t('library.actions.option_title', { title: book.title }), [
            { label: t('library.actions.edit_info'), onPress: () => setEditingBook(book) },
            {
                label: t('library.actions.delete'),
                destructive: true,
                keepOpenOnPress: true,
                onPress: () => confirmDeleteBook(book),
            },
            { label: t('library.actions.cancel'), cancel: true, onPress: () => {} },
        ]);
    };

    const handleSaveBook = async (id: string, updates: Partial<Book>) => {
        await updateBook.mutateAsync({ id, data: updates });
        Toast.show({ type: 'success', text1: t('library.toast.updated_success') });
    };

    const handleFilterPress = () => {
        showActionSheet(t('library.actions.sort_title') || 'Sort Books', [
            { label: t('library.sort.recent') || 'Recent', onPress: () => setSortMode('recent') },
            { label: t('library.sort.title') || 'Title', onPress: () => setSortMode('title') },
            { label: t('library.sort.author') || 'Author', onPress: () => setSortMode('author') },
            { label: t('common.cancel'), cancel: true, onPress: () => {} },
        ]);
    };

    const handleBookPress = (bookId: string) => {
        navigation.navigate('Reader', { bookId });
    };

    const handleImportPress = () => navigation.navigate('Import');
    const handleSearchPress = () => navigation.navigate('Search');

    return {
        // Data
        books: processedBooks,
        streak,
        refreshing,
        isLoading,

        // Modal States
        actionSheet: {
            visible: actionSheetVisible,
            title: actionSheetTitle,
            actions: actionSheetActions,
            close: () => setActionSheetVisible(false),
        },
        editingBook,
        setEditingBook,

        // Settings / UI
        searchQuery,
        setSearchQuery,
        viewMode,
        setViewMode,
        theme,

        // Handlers
        onRefresh,
        handleBookPress,
        handleMenuAction,
        handleSaveBook,
        handleFilterPress,
        handleImportPress,
        handleSearchPress,
    };
};
