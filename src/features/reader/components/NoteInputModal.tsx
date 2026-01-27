import React, { useState, useEffect } from 'react';
import { Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import { X, Check, Quote } from 'lucide-react-native';
import Text from '@/components/Text';
import Box from '@/components/Box';

interface NoteInputModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (text: string, color: string) => void;
    initialText?: string;
    selectedText?: string;
}

const COLORS = ['#FFD54F', '#81C784', '#64B5F6', '#BA68C8', '#E57373'];

const NoteInputModal: React.FC<NoteInputModalProps> = ({
    visible,
    onClose,
    onSubmit,
    initialText = '',
    selectedText,
}) => {
    const theme = useTheme<Theme>();
    const [note, setNote] = useState(initialText);
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    useEffect(() => {
        if (visible) {
            setNote(initialText);
        }
    }, [visible, initialText]);

    const handleSubmit = () => {
        onSubmit(note, selectedColor);
        setNote('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                    {/* Backdrop */}
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                        }}
                        activeOpacity={1}
                        onPress={onClose}
                    />

                    {/* Bottom Sheet Content */}
                    <Box
                        backgroundColor="cardPrimary"
                        borderTopLeftRadius="xl"
                        borderTopRightRadius="xl"
                        padding="l"
                        paddingBottom="xl"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 10,
                            elevation: 10,
                            maxHeight: '80%', // Prevent taking up full screen
                        }}
                    >
                        {/* Header */}
                        <Box
                            flexDirection="row"
                            justifyContent="space-between"
                            alignItems="center"
                            marginBottom="m"
                        >
                            <Text variant="subheader" fontSize={18} fontWeight="bold" color="textPrimary">
                                Add Note
                            </Text>
                            <TouchableOpacity
                                onPress={onClose}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={{ padding: 4 }}
                            >
                                <X size={22} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </Box>

                        {/* Selected Text Quote */}
                        {selectedText && (
                            <Box
                                flexDirection="row"
                                marginBottom="m"
                                padding="m"
                                backgroundColor="mainBackground"
                                borderRadius="m"
                                borderLeftWidth={4}
                                style={{ borderColor: selectedColor }}
                            >
                                <Quote size={16} color={theme.colors.textTertiary} style={{ marginRight: 8, marginTop: 2 }} />
                                <Text
                                    variant="body"
                                    fontSize={14}
                                    color="textSecondary"
                                    fontStyle="italic"
                                    numberOfLines={3}
                                    style={{ flex: 1 }}
                                >
                                    {selectedText}
                                </Text>
                            </Box>
                        )}

                        {/* Input Area */}
                        <TextInput
                            value={note}
                            onChangeText={setNote}
                            placeholder="Type your thoughts here..."
                            placeholderTextColor={theme.colors.textTertiary}
                            multiline
                            autoFocus
                            textAlignVertical="top"
                            style={{
                                minHeight: 100,
                                fontSize: 16,
                                color: theme.colors.textPrimary,
                                backgroundColor: theme.colors.mainBackground,
                                padding: theme.spacing.m,
                                borderRadius: theme.borderRadii.m,
                                marginBottom: theme.spacing.l,
                            }}
                        />

                        {/* Footer: Color Picker & Action */}
                        <Box
                            flexDirection="row"
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            <Box flexDirection="row" gap="m">
                                {COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        onPress={() => setSelectedColor(color)}
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: 12,
                                            backgroundColor: color,
                                            borderWidth: 2,
                                            borderColor: selectedColor === color ? theme.colors.textPrimary : 'transparent',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {selectedColor === color && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.textPrimary }} />}
                                    </TouchableOpacity>
                                ))}
                            </Box>

                            <TouchableOpacity
                                onPress={handleSubmit}
                                style={{
                                    backgroundColor: theme.colors.primary,
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    shadowColor: theme.colors.primary,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 4,
                                }}
                            >
                                <Check size={24} color={'white'} strokeWidth={3} />
                            </TouchableOpacity>
                        </Box>
                    </Box>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default NoteInputModal;
