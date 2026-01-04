import React, { useState } from 'react';
import { Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import Button from '../../../components/Button';

interface NoteInputModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (text: string, color: string) => void;
    initialText?: string;
    selectedText?: string;
}

const COLORS = ['#FFEB3B', '#FFCC80', '#A5D6A7', '#90CAF9', '#F48FB1']; // Highlight colors

const NoteInputModal: React.FC<NoteInputModalProps> = ({
    visible,
    onClose,
    onSubmit,
    initialText = '',
    selectedText
}) => {
    const theme = useTheme<Theme>();
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
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}
            >
                <Box backgroundColor="background" borderRadius="m" padding="m" elevation={5}>
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m">
                        <Text variant="subheader">Add Note</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </Box>

                    {selectedText && (
                        <Box marginBottom="m" padding="s" backgroundColor="foreground" borderRadius="s">
                            <Text variant="caption" fontStyle="italic" numberOfLines={3}>"{selectedText}"</Text>
                        </Box>
                    )}

                    <TextInput
                        value={note}
                        onChangeText={setNote}
                        placeholder="Type your note here..."
                        placeholderTextColor={theme.colors.textSecondary}
                        multiline
                        style={{
                            height: 100,
                            borderColor: theme.colors.border,
                            borderWidth: 1,
                            borderRadius: 8,
                            padding: 10,
                            marginBottom: 16,
                            color: theme.colors.text,
                            textAlignVertical: 'top'
                        }}
                    />

                    <Text variant="body" marginBottom="s">Highlight Color</Text>
                    <Box flexDirection="row" marginBottom="l">
                        {COLORS.map(color => (
                            <TouchableOpacity
                                key={color}
                                onPress={() => setSelectedColor(color)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: color,
                                    marginRight: 10,
                                    borderWidth: selectedColor === color ? 2 : 0,
                                    borderColor: theme.colors.primary
                                }}
                            />
                        ))}
                    </Box>

                    <Button title="Save Note" onPress={handleSubmit} variant="primary" />
                </Box>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default NoteInputModal;
