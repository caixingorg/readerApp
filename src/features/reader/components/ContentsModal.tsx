import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, View, TextInput, ActivityIndicator, Platform, Dimensions, Modal } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Search, X, ChevronRight, Bookmark as BookmarkIcon, FileText, List as ListIcon, BookOpen, NotebookPen } from 'lucide-react-native';
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
    availableTabs = ['contents', 'bookmarks', 'notes']
}) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();

    // Robust checks against "Pro Max" dark palette (Slate + Stone)
    const isDark = useMemo(() => [
        '#020617', '#0F172A', '#121212', '#000000',
        '#0C0A09', '#1C1917', '#292524'
    ].includes(theme.colors.mainBackground), [theme.colors.mainBackground]);

    const [activeTab, setActiveTab] = useState<ContentsTab>(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (initialTab && availableTabs.includes(initialTab)) {
                setActiveTab(initialTab);
            } else if (availableTabs.length > 0) {
                setActiveTab(availableTabs[0]);
            }
            setSearchQuery('');
            loadData();
        }
    }, [visible, initialTab]);

    useEffect(() => {
        if (visible && activeTab !== 'contents') {
            loadData();
        }
    }, [activeTab, visible]);

    const loadData = async () => {
        if (activeTab === 'bookmarks') {
            setLoading(true);
            try {
                const data = await BookmarkRepository.getByBookId(bookId);
                setBookmarks(data.sort((a, b) => b.createdAt - a.createdAt));
            } catch (e) { } finally { setLoading(false); }
        } else if (activeTab === 'notes') {
            setLoading(true);
            try {
                const data = await NoteRepository.getByBookId(bookId);
                setNotes(data.sort((a, b) => b.createdAt - a.createdAt));
            } catch (e) { } finally { setLoading(false); }
        }
    };

    const flattenChapters = (items: EpubChapter[], level = 0): (EpubChapter & { level: number })[] => {
        let result: (EpubChapter & { level: number })[] = [];
        items.forEach(item => {
            result.push({ ...item, level });
            if (item.subitems && item.subitems.length > 0) {
                result = result.concat(flattenChapters(item.subitems, level + 1));
            }
        });
        return result;
    };

    const flatChapters = useMemo(() => flattenChapters(chapters), [chapters]);
    const filteredChapters = useMemo(() => flatChapters.filter(c =>
        c.label.toLowerCase().includes(searchQuery.toLowerCase())
    ), [flatChapters, searchQuery]);

    const renderChapterItem = ({ item }: { item: EpubChapter & { level: number } }) => {
        const isCurrent = currentHref && item.href.includes(currentHref);
        return (
            <TouchableOpacity
                style={[
                    styles.chapterItem,
                    {
                        paddingLeft: 24 + item.level * 16,
                        backgroundColor: isCurrent ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent',
                        marginBottom: item.level === 0 ? 4 : 0
                    }
                ]}
                onPress={() => { onSelectChapter(item.href); onClose(); }}
            >
                <View style={styles.indicatorContainer}>
                    {isCurrent && (
                        <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }]} />
                    )}
                </View>
                <View style={styles.flex1}>
                    <Text
                        variant={isCurrent ? "subheader" : "body"} // Use variant or style override
                        style={{
                            fontSize: item.level === 0 ? 16 : 15, // Dynamic font size based on level
                            fontWeight: isCurrent ? '700' : '500',
                            color: isCurrent ? theme.colors.primary : theme.colors.textPrimary,
                            opacity: isCurrent ? 1 : (item.level === 0 ? 0.9 : 0.7),
                        }}
                        numberOfLines={2}
                    >
                        {item.label.trim()}
                    </Text>
                </View>
                {!isCurrent && (
                    <ChevronRight size={16} color={theme.colors.textSecondary} opacity={0.5} />
                )}
            </TouchableOpacity>
        );
    };

    const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
    const [editText, setEditText] = useState('');

    const handleDeleteBookmark = async (id: string) => {
        try {
            await BookmarkRepository.delete(id);
            setBookmarks(prev => prev.filter(b => b.id !== id));
        } catch (e) { console.error(e); }
    };

    const handleUpdateBookmark = async () => {
        if (!editingBookmark) return;
        try {
            await BookmarkRepository.update(editingBookmark.id, { previewText: editText });
            setBookmarks(prev => prev.map(b => b.id === editingBookmark.id ? { ...b, previewText: editText } : b));
            setEditingBookmark(null);
        } catch (e) { console.error(e); }
    };

    const renderBookmarkItem = ({ item }: { item: Bookmark }) => (
        <View style={[styles.itemContainer, { borderColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
            <TouchableOpacity
                style={[styles.flex1, { marginRight: 8 }]}
                onPress={() => { onSelectBookmark(item); onClose(); }}
            >
                <Text variant="caption" style={{ marginBottom: 4 }}>
                    {new Date(item.createdAt).toLocaleString()} · {item.percentage.toFixed(1)}%
                </Text>
                <Text variant="body" fontWeight="500" numberOfLines={2}>
                    {item.previewText || t('reader.controls.bookmarks')}
                </Text>
            </TouchableOpacity>
            <View style={styles.row}>
                <TouchableOpacity
                    onPress={() => { setEditingBookmark(item); setEditText(item.previewText || ''); }}
                    style={[styles.actionButton, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}
                >
                    <NotebookPen size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDeleteBookmark(item.id)}
                    style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2' }]} // faint red
                >
                    <X size={16} color={theme.colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderNoteItem = ({ item }: { item: Note }) => (
        <TouchableOpacity
            style={[styles.itemContainer, { borderColor: isDark ? '#1F2937' : '#F3F4F6' }]}
            onPress={() => { onClose(); }}
        >
            <View style={styles.dateRow}>
                <View style={[styles.dot, { backgroundColor: item.color || theme.colors.primary }]} />
                <Text variant="caption">
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <Text variant="body" fontWeight="500" marginBottom="s" numberOfLines={3}>
                "{item.fullText}"
            </Text>
            {item.note && (
                <Text variant="caption" fontStyle="italic" style={{ color: theme.colors.textSecondary }}>
                    {item.note}
                </Text>
            )}
        </TouchableOpacity>
    );

    // Dynamic Title Logic
    const isContentsOnly = availableTabs.length === 1 && availableTabs[0] === 'contents';
    const title = isContentsOnly ? t('reader.controls.contents') : t('reader.controls.notes');
    const HeaderIcon = isContentsOnly ? BookOpen : NotebookPen;

    const TabButton = ({ id, label }: { id: ContentsTab, label: string }) => {
        const isActive = activeTab === id;
        return (
            <TouchableOpacity
                style={[
                    styles.tabButton,
                    isActive && { backgroundColor: isDark ? '#374151' : '#FFFFFF', shadowOpacity: 0.1 }
                ]}
                onPress={() => setActiveTab(id)}
            >
                <Text
                    variant="small"
                    style={{
                        fontWeight: '500',
                        color: isActive ? theme.colors.primary : theme.colors.textSecondary
                    }}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
            <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
                </TouchableOpacity>

                {/* Drawer Panel */}
                <View
                    style={[
                        styles.drawer,
                        {
                            width: DRAWER_WIDTH,
                            backgroundColor: isDark ? '#020617' : '#FFFFFF',
                            borderTopRightRadius: 20,
                            borderBottomRightRadius: 20,
                        }
                    ]}
                >
                    <View style={{ flex: 1, paddingTop: insets.top }}>
                        {/* Premium Header */}
                        <View
                            style={[
                                styles.headerContainer,
                                { borderBottomColor: isDark ? '#1F2937' : '#F3F4F6' }
                            ]}
                        >
                            <View style={styles.rowBetween}>
                                <View style={styles.row}>
                                    <View
                                        style={[
                                            styles.headerIcon,
                                            { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.1)' }
                                        ]}
                                    >
                                        <HeaderIcon size={18} color={theme.colors.primary} />
                                    </View>
                                    <Text variant="subheader" fontSize={22} fontWeight="700" letterSpacing={0.5}>
                                        {title}
                                    </Text>
                                </View>
                            </View>

                            {/* Segmented Control (Tabs) */}
                            {!isContentsOnly && (
                                <View style={[styles.tabsContainer, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                                    {availableTabs.includes('notes') && (
                                        <TabButton id="notes" label={t('reader.controls.notes')} />
                                    )}
                                    {availableTabs.includes('bookmarks') && (
                                        <TabButton id="bookmarks" label={t('reader.controls.bookmarks')} />
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Stats or Info Header (Only for Contents) */}
                        {activeTab === 'contents' && (
                            <View style={[styles.statsContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F9FAFB' }]}>
                                <Text variant="small" fontWeight="700" style={[styles.statsText, { color: theme.colors.textTertiary }]}>
                                    {flatChapters.length} Chapters
                                </Text>
                            </View>
                        )}

                        {/* Search Bar (Only for Contents) */}
                        {activeTab === 'contents' && (
                            <View style={styles.searchContainer}>
                                <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}>
                                    <Search size={18} color={theme.colors.textTertiary} />
                                    <TextInput
                                        placeholder="Search chapters..."
                                        placeholderTextColor={theme.colors.textTertiary}
                                        style={[styles.searchInput, { color: theme.colors.textPrimary }]}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        clearButtonMode="while-editing"
                                    />
                                </View>
                            </View>
                        )}

                        {/* Content List */}
                        <View style={{ flex: 1 }}>
                            {activeTab === 'contents' ? (
                                <FlatList
                                    data={filteredChapters}
                                    keyExtractor={(item, index) => item.id + item.href + index}
                                    renderItem={renderChapterItem}
                                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                                    showsVerticalScrollIndicator={false}
                                />
                            ) : loading ? (
                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                    <ActivityIndicator color={theme.colors.primary} />
                                </View>
                            ) : activeTab === 'bookmarks' ? (
                                <FlatList
                                    data={bookmarks}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderBookmarkItem}
                                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                                    ListEmptyComponent={
                                        <View style={styles.emptyState}>
                                            <Text style={{ color: theme.colors.textTertiary }}>No bookmarks yet</Text>
                                        </View>
                                    }
                                />
                            ) : (
                                <FlatList
                                    data={notes}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderNoteItem}
                                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                                    ListEmptyComponent={
                                        <View style={styles.emptyState}>
                                            <Text style={{ color: theme.colors.textTertiary }}>No notes yet</Text>
                                        </View>
                                    }
                                />
                            )}
                        </View>
                    </View>
                </View>
            </View>

            {/* Edit Modal Overlay */}
            {editingBookmark && (
                <View style={styles.overlay}>
                    <View style={[styles.editModal, { backgroundColor: isDark ? '#1F2937' : 'white' }]}>
                        <Text variant="subheader" fontSize={18} marginBottom="m">
                            Edit Bookmark
                        </Text>
                        <TextInput
                            value={editText}
                            onChangeText={setEditText}
                            placeholder="Enter bookmark title..."
                            placeholderTextColor={theme.colors.textTertiary}
                            style={[
                                styles.editInput,
                                {
                                    backgroundColor: isDark ? '#374151' : '#F3F4F6',
                                    color: theme.colors.textPrimary,
                                }
                            ]}
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setEditingBookmark(null)}>
                                <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateBookmark}>
                                <Text style={[styles.saveText, { color: theme.colors.primary }]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </Modal>
    );
};

const styles = StyleSheet.create({
    drawer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        shadowColor: "#000",
        shadowOffset: { width: 10, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 20,
        overflow: 'hidden',
    },
    chapterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingRight: 20
    },
    indicatorContainer: {
        marginRight: 12,
        width: 4
    },
    activeIndicator: {
        borderRadius: 999,
        width: 4,
        height: 24
    },
    itemContainer: {
        padding: 16,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    actionButton: {
        padding: 8,
        borderRadius: 999
    },
    tabButton: {
        flex: 1,
        paddingVertical: 6,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center'
    },
    flex1: {
        flex: 1
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerContainer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 16,
        gap: 16,
        borderBottomWidth: 1,
    },
    headerIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    tabsContainer: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 4,
        marginTop: 8
    },
    statsContainer: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginBottom: 8
    },
    statsText: {
        letterSpacing: 1.5,
        textTransform: 'uppercase'
    },
    searchContainer: {
        paddingHorizontal: 24,
        paddingBottom: 8
    },
    searchBar: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center'
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000
    },
    editModal: {
        width: '80%',
        borderRadius: 16,
        padding: 20
    },
    editInput: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 20
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16
    },
    cancelText: {
        fontWeight: '600'
    },
    saveText: {
        fontWeight: '600'
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8
    }
});

export default ContentsModal;
