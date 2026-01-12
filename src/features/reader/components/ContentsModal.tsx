import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Modal,
    Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, ChevronRight, BookOpen, NotebookPen } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Text from '@/components/Text';
import Box from '@/components/Box';
import { Theme } from '@/theme/theme';
import { EpubChapter } from '@/features/reader/utils/EpubService';
import { Bookmark, Note } from '@/services/database/types';
import { BookmarkRepository } from '@/services/database/BookmarkRepository';
import { NoteRepository } from '@/services/database/NoteRepository';

export type ContentsTab = 'contents' | 'bookmarks' | 'notes';

interface ContentsModalProps {
    visible: boolean;
    onClose: () => void;
    bookId: string;
    chapters: EpubChapter[];
    currentHref?: string;
    onSelectChapter: (href: string) => void;
    onSelectBookmark: (bookmark: Bookmark) => void;
    initialTab?: ContentsTab;
    availableTabs?: ContentsTab[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 340);

const ContentsModal: React.FC<ContentsModalProps> = ({
    visible,
    onClose,
    bookId,
    chapters,
    currentHref,
    onSelectChapter,
    onSelectBookmark,
    initialTab = 'contents',
    availableTabs = ['contents', 'bookmarks', 'notes'],
}) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();

    const isDark = useMemo(
        () =>
            ['#020617', '#0F172A', '#121212', '#000000', '#0C0A09', '#1C1917', '#292524'].includes(
                theme.colors.mainBackground,
            ),
        [theme.colors.mainBackground],
    );

