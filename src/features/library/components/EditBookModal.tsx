import React, { useState } from 'react';
import { Modal, TextInput, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';
import Button from '@/components/Button';
import { Book } from '@/services/database';
import { getSafePath } from '@/utils/PathUtils';
import { useTranslation } from 'react-i18next';

interface EditBookModalProps {
    visible: boolean;
    book: Book | null;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Book>) => Promise<void>;
}

const EditBookModal: React.FC<EditBookModalProps> = ({ visible, book, onClose, onSave }) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();
    const [title, setTitle] = useState(book?.title || '');
    const [author, setAuthor] = useState(book?.author || '');
    const [cover, setCover] = useState<string | undefined>(book?.cover);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!book) return;
        if (!title.trim()) {
            Toast.show({
                type: 'error',
                text1: t('library.edit.validation_error'),
                text2: t('library.edit.title_required'),
            });
            return;
        }

        setIsSaving(true);
        try {
            await onSave(book.id, {
                title: title.trim(),
                author: author.trim(),
                cover: cover,
            });
            onClose();
            Toast.show({
                type: 'success',
                text1: t('library.edit.success'),
                text2: t('library.edit.updated'),
            });
        } catch (e) {
            Toast.show({
                type: 'error',
                text1: t('library.edit.error'),
                text2: t('library.edit.update_failed'),
            });
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePickCover = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setCover(result.assets[0].uri);
            }
        } catch (e) {
            console.error('Pick cover failed', e);
        }
    };

    if (!book) return null;

    const safeCoverPath = getSafePath(cover);

    const inputStyle = [
        styles.input,
        {
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadii.s,
            padding: theme.spacing.s,
            marginBottom: theme.spacing.m,
            color: theme.colors.text,
        },
    ];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Box flex={1} justifyContent="flex-end">
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    activeOpacity={1}
                />

                <Box
                    backgroundColor="background"
                    borderTopLeftRadius="xl"
                    borderTopRightRadius="xl"
                    padding="l"
                    paddingBottom="xl"
                    style={styles.modalContent}
                >
                    <Box
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        marginBottom="m"
                    >
                        <Text variant="subheader">{t('library.edit.title')}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </Box>

                    {/* Cover Preview & Edit */}
                    <Box alignItems="center" marginBottom="m">
                        <TouchableOpacity onPress={handlePickCover}>
                            <Box
                                width={80}
                                height={110}
                                backgroundColor="foreground"
                                borderRadius="s"
                                overflow="hidden"
                                justifyContent="center"
                                alignItems="center"
                                borderWidth={1}
                                borderColor="border"
                                position="relative"
                            >
                                {safeCoverPath ? (
                                    <Image
                                        source={{ uri: safeCoverPath }}
                                        style={styles.coverImage}
                                    />
                                ) : (
                                    <Ionicons
                                        name="image-outline"
                                        size={32}
                                        color={theme.colors.textTertiary}
                                    />
                                )}
                                {/* Edit Overlay */}
                                <Box
                                    position="absolute"
                                    bottom={0}
                                    left={0}
                                    right={0}
                                    backgroundColor="overlay"
                                    height={24}
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Text variant="small" color="white" fontSize={10}>
                                        {t('library.actions.edit_cover')}
                                    </Text>
                                </Box>
                            </Box>
                        </TouchableOpacity>
                    </Box>

                    {/* Fields */}
                    <Text variant="body" marginBottom="xs" color="textSecondary">
                        {t('library.edit.book_title')}
                    </Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        style={inputStyle}
                        placeholderTextColor={theme.colors.textTertiary}
                    />

                    <Text variant="body" marginBottom="xs" color="textSecondary">
                        {t('library.edit.author')}
                    </Text>
                    <TextInput
                        value={author}
                        onChangeText={setAuthor}
                        style={inputStyle}
                        placeholderTextColor={theme.colors.textTertiary}
                    />

                    <Box
                        flexDirection="row"
                        justifyContent="flex-end"
                        gap="m"
                        marginTop="s"
                        paddingBottom="m"
                    >
                        <Button
                            title={t('library.actions.cancel')}
                            onPress={onClose}
                            variant="outline"
                        />
                        <Button
                            title={t('library.actions.save')}
                            onPress={handleSave}
                            variant="primary"
                            disabled={isSaving}
                        />
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    input: {
        borderWidth: 1,
        fontSize: 16,
    },
});

export default EditBookModal;
