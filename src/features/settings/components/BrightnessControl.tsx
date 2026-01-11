import React from 'react';
import { StyleSheet, View } from 'react-native';
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
    onAutoBrightnessChange
}) => {
    const theme = useTheme<Theme>();

    return (
        <Box
            backgroundColor="card"
            borderRadius="l"
            padding="m"
        >
            <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="s">
                <Text variant="body" fontWeight="medium">Brightness</Text>
                <Text variant="caption" color="textSecondary">Auto</Text>
            </Box>

            <Box flexDirection="row" alignItems="center">
                <Ionicons
                    name="sunny-outline"
                    size={24}
                    color={theme.colors.textSecondary}
                    style={styles.sunIcon}
                />
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    step={0.05}
                    value={brightness}
                    onValueChange={onBrightnessChange}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.borderLight}
                    thumbTintColor={theme.colors.background}
                />
                <Ionicons
                    name="settings-sharp"
                    size={20}
                    color={theme.colors.textPrimary}
                    style={styles.settingsIcon}
                />
            </Box>
        </Box>
    );
};

const styles = StyleSheet.create({
    sunIcon: {
        marginRight: 12
    },
    slider: {
        flex: 1,
        height: 40
    },
    settingsIcon: {
        marginLeft: 12
    }
});

export default BrightnessControl;
