import React, { useState, useEffect } from 'react';
import {
    Modal,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ScrollView,
} from 'react-native';

import { useTheme } from '@shopify/restyle';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';
import Input from '@/components/Input';
import Button from '@/components/Button';

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
    onConfirm,
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
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
                        shadowColor="black"
                        shadowOffset={{ width: 0, height: 4 }}
                        shadowOpacity={0.3}
                        shadowRadius={10}
                        elevation={10}
                    >
                        {/* Header */}
                        <Box
                            flexDirection="row"
                            justifyContent="space-between"
                            alignItems="center"
                            marginBottom="l"
                        >
                            <Text variant="subheader" fontWeight="bold">
                                {t('common.edit') || 'Edit Content'}
                            </Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={theme.colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </Box>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Quote Input */}
                            <Text variant="body" fontWeight="bold" marginBottom="s">
                                {t('common.quote_text') || 'Quote'}
                            </Text>
                            <Input
                                value={quote}
                                onChangeText={setQuote}
                                multiline
                                placeholder={t('common.quote_text') || 'Quote content...'}
                            />

                            {/* Note Input */}
                            <Text variant="body" fontWeight="bold" marginTop="m" marginBottom="s">
                                {t('notebook.types.note') || 'My Note'}
                            </Text>
                            <Input
                                value={note}
                                onChangeText={setNote}
                                multiline
                                placeholder={t('notebook.types.note') || 'Add a note...'}
                            />
                        </ScrollView>

                        {/* Actions */}
                        <Box marginTop="l" flexDirection="row" gap="m">
                            <Box flex={1}>
                                <Button
                                    title={t('common.cancel')}
                                    onPress={onClose}
                                    variant="secondary"
                                    fullWidth
                                />
                            </Box>
                            <Box flex={1}>
                                <Button
                                    title={t('common.preview') || 'Preview'}
                                    onPress={handleConfirm}
                                    variant="primary"
                                    fullWidth
                                />
                            </Box>
                        </Box>
                    </Box>
                </KeyboardAvoidingView>
            </BlurView>
        </Modal>
    );
};

export default ShareEditModal;
