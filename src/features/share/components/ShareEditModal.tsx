
import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';

interface ShareEditModalProps {
    visible: boolean;
    initialQuote: string;
    initialNote: string;
    onClose: () => void;
    onConfirm: (quote: string, note: string) => void;
}

const ShareEditModal: React.FC<ShareEditModalProps> = ({
    visible,
    initialQuote,
    initialNote,
    onClose,
    onConfirm
}) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    const [quote, setQuote] = useState(initialQuote);
    const [note, setNote] = useState(initialNote);

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setQuote(initialQuote);
            setNote(initialNote);
        }
    }, [visible, initialQuote, initialNote]);

    const handleConfirm = () => {
        onConfirm(quote, note);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
                >
                    <Box
                        width="100%"
                        maxHeight="80%"
                        backgroundColor="mainBackground"
                        borderRadius="l"
                        padding="l"
                        style={styles.shadow}
                    >
                        {/* Header */}
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="l">
                            <Text variant="subheader" fontWeight="bold">
                                {t('common.edit') || "Edit Content"}
                            </Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </Box>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Quote Input */}
                            <Text variant="body" fontWeight="bold" marginBottom="s">
                                {t('common.quote_text') || "Quote"}
                            </Text>
                            <TextInput
                                value={quote}
                                onChangeText={setQuote}
                                multiline
                                style={[
                                    styles.input,
                                    {
                                        color: theme.colors.textPrimary,
                                        backgroundColor: theme.colors.cardSecondary,
                                        minHeight: 80
                                    }
                                ]}
                                placeholder={t('common.quote_text') || "Quote content..."}
                                placeholderTextColor={theme.colors.textTertiary}
                            />

                            {/* Note Input */}
                            <Text variant="body" fontWeight="bold" marginTop="m" marginBottom="s">
                                {t('notebook.types.note') || "My Note"}
                            </Text>
                            <TextInput
                                value={note}
                                onChangeText={setNote}
                                multiline
                                style={[
                                    styles.input,
                                    {
                                        color: theme.colors.textPrimary,
                                        backgroundColor: theme.colors.cardSecondary,
                                        minHeight: 80
                                    }
                                ]}
                                placeholder={t('notebook.types.note') || "Add a note..."}
                                placeholderTextColor={theme.colors.textTertiary}
                            />
                        </ScrollView>

                        {/* Actions */}
                        <Box marginTop="l" flexDirection="row" gap="m">
                            <TouchableOpacity
                                onPress={onClose}
                                style={[styles.button, { backgroundColor: theme.colors.cardSecondary, flex: 1 }]}
                            >
                                <Text variant="body" fontWeight="600" color="textSecondary" textAlign="center">
                                    {t('common.cancel')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleConfirm}
                                style={[styles.button, { backgroundColor: theme.colors.primary, flex: 1 }]}
                            >
                                <Text variant="body" fontWeight="bold" color="white" textAlign="center">
                                    {t('common.preview') || "Preview"}
                                </Text>
                            </TouchableOpacity>
                        </Box>
                    </Box>
                </KeyboardAvoidingView>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    shadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    input: {
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        textAlignVertical: 'top',
        lineHeight: 22
    },
    button: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    }
});

export default ShareEditModal;
