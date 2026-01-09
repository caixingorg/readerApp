import React from 'react';
import { StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { useThemeStore } from '../../../stores/useThemeStore';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
    fontSize: number;
    setFontSize: (size: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    visible,
    onClose,
    fontSize,
    setFontSize,
}) => {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const { mode, setMode } = useThemeStore();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                {/* Click outside to close */}
            </TouchableOpacity>

            <Box
                backgroundColor="background"
                borderTopLeftRadius="xl"
                borderTopRightRadius="xl"
                paddingHorizontal="m"
                paddingTop="l"
                style={{
                    paddingBottom: insets.bottom + 20,
                    // Adaptive height by nature of Box content
                }}
            >
                {/* 1. Font Size Control */}
                <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="l">
                    <Text variant="body">字号</Text>
                    <Box flexDirection="row" alignItems="center" gap="m">
                        <TouchableOpacity onPress={() => setFontSize(Math.max(12, fontSize - 2))}>
                            <Ionicons name="remove-circle-outline" size={32} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <Text variant="title">{fontSize}</Text>
                        <TouchableOpacity onPress={() => setFontSize(Math.min(32, fontSize + 2))}>
                            <Ionicons name="add-circle-outline" size={32} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </Box>
                </Box>

                {/* 2. Theme Control */}
                <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="m">
                    <Text variant="body">主题</Text>
                    <TouchableOpacity
                        onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 8,
                            backgroundColor: theme.colors.cardPrimary,
                            borderRadius: 20
                        }}
                    >
                        <Ionicons
                            name={mode === 'dark' ? 'moon' : 'sunny'}
                            size={20}
                            color={theme.colors.text}
                        />
                        <Text variant="body" marginLeft="s">
                            {mode === 'dark' ? '夜间模式' : '日间模式'}
                        </Text>
                    </TouchableOpacity>
                </Box>
            </Box>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)', // Semi-transparent dimming
    },
});

export default SettingsModal;
