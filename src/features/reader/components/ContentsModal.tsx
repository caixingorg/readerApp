import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, View, TextInput, ActivityIndicator, Platform, Dimensions, Modal } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import clsx from 'clsx';
import { Search, X, ChevronRight, Bookmark as BookmarkIcon, FileText, List as ListIcon, BookOpen, NotebookPen } from 'lucide-react-native';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { EpubChapter } from '../utils/EpubService';
import { Bookmark, Note } from '../../../services/database/types';
import { BookmarkRepository } from '../../../services/database/BookmarkRepository';
import { NoteRepository } from '../../../services/database/NoteRepository';
import { useTranslation } from 'react-i18next';

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
    const isDark = [
        '#020617', '#0F172A', '#121212', '#000000',
        '#0C0A09', '#1C1917', '#292524'
    ].includes(theme.colors.mainBackground);

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
    }, [visible, initialTab]); // removed availableTabs from dep to avoid loop if array ref changes

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

    const flatChapters = flattenChapters(chapters);
    const filteredChapters = flatChapters.filter(c =>
        c.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderChapterItem = ({ item }: { item: EpubChapter & { level: number } }) => {
        const isCurrent = currentHref && item.href.includes(currentHref);
        return (
            <TouchableOpacity
                className={clsx(
                    "flex-row items-center py-4 pr-5 active:bg-black/5 dark:active:bg-white/5",
                    item.level === 0 && "mb-1"
                )}
                style={{
                    paddingLeft: 24 + item.level * 16,
                    backgroundColor: isCurrent ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent'
                }}
                onPress={() => { onSelectChapter(item.href); onClose(); }}
            >
                <View className="mr-3" style={{ width: 4 }}>
                    {isCurrent && (
                        <View className="bg-primary-500 rounded-full" style={{ width: 4, height: 24 }} />
                    )}
                </View>
                <View className="flex-1">
                    <Text
                        className={clsx(isCurrent ? "font-bold" : "font-medium")}
                        style={{
                            fontSize: item.level === 0 ? 16 : 15,
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
        <View className="p-4 border-b border-gray-100 dark:border-gray-800 flex-row justify-between items-center">
            <TouchableOpacity
                className="flex-1 mr-2"
                onPress={() => { onSelectBookmark(item); onClose(); }}
            >
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {new Date(item.createdAt).toLocaleString()} · {item.percentage.toFixed(1)}%
                </Text>
                <Text className="text-base font-medium text-gray-900 dark:text-gray-100" numberOfLines={2}>
                    {item.previewText || t('reader.controls.bookmarks')}
                </Text>
            </TouchableOpacity>
            <View className="flex-row items-center gap-3">
                <TouchableOpacity
                    onPress={() => { setEditingBookmark(item); setEditText(item.previewText || ''); }}
                    className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"
                >
                    <NotebookPen size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleDeleteBookmark(item.id)}
                    className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full"
                >
                    <X size={16} color={theme.colors.danger} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderNoteItem = ({ item }: { item: Note }) => (
        <TouchableOpacity
            className="p-4 border-b border-gray-100 dark:border-gray-800"
            onPress={() => { onClose(); }}
        >
            <View className="flex-row items-center mb-2">
                <View className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: item.color || theme.colors.primary }} />
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
            <Text className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1" numberOfLines={3}>
                "{item.fullText}"
            </Text>
            {item.note && (
                <Text className="text-sm text-gray-600 dark:text-gray-300 italic mt-1">
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
                className={clsx(
                    "flex-1 py-1.5 rounded-md items-center justify-center",
                    isActive ? "bg-white dark:bg-gray-700 shadow-sm" : ""
                )}
                onPress={() => setActiveTab(id)}
            >
                <Text className={clsx("text-sm font-medium", isActive ? "text-primary-500" : "text-gray-500")}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
            {/* ... Existing Modal Content ... */}
            <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
                {/* ... (Existing drawer code) ... */}
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
                    {/* ... (Existing drawer content) ... */}
                    <View style={{ flex: 1, paddingTop: insets.top }}>
                        {/* Premium Header */}
                        <View
                            className="px-6 pb-6 pt-4 flex-col gap-4"
                            style={{
                                borderBottomWidth: 1,
                                borderColor: isDark ? '#1F2937' : '#F3F4F6'
                            }}
                        >
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center gap-3">
                                    <View
                                        className="w-8 h-8 rounded-full items-center justify-center"
                                        style={{ backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.1)' }}
                                    >
                                        <HeaderIcon size={18} color={theme.colors.primary} />
                                    </View>
                                    <Text variant="subheader" fontSize={22} fontWeight="700" letterSpacing={0.5} style={{ color: theme.colors.textPrimary }}>
                                        {title}
                                    </Text>
                                </View>
                            </View>

                            {/* Segmented Control (Tabs) - Only if multiple tabs */}
                            {!isContentsOnly && (
                                <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mt-2">
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
                            <View className="px-6 py-3 mb-2" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F9FAFB' }}>
                                <Text className="text-xs uppercase font-bold tracking-widest" style={{ color: '#9CA3AF' }}>
                                    {flatChapters.length} Chapters
                                </Text>
                            </View>
                        )}

                        {/* Search Bar (Only for Contents) */}
                        {activeTab === 'contents' && (
                            <View className="px-6 pb-2">
                                <View className="bg-gray-100 dark:bg-white/10 rounded-xl px-3 py-2 flex-row items-center">
                                    <Search size={18} color={theme.colors.textTertiary} />
                                    <TextInput
                                        placeholder="Search chapters..."
                                        placeholderTextColor={theme.colors.textTertiary}
                                        style={{ flex: 1, marginLeft: 8, color: theme.colors.textPrimary, fontSize: 15 }}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        clearButtonMode="while-editing"
                                    />
                                </View>
                            </View>
                        )}

                        {/* Content List */}
                        <View className="flex-1">
                            {activeTab === 'contents' ? (
                                <FlatList
                                    data={filteredChapters}
                                    keyExtractor={(item, index) => item.id + item.href + index}
                                    renderItem={renderChapterItem}
                                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                                    showsVerticalScrollIndicator={false}
                                />
                            ) : loading ? (
                                <View className="flex-1 items-center justify-center">
                                    <ActivityIndicator color={theme.colors.primary} />
                                </View>
                            ) : activeTab === 'bookmarks' ? (
                                <FlatList
                                    data={bookmarks}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderBookmarkItem}
                                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                                    ListEmptyComponent={
                                        <View className="items-center justify-center py-20">
                                            <Text className="text-gray-400">No bookmarks yet</Text>
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
                                        <View className="items-center justify-center py-20">
                                            <Text className="text-gray-400">No notes yet</Text>
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
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }]}>
                    <View style={{ backgroundColor: isDark ? '#1F2937' : 'white', width: '80%', borderRadius: 16, padding: 20 }}>
                        <Text variant="subheader" fontSize={18} marginBottom="m" style={{ color: theme.colors.textPrimary }}>
                            Edit Bookmark
                        </Text>
                        <TextInput
                            value={editText}
                            onChangeText={setEditText}
                            placeholder="Enter bookmark title..."
                            placeholderTextColor={theme.colors.textTertiary}
                            style={{
                                backgroundColor: isDark ? '#374151' : '#F3F4F6',
                                padding: 12,
                                borderRadius: 8,
                                color: theme.colors.textPrimary,
                                marginBottom: 20
                            }}
                            autoFocus
                        />
                        <View className="flex-row justify-end gap-4">
                            <TouchableOpacity onPress={() => setEditingBookmark(null)}>
                                <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateBookmark}>
                                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Save</Text>
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
});

export default ContentsModal;
