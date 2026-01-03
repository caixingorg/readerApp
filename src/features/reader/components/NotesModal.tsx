import React from 'react';
import { Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';

interface NotesModalProps {
    visible: boolean;
    onClose: () => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ visible, onClose }) => {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen" // iOS native full screen look
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
                    <Text variant="title">笔记</Text>
                    <Box width={28} /> {/* Spacer for centering */}
                </Box>

                {/* Content */}
                <Box flex={1} justifyContent="center" alignItems="center">
                    <Ionicons name="create-outline" size={64} color={theme.colors.textSecondary} />
                    <Text variant="body" color="textSecondary" marginTop="m">
                        笔记功能开发中...
                    </Text>
                </Box>
            </Box>
        </Modal>
    );
};

export default NotesModal;