    const [activeTab, setActiveTab] = useState<ContentsTab>(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        if (!bookId) return;
        setLoading(true);
        try {
            if (activeTab === 'bookmarks') {
                const data = await BookmarkRepository.getByBookId(bookId);
                setBookmarks(data.sort((a, b) => b.createdAt - a.createdAt));
            } else if (activeTab === 'notes') {
                const data = await NoteRepository.getByBookId(bookId);
                setNotes(data.sort((a, b) => b.createdAt - a.createdAt));
            }
        } finally {
            setLoading(false);
        }
    }, [bookId, activeTab]);

    const flattenChapters = useCallback(
        (items: EpubChapter[], level = 0): (EpubChapter & { level: number })[] => {
            let result: (EpubChapter & { level: number })[] = [];
            items.forEach((item) => {
                result.push({ ...item, level });
                if (item.subitems && item.subitems.length > 0) {
                    result = result.concat(flattenChapters(item.subitems, level + 1));
                }
            });
            return result;
        },
        [],
    );

    useEffect(() => {
        if (visible) {
            if (initialTab && availableTabs.includes(initialTab)) setActiveTab(initialTab);
            else if (availableTabs.length > 0) setActiveTab(availableTabs[0]);
            setSearchQuery('');
            loadData();
        }
    }, [visible, initialTab, availableTabs, loadData]);

    useEffect(() => {
        if (visible && activeTab !== 'contents') loadData();
    }, [activeTab, visible, loadData]);

    const flatChapters = useMemo(() => flattenChapters(chapters), [chapters, flattenChapters]);
    const filteredChapters = useMemo(
        () => flatChapters.filter((c) => c.label.toLowerCase().includes(searchQuery.toLowerCase())),
        [flatChapters, searchQuery],
    );

    const renderChapterItem = ({ item }: { item: EpubChapter & { level: number } }) => {
        const isCurrent = currentHref && item.href.includes(currentHref);
        return (
            <TouchableOpacity
                onPress={() => {
                    onSelectChapter(item.href);
                    onClose();
                }}
            >
                <Box
                    flexDirection="row"
                    alignItems="center"
                    paddingVertical="m"
                    paddingRight="m"
                    paddingLeft="m"
                    style={{ paddingLeft: theme.spacing.xl + item.level * 16 }}
                    backgroundColor={isCurrent ? (isDark ? 'glassStrong' : 'glass') : 'transparent'}
                >
                    <Box marginRight="m" width={4}>
                        {isCurrent && (
                            <Box
                                borderRadius="full"
                                width={4}
                                height={24}
                                backgroundColor="primary"
                            />
                        )}
                    </Box>
                    <Box flex={1}>
                        <Text
                            variant={isCurrent ? 'subheader' : 'body'}
                            style={{
                                fontSize: item.level === 0 ? 16 : 15,
                                fontWeight: isCurrent ? '700' : '500',
                                color: isCurrent ? theme.colors.primary : theme.colors.textPrimary,
                                opacity: isCurrent ? 1 : item.level === 0 ? 0.9 : 0.7,
                            }}
                            numberOfLines={2}
                        >
                            {item.label.trim()}
                        </Text>
                    </Box>
                    {!isCurrent && (
                        <ChevronRight size={16} color={theme.colors.textSecondary} opacity={0.5} />
                    )}
                </Box>
            </TouchableOpacity>
        );
    };

    const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
    const [editText, setEditText] = useState('');

    const handleDeleteBookmark = async (id: string) => {
        await BookmarkRepository.delete(id);
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
    };

    const handleUpdateBookmark = async () => {
        if (!editingBookmark) return;
        await BookmarkRepository.update(editingBookmark.id, { previewText: editText });
        setBookmarks((prev) =>
            prev.map((b) => (b.id === editingBookmark.id ? { ...b, previewText: editText } : b)),
        );
        setEditingBookmark(null);
    };

    const renderBookmarkItem = ({ item }: { item: Bookmark }) => (
        <Box
            padding="m"
            borderBottomWidth={1}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            borderColor="border"
        >
            <TouchableOpacity
                style={{ flex: 1, marginRight: 8 }}
                onPress={() => {
                    onSelectBookmark(item);
                    onClose();
                }}
            >
                <Text variant="caption" marginBottom="xs">
                    {new Date(item.createdAt).toLocaleString()} · {item.percentage.toFixed(1)}%
                </Text>
                <Text variant="body" fontWeight="500" numberOfLines={2}>
                    {item.previewText || t('reader.controls.bookmarks')}
                </Text>
            </TouchableOpacity>
            <Box flexDirection="row" alignItems="center" gap="s">
                <TouchableOpacity
                    onPress={() => {
                        setEditingBookmark(item);
                        setEditText(item.previewText || '');
                    }}
                >
                    <Box padding="s" borderRadius="full" backgroundColor="cardSecondary">
                        <NotebookPen size={16} color={theme.colors.textSecondary} />
                    </Box>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteBookmark(item.id)}>
                    <Box padding="s" borderRadius="full" backgroundColor="error" opacity={0.2}>
                        <X size={16} color={theme.colors.error} />
                    </Box>
                </TouchableOpacity>
            </Box>
        </Box>
    );

    const renderNoteItem = ({ item }: { item: Note }) => (
        <TouchableOpacity onPress={onClose}>
            <Box padding="m" borderBottomWidth={1} borderColor="border">
                <Box flexDirection="row" alignItems="center" marginBottom="s">
                    <Box
                        width={12}
                        height={12}
                        borderRadius="full"
                        marginRight="s"
                        style={{ backgroundColor: item.color || theme.colors.primary }}
                    />
                    <Text variant="caption">{new Date(item.createdAt).toLocaleDateString()}</Text>
                </Box>
                <Text variant="body" fontWeight="500" marginBottom="s" numberOfLines={3}>
                    "{item.fullText}"
                </Text>
                {item.note && (
                    <Text variant="caption" fontStyle="italic" color="textSecondary">
                        {item.note}
                    </Text>
                )}
            </Box>
        </TouchableOpacity>
    );

    const isContentsOnly = availableTabs.length === 1 && availableTabs[0] === 'contents';
    const title = isContentsOnly ? t('reader.controls.contents') : t('reader.controls.notes');
    const HeaderIcon = isContentsOnly ? BookOpen : NotebookPen;

    return (
        <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
            <Box position="absolute" top={0} bottom={0} left={0} right={0} style={{ zIndex: 1000 }}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <Box
                        position="absolute"
                        top={0}
                        bottom={0}
                        left={0}
                        right={0}
                        backgroundColor="black"
                        opacity={0.4}
                    />
                </TouchableOpacity>

                <Box
                    position="absolute"
                    top={0}
                    bottom={0}
                    left={0}
                    width={DRAWER_WIDTH}
                    backgroundColor="mainBackground"
                    borderTopRightRadius="xl"
                    borderBottomRightRadius="xl"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 10, height: 0 },
                        shadowOpacity: 0.25,
                        shadowRadius: 25,
                        elevation: 20,
                    }}
                    overflow="hidden"
                >
                    <Box flex={1} style={{ paddingTop: insets.top }}>
                        <Box
                            paddingHorizontal="xl"
                            paddingBottom="l"
                            paddingTop="m"
                            gap="m"
                            borderBottomWidth={1}
                            borderColor="border"
                        >
                            <Box
                                flexDirection="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Box flexDirection="row" alignItems="center">
                                    <Box
                                        width={32}
                                        height={32}
                                        borderRadius="full"
                                        alignItems="center"
                                        justifyContent="center"
                                        backgroundColor="glass"
                                    >
                                        <HeaderIcon size={18} color={theme.colors.primary} />
                                    </Box>
                                    <Box marginLeft="m">
                                        <Text variant="subheader" fontSize={22} fontWeight="700">
                                            {title}
                                        </Text>
                                    </Box>
                                </Box>
                            </Box>

                            {!isContentsOnly && (
                                <Box
                                    flexDirection="row"
                                    borderRadius="m"
                                    padding="xs"
                                    marginTop="s"
                                    backgroundColor="cardSecondary"
                                >
                                    {availableTabs.includes('notes') && (
                                        <TouchableOpacity
                                            onPress={() => setActiveTab('notes')}
                                            style={{ flex: 1 }}
                                        >
                                            <Box
                                                paddingVertical="s"
                                                borderRadius="s"
                                                alignItems="center"
                                                backgroundColor={
                                                    activeTab === 'notes'
                                                        ? isDark
                                                            ? 'cardSecondary'
                                                            : 'mainBackground'
                                                        : 'transparent'
                                                }
                                            >
                                                <Text
                                                    variant="small"
                                                    fontWeight="500"
                                                    color={
                                                        activeTab === 'notes'
                                                            ? 'primary'
                                                            : 'textSecondary'
                                                    }
                                                >
                                                    {t('reader.controls.notes')}
                                                </Text>
                                            </Box>
                                        </TouchableOpacity>
                                    )}
                                    {availableTabs.includes('bookmarks') && (
                                        <TouchableOpacity
                                            onPress={() => setActiveTab('bookmarks')}
                                            style={{ flex: 1 }}
                                        >
                                            <Box
                                                paddingVertical="s"
                                                borderRadius="s"
                                                alignItems="center"
                                                backgroundColor={
                                                    activeTab === 'bookmarks'
                                                        ? isDark
                                                            ? 'cardSecondary'
                                                            : 'mainBackground'
                                                        : 'transparent'
                                                }
                                            >
                                                <Text
                                                    variant="small"
                                                    fontWeight="500"
                                                    color={
                                                        activeTab === 'bookmarks'
                                                            ? 'primary'
                                                            : 'textSecondary'
                                                    }
                                                >
                                                    {t('reader.controls.bookmarks')}
                                                </Text>
                                            </Box>
                                        </TouchableOpacity>
                                    )}
                                </Box>
                            )}
                        </Box>

                        <Box flex={1}>
                            {activeTab === 'contents' ? (
                                <>
                                    <Box
                                        paddingHorizontal="xl"
                                        paddingVertical="m"
                                        backgroundColor="cardSecondary"
                                        opacity={0.6}
                                    >
                                        <Text
                                            variant="small"
                                            fontWeight="700"
                                            color="textTertiary"
                                            textTransform="uppercase"
                                        >
                                            {flatChapters.length} Chapters
                                        </Text>
                                    </Box>
                                    <Box paddingHorizontal="xl" paddingBottom="s">
                                        <Box
                                            borderRadius="m"
                                            paddingHorizontal="m"
                                            paddingVertical="s"
                                            flexDirection="row"
                                            alignItems="center"
                                            backgroundColor="cardSecondary"
                                        >
                                            <Search size={18} color={theme.colors.textTertiary} />
                                            <TextInput
                                                placeholder="Search chapters..."
                                                placeholderTextColor={theme.colors.textTertiary}
                                                style={{
                                                    flex: 1,
                                                    marginLeft: 8,
                                                    fontSize: 15,
                                                    color: theme.colors.textPrimary,
                                                }}
                                                value={searchQuery}
                                                onChangeText={setSearchQuery}
                                                clearButtonMode="while-editing"
                                            />
                                        </Box>
                                    </Box>
                                    <FlashList
                                        data={filteredChapters}
                                        keyExtractor={(item: any, index: number) =>
                                            item.id + item.href + index
                                        }
                                        renderItem={renderChapterItem}
                                        // @ts-expect-error FlashList types mismatch
                                        estimatedItemSize={60}
                                        contentContainerStyle={{
                                            paddingBottom: insets.bottom + 20,
                                        }}
                                    />
                                </>
                            ) : loading ? (
                                <Box flex={1} alignItems="center" justifyContent="center">
                                    <ActivityIndicator color={theme.colors.primary} />
                                </Box>
                            ) : activeTab === 'bookmarks' ? (
                                <FlashList<Bookmark>
                                    data={bookmarks}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderBookmarkItem}
                                    // @ts-expect-error FlashList types mismatch
                                    estimatedItemSize={100}
                                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                                    ListEmptyComponent={
                                        <Box
                                            alignItems="center"
                                            justifyContent="center"
                                            paddingVertical="xxl"
                                        >
                                            <Text color="textTertiary">No data</Text>
                                        </Box>
                                    }
                                />
                            ) : (
                                <FlashList<Note>
                                    data={notes}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderNoteItem}
                                    // @ts-expect-error FlashList types mismatch
                                    estimatedItemSize={100}
                                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                                    ListEmptyComponent={
                                        <Box
                                            alignItems="center"
                                            justifyContent="center"
                                            paddingVertical="xxl"
                                        >
                                            <Text color="textTertiary">No data</Text>
                                        </Box>
                                    }
                                />
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {editingBookmark && (
                <Box
                    position="absolute"
                    top={0}
                    bottom={0}
                    left={0}
                    right={0}
                    backgroundColor="overlay"
                    justifyContent="center"
                    alignItems="center"
                    style={{ zIndex: 2000 }}
                >
                    <Box
                        width="80%"
                        borderRadius="xl"
                        padding="xl"
                        backgroundColor="mainBackground"
                    >
                        <Text variant="subheader" fontSize={18} marginBottom="m">
                            Edit Bookmark
                        </Text>
                        <TextInput
                            value={editText}
                            onChangeText={setEditText}
                            placeholder="Enter bookmark title..."
                            placeholderTextColor={theme.colors.textTertiary}
                            style={{
                                padding: 12,
                                borderRadius: 8,
                                marginBottom: 20,
                                backgroundColor: theme.colors.cardSecondary,
                                color: theme.colors.textPrimary,
                            }}
                            autoFocus
                        />
                        <Box flexDirection="row" justifyContent="flex-end" gap="l">
                            <TouchableOpacity onPress={() => setEditingBookmark(null)}>
                                <Text fontWeight="600" color="textSecondary">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateBookmark}>
                                <Text fontWeight="600" color="primary">
                                    Save
                                </Text>
                            </TouchableOpacity>
                        </Box>
                    </Box>
                </Box>
            )}
        </Modal>
    );
};

export default ContentsModal;
