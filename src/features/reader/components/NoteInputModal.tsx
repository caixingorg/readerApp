import React, { useState } from 'react';
import { Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, View, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../../theme/theme';
import { BlurView } from 'expo-blur';
import { X, Check } from 'lucide-react-native';
import Text from '../../../components/Text';

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
    selectedText
}) => {
    const theme = useTheme<Theme>();
    // Robust checks against "Pro Max" dark palette (Slate + Stone)
    const isDark = [
        '#020617', '#0F172A', '#121212', '#000000', // Old Slate/Dark
        '#0C0A09', '#1C1917', '#292524'  // New Stone Dark
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
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}
            >
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
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
                        padding: 0,
                        // Clean shadow
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.1,
                        shadowRadius: 20,
                        elevation: 5,
                        backgroundColor: isDark ? 'rgba(30,30,30,0.7)' : 'rgba(255,255,255,0.85)'
                    }}
                >
                    {/* Minimal Content Wrapper */}
                    <View className="p-6">

                        {/* Header: Just Title & Close */}
                        <View className="flex-row justify-between items-center mb-4">
                            <Text variant="subheader" fontSize={17} fontWeight="600">Note</Text>
                            <TouchableOpacity onPress={onClose} hitSlop={10}>
                                <X size={20} color={theme.colors.textSecondary} opacity={0.7} />
                            </TouchableOpacity>
                        </View>

                        {/* Selected Text (Quote) - Minimalist Line */}
                        {selectedText && (
                            <View className="flex-row mb-4 pl-3 border-l-2" style={{ borderColor: selectedColor }}>
                                <Text
                                    className="text-xs italic text-gray-500 dark:text-gray-400 font-serif leading-4"
                                    numberOfLines={3}
                                >
                                    {selectedText}
                                </Text>
                            </View>
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
                                color: theme.colors.textPrimary,
                                textAlignVertical: 'top',
                                marginBottom: 16,
                                lineHeight: 22
                            }}
                        />

                        {/* Footer: Colors & Check */}
                        <View className="flex-row items-center justify-between mt-2 pt-4 border-t border-gray-100 dark:border-white/10">
                            {/* Color Dots */}
                            <View className="flex-row gap-3">
                                {COLORS.map(color => (
                                    <TouchableOpacity
                                        key={color}
                                        onPress={() => setSelectedColor(color)}
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 10,
                                            backgroundColor: color,
                                            borderWidth: selectedColor === color ? 2 : 0,
                                            borderColor: isDark ? '#FFF' : '#000',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transform: [{ scale: selectedColor === color ? 1.1 : 1 }]
                                        }}
                                    />
                                ))}
                            </View>

                            {/* Minimal Save Button (Round Check) */}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                className="w-10 h-10 rounded-full items-center justify-center bg-black dark:bg-white"
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 2
                                }}
                            >
                                <Check size={18} color={isDark ? '#000' : '#FFF'} strokeWidth={3} />
                            </TouchableOpacity>
                        </View>

                    </View>
                </BlurView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// Removed styles since we use inline and tailwind mostly
const styles = StyleSheet.create({}); // Keeping empty to avoid break if imported usage exists (though none here)

export default NoteInputModal;
