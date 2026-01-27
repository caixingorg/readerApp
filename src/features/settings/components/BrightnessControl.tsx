import React from 'react';
// Removed unused View
import Slider from '@react-native-community/slider';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';

interface BrightnessControlProps {
    brightness: number;
    onBrightnessChange: (value: number) => void;
    autoBrightness?: boolean;
    onAutoBrightnessChange?: (value: boolean) => void;
}

const BrightnessControl: React.FC<BrightnessControlProps> = ({
    brightness,
    onBrightnessChange,
    autoBrightness = false,
    onAutoBrightnessChange,
}) => {
    const theme = useTheme<Theme>();

    return (
        <Box backgroundColor="cardPrimary" borderRadius="l" padding="m">
            <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                marginBottom="s"
            >
                <Text variant="body" fontWeight="medium">
                    Brightness
                </Text>
                <Text variant="caption" color="textSecondary">
                    Auto
                </Text>
            </Box>

            <Box flexDirection="row" alignItems="center">
                <Box marginRight="m">
                    <Ionicons name="sunny-outline" size={24} color={theme.colors.textSecondary} />
                </Box>
                <Slider
                    style={{ flex: 1, height: 40 }}
                    minimumValue={0}
                    maximumValue={1}
                    step={0.05}
                    value={brightness}
                    onValueChange={onBrightnessChange}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.borderLight}
                    thumbTintColor={theme.colors.textPrimary}
                />
                <Box marginLeft="m">
                    <Ionicons name="settings-sharp" size={20} color={theme.colors.textPrimary} />
                </Box>
            </Box>
        </Box>
    );
};

export default BrightnessControl;
