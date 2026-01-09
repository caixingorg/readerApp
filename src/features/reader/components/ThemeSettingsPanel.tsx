import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Slider from '@react-native-community/slider';
import { Theme } from '../../../theme/theme';
import { BlurView } from 'expo-blur';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import clsx from 'clsx';
import { Sun, Moon, Coffee, Leaf, Check } from 'lucide-react-native';

export type ReaderThemeMode = 'light' | 'dark' | 'warm' | 'eye-care';

interface ThemeSettingsPanelProps {
    visible: boolean;
    currentMode: ReaderThemeMode;
    onSelectMode: (mode: ReaderThemeMode) => void;
    brightness: number;
    setBrightness: (val: number) => void;
    bottomOffset?: number;
}

const themes: { id: ReaderThemeMode; label: string; color: string; Icon: any }[] = [
    { id: 'light', label: 'Light', color: '#FFFFFF', Icon: Sun },
    { id: 'dark', label: 'Dark', color: '#1F2937', Icon: Moon },
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
    const isDark = theme.colors.mainBackground === '#121212' || theme.colors.mainBackground === '#000000';

    if (!visible) return null;

    return (
        <View
            style={{ bottom: bottomOffset }}
            className="absolute left-4 right-4 z-40"
        >
            <BlurView
                intensity={90}
                tint={isDark ? 'dark' : 'light'}
                style={{ borderRadius: 24, padding: 20, overflow: 'hidden' }}
            >
                {/* Brightness Slider */}
                <View className="flex-row items-center mb-6 bg-black/5 dark:bg-white/10 rounded-2xl p-3">
                    <Sun size={18} color={theme.colors.textSecondary} style={{ marginRight: 12, opacity: 0.5 }} />
                    <Slider
                        style={{ flex: 1, height: 40 }}
                        minimumValue={0}
                        maximumValue={1}
                        value={brightness}
                        onValueChange={setBrightness}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                        thumbTintColor={theme.colors.primary}
                    />
                    <Sun size={22} color={theme.colors.textPrimary} style={{ marginLeft: 12 }} />
                </View>

                {/* Theme Options */}
                <View className="flex-row gap-4">
                    {themes.map((t) => (
                        <TouchableOpacity
                            key={t.id}
                            onPress={() => onSelectMode(t.id)}
                            className="flex-1"
                            activeOpacity={0.8}
                        >
                            <View
                                className={clsx(
                                    "flex-row items-center justify-center py-4 rounded-xl border-2 gap-3",
                                    currentMode === t.id
                                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                        : "border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5"
                                )}
                                style={{
                                    borderColor: currentMode === t.id ? theme.colors.primary : undefined
                                }}
                            >
                                <t.Icon size={20} color={currentMode === t.id ? theme.colors.primary : theme.colors.textSecondary} />
                                <Text
                                    className={clsx("text-base font-semibold")}
                                    style={{
                                        color: currentMode === t.id ? theme.colors.primary : theme.colors.textSecondary
                                    }}
                                >
                                    {t.label}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </BlurView>
        </View>
    );
};

export default ThemeSettingsPanel;
