import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Slider from '@react-native-community/slider';
import { Theme } from '@/theme/theme';
import { Sun, Moon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Box from '@/components/Box';
import Text from '@/components/Text';

export type ReaderThemeMode = 'light' | 'dark' | 'warm' | 'eye-care';

interface ThemeSettingsPanelProps {
    visible: boolean;
    currentMode: ReaderThemeMode;
    onSelectMode: (mode: ReaderThemeMode) => void;
    brightness: number;
    setBrightness: (val: number) => void;
    bottomOffset?: number;
}

const ThemeSettingsPanel: React.FC<ThemeSettingsPanelProps> = ({
    visible,
    currentMode,
    onSelectMode,
    brightness,
    setBrightness,
    bottomOffset = 0,
}) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();
    // Robust checks against "Pro Max" dark palette (Slate + Stone)
    const isDark = [
        '#020617',
        '#0F172A',
        '#121212', // Old Slate/Dark
        '#0C0A09',
        '#1C1917',
        '#292524', // New Stone Dark
    ].includes(theme.colors.mainBackground);

    const themes: { id: ReaderThemeMode; label: string; color: string; Icon: any }[] = [
        { id: 'light', label: t('reader.themes.light'), color: '#FFFFFF', Icon: Sun },
        { id: 'dark', label: t('reader.themes.dark'), color: '#1F2937', Icon: Moon },
    ];

    if (!visible) return null;

    return (
        <Box
            position="absolute"
            left={0}
            right={0}
            bottom={bottomOffset} // Lift panel above footer
            zIndex={200} // Ensure it sits ABOVE the footer (zIndex 101)
            backgroundColor="background"
            borderTopLeftRadius="xl"
            borderTopRightRadius="xl"
            padding="l"
            paddingTop="m"
            paddingBottom="xl"
            style={{
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 20,
            }}
        >
            {/* Handlebar */}
            <Box alignItems="center" marginBottom="l">
                <Box width={48} height={6} backgroundColor="borderLight" borderRadius="full" />
            </Box>

            {/* Brightness Slider */}
            <Box
                flexDirection="row"
                alignItems="center"
                marginBottom="l"
                borderRadius="xl"
                padding="m"
                backgroundColor={isDark ? 'glassStrong' : 'cardSecondary'}
            >
                <Box marginRight="m" opacity={0.5}>
                    <Sun size={18} color={theme.colors.textSecondary} />
                </Box>
                <Slider
                    style={{ flex: 1, height: 40 }}
                    minimumValue={0}
                    maximumValue={1}
                    value={brightness}
                    onValueChange={setBrightness}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.border}
                    thumbTintColor={theme.colors.primary}
                />
                <Box marginLeft="m">
                    <Sun size={22} color={theme.colors.textPrimary} />
                </Box>
            </Box>

            {/* Theme Options */}
            <Box flexDirection="row" gap="m">
                {themes.map((tItem) => {
                    const isSelected = currentMode === tItem.id;
                    return (
                        <TouchableOpacity
                            key={tItem.id}
                            onPress={() => onSelectMode(tItem.id)}
                            style={{ flex: 1 }}
                            activeOpacity={0.8}
                        >
                            <Box
                                flexDirection="row"
                                alignItems="center"
                                justifyContent="center"
                                paddingVertical="m"
                                borderRadius="l"
                                borderWidth={2}
                                gap="s"
                                backgroundColor={
                                    isSelected
                                        ? isDark
                                            ? 'glassStrong'
                                            : 'cardSecondary'
                                        : 'cardSecondary'
                                }
                                borderColor={isSelected ? 'primary' : 'border'}
                            >
                                <tItem.Icon
                                    size={20}
                                    color={
                                        isSelected
                                            ? theme.colors.primary
                                            : theme.colors.textSecondary
                                    }
                                />
                                <Text
                                    variant="body"
                                    fontWeight="600"
                                    color={isSelected ? 'primary' : 'textSecondary'}
                                    marginLeft="s"
                                >
                                    {tItem.label}
                                </Text>
                            </Box>
                        </TouchableOpacity>
                    );
                })}
            </Box>
        </Box>
    );
};

export default ThemeSettingsPanel;
