import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Theme } from '../../../theme/theme';
import { BlurView } from 'expo-blur';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import clsx from 'clsx';

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
    { id: 'warm', label: '羊皮纸', color: '#F5E6D3', icon: 'cafe' },
    { id: 'eye-care', label: '护眼', color: '#CBE5D3', icon: 'leaf' },
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
    const isDark = theme.colors.card !== '#FFFFFF';

    if (!visible) return null;

    return (
        <Animated.View
            entering={SlideInDown.duration(250)}
            exiting={SlideOutDown.duration(200)}
            style={{ bottom: bottomOffset }}
            className="absolute left-2 right-2 rounded-2xl overflow-hidden z-40"
        >
            <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} className="p-4 rounded-2xl">
                {/* Brightness Slider */}
                <View className="flex-row items-center mb-6">
                    <Ionicons name="sunny-outline" size={20} color={theme.colors.text} className="mr-3" />
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
                    <Ionicons name="sunny" size={24} color={theme.colors.text} className="ml-3" />
                </View>

                {/* Theme Options */}
                <View className="flex-row justify-around">
                    {themes.map((t) => (
                        <TouchableOpacity
                            key={t.id}
                            onPress={() => onSelectMode(t.id)}
                            className="items-center"
                        >
                            <View
                                className={clsx(
                                    "w-12 h-12 rounded-full items-center justify-center mb-2 border-2",
                                    currentMode === t.id ? "border-primary-500" : "border-gray-200 dark:border-gray-700"
                                )}
                                style={{ backgroundColor: t.color }}
                            >
                                {currentMode === t.id && (
                                    <Ionicons name="checkmark" size={24} color={t.id === 'dark' ? 'white' : 'black'} />
                                )}
                            </View>
                            <Text className={clsx("text-xs", currentMode === t.id ? "text-primary-500 font-bold" : "text-gray-500 dark:text-gray-400")}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </BlurView>
        </Animated.View>
    );
};

export default ThemeSettingsPanel;
