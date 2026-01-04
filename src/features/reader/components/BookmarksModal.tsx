import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Bookmark } from '../../../services/database/types';
import { BookmarkRepository } from '../../../services/database/BookmarkRepository';

interface BookmarksModalProps {
    visible: boolean;
    onClose: () => void;
    bookId: string;
    onSelectBookmark: (bookmark: Bookmark) => void;
}

const BookmarksModal: React.FC<BookmarksModalProps> = ({ visible, onClose, bookId, onSelectBookmark }) => {
    const theme = useTheme<Theme>();
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

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

    const handleDelete = async (id: string) => {
        try {
            await BookmarkRepository.delete(id);
            loadBookmarks();
        } catch (e) {
            Alert.alert('Error', 'Failed to delete bookmark');
        }
    };

    const renderItem = ({ item }: { item: Bookmark }) => (
        <TouchableOpacity onPress={() => onSelectBookmark(item)} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                <Box flex={1}>
                    <Text variant="body" numberOfLines={1}>
                        {item.previewText || 'Bookmark'}
                    </Text>
                    <Text variant="caption" color="textSecondary" marginTop="xs">
                        {new Date(item.createdAt).toLocaleString()} • {Math.round(item.percentage)}%
                    </Text>
                </Box>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 8 }}>
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
            </Box>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <Box flex={1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
                <Box
                    height="60%"
                    backgroundColor="background"
                    borderTopLeftRadius="l"
                    borderTopRightRadius="l"
                    overflow="hidden"
                >
                    <Box padding="m" borderBottomWidth={1} borderBottomColor="border" flexDirection="row" justifyContent="space-between" alignItems="center">
                        <Text variant="subheader">Bookmarks</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </Box>

                    {bookmarks.length === 0 ? (
                        <Box flex={1} justifyContent="center" alignItems="center">
                            <Text variant="body" color="textSecondary">No bookmarks yet</Text>
                        </Box>
                    ) : (
                        <FlatList
                            data={bookmarks}
                            keyExtractor={item => item.id}
                            renderItem={renderItem}
                        />
                    )}
                </Box>
            </Box>
        </Modal>
    );
};

export default BookmarksModal;
