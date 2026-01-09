import React, { useState, useEffect } from 'react';
import { Modal, TouchableOpacity, FlatList, Alert, View, Text } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Theme } from '../../../theme/theme';
import { NoteRepository } from '../../../services/database/NoteRepository';
import { Note } from '../../../services/database/types';
import clsx from 'clsx';

interface NotesModalProps {
    visible: boolean;
    onClose: () => void;
    bookId: string;
}

const NotesModal: React.FC<NotesModalProps> = ({ visible, onClose, bookId }) => {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const [notes, setNotes] = useState<Note[]>([]);

    useEffect(() => {
        if (visible) {
            loadNotes();
        }
    }, [visible]);

    const loadNotes = async () => {
        try {
            const data = await NoteRepository.getByBookId(bookId);
            setNotes(data);
        } catch (e) {
            console.error('Failed to load notes', e);
        }
    };

    // ... inside component

    const handleDelete = async (id: string) => {
        try {
            await NoteRepository.delete(id);
            loadNotes();
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Note deleted'
            });
        } catch (e) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete note'
            });
        }
    };

    const renderItem = ({ item }: { item: Note }) => (
        <View className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                    {item.note ? (
                        <Text className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{item.note}</Text>
                    ) : null}
                    <View className={clsx("pl-2 border-l-2", item.color === 'yellow' ? 'border-yellow-400' : 'border-blue-400')}>
                        <Text className="text-xs italic text-gray-500 dark:text-gray-400 leading-5" numberOfLines={3}>
                            "{item.fullText}"
                        </Text>
                    </View>
                    <Text className="text-[10px] text-gray-400 mt-2">
                        {new Date(item.createdAt).toLocaleString()}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} className="p-2">
                    <Ionicons name="trash-bin-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-gray-50 dark:bg-black">
                {/* Header */}
                <View
                    className="flex-row items-center justify-between px-4 pb-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10"
                    style={{ paddingTop: (insets.top > 0 ? 10 : 20) }}
                >
                    <TouchableOpacity onPress={onClose} className="p-2">
                        <Ionicons name="close" size={28} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">笔记与高亮</Text>
                    <View className="w-10" />
                </View>

                {notes.length === 0 ? (
                    <View className="flex-1 justify-center items-center p-8">
                        <Ionicons name="create-outline" size={64} color={theme.colors.textSecondary} />
                        <Text className="text-gray-500 dark:text-gray-400 mt-4 text-center">
                            暂无笔记{'\n'}长按文中文字即可添加高亮或笔记
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={notes}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                    />
                )}
            </View>
        </Modal>
    );
};

export default NotesModal;
