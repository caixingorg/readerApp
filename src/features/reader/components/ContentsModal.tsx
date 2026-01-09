import React, { useState, useEffect } from 'react';
import { StyleSheet, Modal, TouchableOpacity, FlatList, View, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import clsx from 'clsx';
import { Search, X, ChevronRight, Bookmark as BookmarkIcon, FileText, List as ListIcon } from 'lucide-react-native';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { EpubChapter } from '../utils/EpubService';
import { Bookmark, Note } from '../../../services/database/types';
import { BookmarkRepository } from '../../../services/database/BookmarkRepository';
import { NoteRepository } from '../../../services/database/NoteRepository';
import Toast from 'react-native-toast-message';

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
}

const ContentsModal: React.FC<ContentsModalProps> = ({
    visible,
    onClose,
    bookId,
    chapters,
    currentHref,
    onSelectChapter,
    onSelectBookmark,
    initialTab = 'contents'
}) => {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    // Robust checks against "Pro Max" dark palette (Slate + Stone)
    const isDark = [
        '#020617', '#0F172A', '#121212', '#000000', // Old Slate/Dark
        '#0C0A09', '#1C1917', '#292524'  // New Stone Dark
    ].includes(theme.colors.mainBackground);

    const [activeTab, setActiveTab] = useState<ContentsTab>(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            setActiveTab(initialTab);
            setSearchQuery('');
            loadData();
        }
    }, [visible, initialTab]);

    useEffect(() => {
        if (visible && activeTab !== 'contents') {
            loadData();
        }
    }, [activeTab]);

    const loadData = async () => {
        if (activeTab === 'bookmarks') {
            setLoading(true);
            try {
                const data = await BookmarkRepository.getByBookId(bookId);
                setBookmarks(data.sort((a, b) => b.createdAt - a.createdAt));
            } catch (e) { console.error(e); } finally { setLoading(false); }
        } else if (activeTab === 'notes') {
            setLoading(true);
            try {
                const data = await NoteRepository.getByBookId(bookId);
                setNotes(data.sort((a, b) => b.createdAt - a.createdAt));
            } catch (e) { console.error(e); } finally { setLoading(false); }
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
                className="py-3 pr-4 border-b border-gray-100 dark:border-gray-800"
                style={{ paddingLeft: 20 + item.level * 20 }}
                onPress={() => { onSelectChapter(item.href); onClose(); }}
            >
                <Text
                    className={clsx(
                        "text-base",
                        isCurrent ? "font-bold text-primary-500" : "text-gray-900 dark:text-gray-100 font-medium"
                    )}
                    style={{ color: isCurrent ? theme.colors.primary : theme.colors.textPrimary }}
                >
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderBookmarkItem = ({ item }: { item: Bookmark }) => (
        <TouchableOpacity
            className="p-4 border-b border-gray-100 dark:border-gray-800 flex-row justify-between items-center"
            onPress={() => { onSelectBookmark(item); onClose(); }}
        >
            <View className="flex-1">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {new Date(item.createdAt).toLocaleString()} · {item.percentage.toFixed(1)}%
                </Text>
                <Text className="text-base font-medium text-gray-900 dark:text-gray-100" numberOfLines={2}>
                    {item.previewText || 'Bookmark'}
                </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textTertiary} />
        </TouchableOpacity>
    );

    const renderNoteItem = ({ item }: { item: Note }) => (
        <TouchableOpacity
            className="p-4 border-b border-gray-100 dark:border-gray-800"
            // Start navigation to note location? Notes usually don't have location callback in this minimal refactor
            // We'll just show them for now or assume they can be jumped to if we had the logic.
            // For now, no action or basic alert
            onPress={() => {
                // onSelectBookmark can handle jumping if we map Note to Bookmark-like structure?
                // Or just close.
                onClose();
            }}
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

    const TabButton = ({ id, label, icon: Icon }: { id: ContentsTab, label: string, icon: any }) => {
        const isActive = activeTab === id;
        return (
            <TouchableOpacity
                className={clsx(
                    "flex-1 items-center justify-center py-3 border-b-2",
                    isActive ? "border-primary-500" : "border-transparent"
                )}
                onPress={() => setActiveTab(id)}
            >
                <Icon size={20} color={isActive ? theme.colors.primary : theme.colors.textTertiary} />
                <Text
                    className={clsx("text-xs mt-1 font-medium", isActive ? "text-primary-500" : "text-gray-500")}
                    style={{ color: isActive ? theme.colors.primary : theme.colors.textSecondary }}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
            <BlurView
                intensity={Platform.OS === 'ios' ? 95 : 100}
                tint={isDark ? 'dark' : 'light'}
                style={[
                    styles.modalContainer,
                    { paddingBottom: insets.bottom, backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)' }
                ]}
            >
                {/* Header Section */}
                <View className="pt-4 px-4 pb-2 flex-row justify-between items-center border-b border-gray-200/50 dark:border-gray-700/50">
                    <View className="flex-row flex-1">
                        <TabButton id="contents" label="Contents" icon={ListIcon} />
                        <TabButton id="bookmarks" label="Bookmarks" icon={BookmarkIcon} />
                        <TabButton id="notes" label="Notes" icon={FileText} />
                    </View>
                    <TouchableOpacity onPress={onClose} className="p-2 ml-2">
                        <X size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar (Only for Contents) */}
                {activeTab === 'contents' && (
                    <View className="px-4 py-3 bg-transparent">
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
                            keyExtractor={(item) => item.id + item.href}
                            renderItem={renderChapterItem}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            initialNumToRender={20}
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
                            contentContainerStyle={{ paddingBottom: 20 }}
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
                            contentContainerStyle={{ paddingBottom: 20 }}
                            ListEmptyComponent={
                                <View className="items-center justify-center py-20">
                                    <Text className="text-gray-400">No notes yet</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '85%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
});

export default ContentsModal;
