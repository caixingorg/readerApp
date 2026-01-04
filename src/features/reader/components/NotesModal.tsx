import React from 'react';
import { Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';

import { FlatList, Alert } from 'react-native';
import { NoteRepository } from '../../../services/database/NoteRepository';
import { Note } from '../../../services/database/types';

interface NotesModalProps {
    visible: boolean;
    onClose: () => void;
    bookId: string;
}

const NotesModal: React.FC<NotesModalProps> = ({ visible, onClose, bookId }) => {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const [notes, setNotes] = React.useState<Note[]>([]);

    React.useEffect(() => {
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

    const handleDelete = async (id: string) => {
        try {
            await NoteRepository.delete(id);
            loadNotes();
        } catch (e) {
            Alert.alert('Error', 'Failed to delete note');
        }
    };

    const renderItem = ({ item }: { item: Note }) => (
        <Box padding="m" borderBottomWidth={1} borderBottomColor="border">
            <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1}>
                    {item.note ? (
                        <Text variant="body" fontWeight="bold" marginBottom="xs">{item.note}</Text>
                    ) : null}
                    <Text variant="caption" fontStyle="italic" color="textSecondary" numberOfLines={3}>
                        "{item.fullText}"
                    </Text>
                    <Text variant="small" color="textTertiary" marginTop="xs">
                        {new Date(item.createdAt).toLocaleString()}
                    </Text>
                </Box>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 8 }}>
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
            </Box>
        </Box>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <Box flex={1} backgroundColor="background">
                {/* Header */}
                <Box
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    paddingHorizontal="m"
                    paddingBottom="s"
                    borderBottomWidth={1}
                    borderBottomColor="border"
                    style={{ paddingTop: insets.top + 10 }}
                >
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={28} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text variant="title">Notes & Highlights</Text>
                    <Box width={28} />
                </Box>

                {notes.length === 0 ? (
                    <Box flex={1} justifyContent="center" alignItems="center">
                        <Ionicons name="create-outline" size={64} color={theme.colors.textSecondary} />
                        <Text variant="body" color="textSecondary" marginTop="m">
                            No notes yet
                        </Text>
                    </Box>
                ) : (
                    <FlatList
                        data={notes}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                    />
                )}
            </Box>
        </Modal>
    );
};

export default NotesModal;
