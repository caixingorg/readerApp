import React, { useState } from 'react';
import { Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import { BlurView } from 'expo-blur';
import { X, Check } from 'lucide-react-native';
import Text from '@/components/Text';
import Box from '@/components/Box';

interface NoteInputModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (text: string, color: string) => void;
    initialText?: string;
    selectedText?: string;
}

const COLORS = ['#FFD54F', '#81C784', '#64B5F6', '#BA68C8', '#E57373']; // Softer tones

const NoteInputModal: React.FC<NoteInputModalProps> = ({
    visible,
    onClose,
    onSubmit,
    initialText = '',
    selectedText,
}) => {
    const theme = useTheme<Theme>();
    // Robust checks against "Pro Max" dark palette (Slate + Stone)
    const isDark = [
        '#020617',
        '#0F172A',
        '#121212',
        '#000000', // Old Slate/Dark
        '#0C0A09',
        '#1C1917',
        '#292524', // New Stone Dark
    ].includes(theme.colors.mainBackground);
    const [note, setNote] = useState(initialText);
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    const handleSubmit = () => {
        onSubmit(note, selectedColor);
        setNote('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                }}
            >
                <TouchableOpacity
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    onPress={onClose}
                    activeOpacity={1}
                />

                <BlurView
                    intensity={Platform.OS === 'ios' ? 80 : 100}
                    tint={isDark ? 'dark' : 'light'}
                    style={{
                        width: '85%',
                        maxWidth: 340,
                        borderRadius: 20,
                        overflow: 'hidden',
                        backgroundColor: isDark ? 'rgba(30,30,30,0.7)' : 'rgba(255,255,255,0.85)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1,
                        shadowRadius: 20,
                        elevation: 5,
                    }}
                >
                    {/* Minimal Content Wrapper */}
                    <Box padding="l">
                        {/* Header: Just Title & Close */}
                        <Box
                            flexDirection="row"
                            justifyContent="space-between"
                            alignItems="center"
                            marginBottom="m"
                        >
                            <Text variant="subheader" fontSize={17} fontWeight="600">
                                Note
                            </Text>
                            <TouchableOpacity
                                onPress={onClose}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <X size={20} color={theme.colors.textSecondary} opacity={0.7} />
                            </TouchableOpacity>
                        </Box>

                        {/* Selected Text (Quote) - Minimalist Line */}
                        {selectedText && (
                            <Box
                                flexDirection="row"
                                marginBottom="m"
                                paddingLeft="m"
                                borderLeftWidth={2}
                                style={{ borderColor: selectedColor }}
                            >
                                <Text
                                    variant="caption"
                                    style={{
                                        fontStyle: 'italic',
                                        color: isDark
                                            ? theme.colors.textTertiary
                                            : theme.colors.textSecondary,
                                    }}
                                    numberOfLines={3}
                                >
                                    {selectedText}
                                </Text>
                            </Box>
                        )}

                        {/* Input Area */}
                        <TextInput
                            value={note}
                            onChangeText={setNote}
                            placeholder="Add a thought..."
                            placeholderTextColor={theme.colors.textTertiary}
                            multiline
                            autoFocus
                            style={{
                                minHeight: 80,
                                fontSize: 15,
                                textAlignVertical: 'top',
                                marginBottom: 16,
                                lineHeight: 22,
                                color: theme.colors.textPrimary,
                            }}
                        />

                        {/* Footer: Colors & Check */}
                        <Box
                            flexDirection="row"
                            alignItems="center"
                            justifyContent="space-between"
                            marginTop="xs"
                            paddingTop="m"
                            borderTopWidth={1}
                            borderTopColor="border"
                        >
                            {/* Color Dots */}
                            <Box flexDirection="row" gap="s">
                                {COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        onPress={() => setSelectedColor(color)}
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: color,
                                            borderWidth: selectedColor === color ? 2 : 0,
                                            borderColor: isDark ? '#FFF' : '#000',
                                            transform: [
                                                { scale: selectedColor === color ? 1.1 : 1 },
                                            ],
                                        }}
                                    />
                                ))}
                            </Box>

                            {/* Minimal Save Button (Round Check) */}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isDark ? '#FFF' : '#000',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 2,
                                }}
                            >
                                <Check size={18} color={isDark ? '#000' : '#FFF'} strokeWidth={3} />
                            </TouchableOpacity>
                        </Box>
                    </Box>
                </BlurView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default NoteInputModal;
