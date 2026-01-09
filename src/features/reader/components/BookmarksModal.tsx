import React, { useEffect, useState } from 'react';
import { Modal, TouchableOpacity, View, Text, FlatList, Alert } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Theme } from '../../../theme/theme';
import { Bookmark } from '../../../services/database/types';
import { BookmarkRepository } from '../../../services/database/BookmarkRepository';
import { BlurView } from 'expo-blur';
import clsx from 'clsx';

interface BookmarksModalProps {
    visible: boolean;
    onClose: () => void;
    bookId: string;
    onSelectBookmark: (bookmark: Bookmark) => void;
}

const BookmarksModal: React.FC<BookmarksModalProps> = ({ visible, onClose, bookId, onSelectBookmark }) => {
    const theme = useTheme<Theme>();
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const isDark = theme.colors.card !== '#FFFFFF';

    useEffect(() => {
        if (visible) {
            loadBookmarks();
        }
    }, [visible]);

    const loadBookmarks = async () => {
        try {
            const data = await BookmarkRepository.getByBookId(bookId);
            setBookmarks(data);
        } catch (e) {
            console.error('Failed to load bookmarks', e);
        }
    };

    // ... inside component

    const handleDelete = async (id: string) => {
        try {
            await BookmarkRepository.delete(id);
            loadBookmarks();
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Bookmark deleted'
            });
        } catch (e) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete bookmark'
            });
        }
    };

    const renderItem = ({ item }: { item: Bookmark }) => (
        <TouchableOpacity
            onPress={() => onSelectBookmark(item)}
            className="p-4 border-b border-gray-200 dark:border-gray-700 flex-row justify-between items-center bg-white/50 dark:bg-black/20"
        >
            <View className="flex-1 mr-4">
                <Text className="text-sm font-medium text-gray-900 dark:text-gray-100" numberOfLines={1}>
                    {item.previewText || '书签'}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(item.createdAt).toLocaleString()} • {Math.round(item.percentage)}%
                </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-2">
                <Ionicons name="trash-bin-outline" size={20} color={theme.colors.error} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View className="flex-1 bg-black/20 justify-end">
                <TouchableOpacity className="flex-1" onPress={onClose} />
                <View className="h-[60%] rounded-t-2xl overflow-hidden bg-white dark:bg-gray-900">
                    <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} className="flex-1">
                        <View className="p-4 border-b border-gray-200 dark:border-gray-700 flex-row justify-between items-center bg-white/70 dark:bg-black/50">
                            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">书签</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        {bookmarks.length === 0 ? (
                            <View className="flex-1 justify-center items-center p-8">
                                <Ionicons name="bookmark-outline" size={48} color={theme.colors.textSecondary} />
                                <Text className="text-gray-500 dark:text-gray-400 mt-4">暂无书签</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={bookmarks}
                                keyExtractor={item => item.id}
                                renderItem={renderItem}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                        )}
                    </BlurView>
                </View>
            </View>
        </Modal>
    );
};

export default BookmarksModal;
