import React, { useState, useEffect } from 'react';
import { Modal, TextInput, Image, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import { Book } from '../../../services/database';
import { getSafePath } from '../../../utils/PathUtils';

interface EditBookModalProps {
    visible: boolean;
    book: Book | null;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Book>) => Promise<void>;
}

const EditBookModal: React.FC<EditBookModalProps> = ({ visible, book, onClose, onSave }) => {
    const theme = useTheme<Theme>();
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [cover, setCover] = useState<string | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (book) {
            setTitle(book.title);
            setAuthor(book.author);
            setCover(book.cover);
        }
    }, [book]);

    const handleSave = async () => {
        if (!book) return;
        if (!title.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Title cannot be empty'
            });
            return;
        }

        setIsSaving(true);
        try {
            await onSave(book.id, {
                title: title.trim(),
                author: author.trim(),
                cover: cover
            });
            onClose();
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Book updated'
            });
        } catch (e) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update book info'
            });
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Pick a new cover image
     */
    const handlePickCover = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                // In a real app complexity, we might want to copy this to app storage immediately 
                // or wait until save. For simplicity, we just use the uri and let the repository/service handle persistence if needed,
                // BUT current BookRepository just stores path Strings. 
                // So strictly speaking, we should copy it to books/ folder if we want it permanent.
                // For now, let's just use the URI.
                setCover(result.assets[0].uri);
            }
        } catch (e) {
            console.error('Pick cover failed', e);
        }
    };

    if (!book) return null;

    const safeCoverPath = getSafePath(cover);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Box flex={1} backgroundColor="overlay" justifyContent="center" padding="m">
                <Box backgroundColor="background" borderRadius="m" padding="l" elevation={5}>
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m">
                        <Text variant="subheader">Edit Info</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </Box>

                    {/* Cover Preview & Edit */}
                    <Box alignItems="center" marginBottom="m">
                        <TouchableOpacity onPress={handlePickCover}>
                            <Box
                                width={80} height={110}
                                backgroundColor="foreground"
                                borderRadius="s"
                                overflow="hidden"
                                justifyContent="center"
                                alignItems="center"
                                borderWidth={1}
                                borderColor="border"
                            >
                                {safeCoverPath ? (
                                    <Image source={{ uri: safeCoverPath }} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    <Ionicons name="image-outline" size={32} color={theme.colors.textTertiary} />
                                )}
                                {/* Edit Overlay */}
                                <Box position="absolute" bottom={0} left={0} right={0} backgroundColor="overlay" height={24} alignItems="center" justifyContent="center">
                                    <Text variant="small" style={{ color: 'white', fontSize: 10 }}>EDIT</Text>
                                </Box>
                            </Box>
                        </TouchableOpacity>
                    </Box>

                    {/* Fields */}
                    <Text variant="body" marginBottom="xs" color="textSecondary">Title</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        style={{
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            borderRadius: theme.borderRadii.s,
                            padding: theme.spacing.s,
                            marginBottom: theme.spacing.m,
                            color: theme.colors.text,
                            fontSize: 16
                        }}
                    />

                    <Text variant="body" marginBottom="xs" color="textSecondary">Author</Text>
                    <TextInput
                        value={author}
                        onChangeText={setAuthor}
                        style={{
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            borderRadius: theme.borderRadii.s,
                            padding: theme.spacing.s,
                            marginBottom: theme.spacing.m,
                            color: theme.colors.text,
                            fontSize: 16
                        }}
                    />

                    <Box flexDirection="row" justifyContent="flex-end" gap="m" marginTop="s">
                        <Button title="Cancel" onPress={onClose} variant="outline" />
                        <Button title="Save" onPress={handleSave} variant="primary" disabled={isSaving} />
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

export default EditBookModal;
