import { useCallback, useState, useMemo, useRef } from 'react';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BookRepository } from '@/services/database/BookRepository';
import { NoteRepository } from '@/services/database/NoteRepository';
import { Book, Note } from '@/services/database/types';

export type AnnotationItem = { type: 'note'; data: Note; date: number };

export interface FilterOptions {
    dateRange: '7days' | '30days' | 'all' | 'custom';
    bookIds: string[];
    tags: string[];
    type: 'All Items' | 'Notes' | 'Bookmarks';
}

export const useNotebookLogic = () => {
    const { t } = useTranslation();
    const [books, setBooks] = useState<Record<string, Book>>({});
    const [allItems, setAllItems] = useState<AnnotationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    // Share & Edit State
    const [sharingItem, setSharingItem] = useState<AnnotationItem | null>(null);
    const [previewUri, setPreviewUri] = useState<string | null>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [isEditVisible, setIsEditVisible] = useState(false);
    const [customQuote, setCustomQuote] = useState('');
    const [customNote, setCustomNote] = useState('');

    const viewShotRef = useRef<any>(null);

    const [filters, setFilters] = useState<FilterOptions>({
        type: 'All Items',
        dateRange: 'all',
        bookIds: [],
        tags: [],
    });

    const activeTab = filters.type;

    const fetchData = useCallback(async (options?: { silent?: boolean }) => {
        try {
            if (!options?.silent) setLoading(true);
            const [fetchedBooks, fetchedNotes] = await Promise.all([
                BookRepository.getAll(),
                NoteRepository.getAll(),
            ]);

            const bookMap: Record<string, Book> = {};
            fetchedBooks.forEach((book) => {
                bookMap[book.id] = book;
            });
            setBooks(bookMap);

            const combinedItems: AnnotationItem[] = fetchedNotes
                .filter((n) => n.type === 'note')
                .map((n) => ({
                    type: 'note' as const,
                    data: n,
                    date: n.createdAt,
                }));

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
        }, [fetchData]),
    );

    const filteredItems = useMemo(() => {
        let items = allItems;

        if (activeTab === 'Notes') {
            items = items.filter((i) => i.type === 'note');
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            items = items.filter((item) => {
                const bookTitle = books[item.data.bookId]?.title?.toLowerCase() || '';
                const content =
                    item.data.fullText?.toLowerCase() || item.data.note?.toLowerCase() || '';
                return bookTitle.includes(query) || content.includes(query);
            });
        }

        if (filters.bookIds.length > 0) {
            items = items.filter((item) => filters.bookIds.includes(item.data.bookId));
        }

        const now = Date.now();
        if (filters.dateRange === '7days') {
            const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
            items = items.filter((item) => item.date >= sevenDaysAgo);
        } else if (filters.dateRange === '30days') {
            const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
            items = items.filter((item) => item.date >= thirtyDaysAgo);
        }

        return items;
    }, [allItems, activeTab, searchQuery, filters, books]);

    const handleDelete = async (item: AnnotationItem) => {
        try {
            await NoteRepository.delete(item.data.id);
            fetchData();
        } catch (e) {
            console.error('Failed to delete', e);
        }
    };

    const handleShare = (item: AnnotationItem) => {
        setSharingItem(item);
        setCustomQuote(item.data.fullText || '');
        setCustomNote(item.data.note || '');
        setIsEditVisible(true);
    };

    const handleConfirmEdit = (quote: string, note: string) => {
        setCustomQuote(quote);
        setCustomNote(note);
        setIsEditVisible(false);

        setTimeout(async () => {
            try {
                if (viewShotRef.current?.capture) {
                    const uri = await viewShotRef.current.capture();
                    setPreviewUri(uri);
                    setIsPreviewVisible(true);
                }
            } catch (e) {
                console.error('Share capture failed', e);
                setSharingItem(null);
            }
        }, 300);
    };

    const handleConfirmShare = async () => {
        if (!previewUri) return;
        try {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(previewUri, {
                    mimeType: 'image/png',
                    dialogTitle: t('notebook.share_title') || 'Share Note',
                    UTI: 'public.png',
                });
            }
        } catch (error) {
            console.error('Sharing failed', error);
        } finally {
            setIsPreviewVisible(false);
            setSharingItem(null);
        }
    };

    const handleClosePreview = () => {
        setIsPreviewVisible(false);
        setSharingItem(null);
        setPreviewUri(null);
    };

    return {
        books,
        allItems,
        filteredItems,
        loading,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        isFilterVisible,
        setIsFilterVisible,
        sharingItem,
        setSharingItem,
        previewUri,
        isPreviewVisible,
        isEditVisible,
        setIsEditVisible,
        customQuote,
        customNote,
        viewShotRef,
        fetchData,
        handleDelete,
        handleShare,
        handleConfirmEdit,
        handleConfirmShare,
        handleClosePreview,
        activeTab,
    };
};
