import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';

interface FontSettingsPanelProps {
    visible: boolean;
    fontSize: number;
    setFontSize: (size: number) => void;
    bottomOffset?: number;
}

const FontSettingsPanel: React.FC<FontSettingsPanelProps> = ({
    visible,
    fontSize,
    setFontSize,
    bottomOffset = 0,
}) => {
    const theme = useTheme<Theme>();

    if (!visible) return null;

    return (
        <Box
            position="absolute"
            bottom={bottomOffset}
            left={0}
            right={0}
            backgroundColor="background"
            borderTopLeftRadius="xl"
            borderTopRightRadius="xl"
            paddingHorizontal="m"
            paddingTop="l"
            paddingBottom="l"
            borderTopWidth={1}
            borderTopColor="border"
            shadowOpacity={0.1}
            shadowRadius={4}
            elevation={4}
        >
            <Box flexDirection="row" alignItems="center" justifyContent="center">
                <TouchableOpacity onPress={() => setFontSize(Math.max(12, fontSize - 1))}>
                    <Ionicons name="remove-circle-outline" size={40} color={theme.colors.primary} />
                </TouchableOpacity>

                <Box width={60} alignItems="center">
                    <Text variant="title">{fontSize}</Text>
                </Box>

                <TouchableOpacity onPress={() => setFontSize(Math.min(32, fontSize + 1))}>
                    <Ionicons name="add-circle-outline" size={40} color={theme.colors.primary} />
                </TouchableOpacity>
            </Box>
        </Box>
    );
};

export default FontSettingsPanel;
