import React from 'react';
import { StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';

interface FontSizeSliderProps {
    fontSize: number;
    onFontSizeChange: (size: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

const FontSizeSlider: React.FC<FontSizeSliderProps> = ({
    fontSize,
    onFontSizeChange,
    min = 12,
    max = 32,
    step = 1
}) => {
    const theme = useTheme<Theme>();

    return (
        <Box
            backgroundColor="card"
            borderRadius="l"
            padding="m"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            height={60}
        >
            <Text variant="body" fontWeight="medium" style={styles.label}>Font Size</Text>

            <Box flexDirection="row" alignItems="center" flex={1} gap="s">
                <Text variant="body" fontSize={14} color="textSecondary">Aa</Text>
                <Slider
                    style={styles.slider}
                    minimumValue={min}
                    maximumValue={max}
                    step={step}
                    value={fontSize}
                    onValueChange={onFontSizeChange}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.border}
                    thumbTintColor={theme.colors.background}
                />
                <Text variant="body" fontSize={20} fontWeight="bold" color="text">Aa</Text>
            </Box>
        </Box>
    );
};

const styles = StyleSheet.create({
    label: {
        width: 80
    },
    slider: {
        flex: 1,
        height: 40
    }
});

export default FontSizeSlider;
