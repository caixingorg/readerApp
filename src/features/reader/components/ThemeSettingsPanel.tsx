import React from 'react';
import { TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';

export type ReaderThemeMode = 'light' | 'dark' | 'warm' | 'eye-care';

interface ThemeSettingsPanelProps {
    visible: boolean;
    currentMode: ReaderThemeMode;
    onSelectMode: (mode: ReaderThemeMode) => void;
    brightness: number;
    setBrightness: (val: number) => void;
    bottomOffset?: number;
}

const themes: { id: ReaderThemeMode; label: string; color: string; icon: any }[] = [
    { id: 'light', label: '默认', color: '#FFFFFF', icon: 'sunny' },
    { id: 'warm', label: '羊皮纸', color: '#F5E6D3', icon: 'cafe' }, // Sepia-ish
    { id: 'eye-care', label: '护眼', color: '#CBE5D3', icon: 'leaf' }, // Green-ish
    { id: 'dark', label: '夜间', color: '#1F2937', icon: 'moon' },
];

const ThemeSettingsPanel: React.FC<ThemeSettingsPanelProps> = ({
    visible,
    currentMode,
    onSelectMode,
    brightness,
    setBrightness,
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
            {/* Brightness Slider */}
            <Box flexDirection="row" alignItems="center" marginBottom="l">
                <Ionicons name="sunny-outline" size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
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
                <Ionicons name="sunny" size={24} color={theme.colors.textSecondary} style={{ marginLeft: 10 }} />
            </Box>

            <Box flexDirection="row" justifyContent="space-around">
                {themes.map((t) => (
                    <TouchableOpacity
                        key={t.id}
                        onPress={() => onSelectMode(t.id)}
                        style={{ alignItems: 'center' }}
                    >
                        <Box
                            width={48}
                            height={48}
                            borderRadius="full"
                            alignItems="center"
                            justifyContent="center"
                            marginBottom="s"
                            borderWidth={currentMode === t.id ? 2 : 1}
                            borderColor={currentMode === t.id ? 'primary' : 'border'}
                            style={{ backgroundColor: t.color }}
                        >
                            {currentMode === t.id && (
                                <Ionicons name="checkmark" size={24} color={t.id === 'dark' ? 'white' : 'black'} />
                            )}
                        </Box>
                        <Text variant="small" color={currentMode === t.id ? 'primary' : 'textSecondary'}>
                            {t.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </Box>
        </Box>
    );
};

export default ThemeSettingsPanel;
