import React from 'react';
import { TouchableOpacity, View, Text, Platform } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Slider from '@react-native-community/slider';
import { Theme } from '../../../theme/theme';
import { BlurView } from 'expo-blur';
import clsx from 'clsx';
import { Sun, Moon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

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
        '#020617', '#0F172A', '#121212', // Old Slate/Dark
        '#0C0A09', '#1C1917', '#292524'  // New Stone Dark
    ].includes(theme.colors.mainBackground);

    const themes: { id: ReaderThemeMode; label: string; color: string; Icon: any }[] = [
        { id: 'light', label: t('reader.themes.light'), color: '#FFFFFF', Icon: Sun },
        { id: 'dark', label: t('reader.themes.dark'), color: '#1F2937', Icon: Moon },
    ];


    if (!visible) return null;

    return (
        <View
            style={{ bottom: bottomOffset, zIndex: 100 }}
            className="absolute left-4 right-4"
        >
            <BlurView
                intensity={Platform.OS === 'ios' ? 40 : 95}
                tint={isDark ? 'systemThickMaterialDark' : 'systemMaterial'}
                style={{
                    borderRadius: 24,
                    padding: 20,
                    overflow: 'hidden',
                    backgroundColor: isDark ? 'rgba(2, 6, 23, 0.8)' : 'rgba(255, 255, 255, 0.8)'
                }}
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
                    {themes.map((tItem) => (
                        <TouchableOpacity
                            key={tItem.id}
                            onPress={() => onSelectMode(tItem.id)}
                            className="flex-1"
                            activeOpacity={0.8}
                        >
                            <View
                                className={clsx(
                                    "flex-row items-center justify-center py-4 rounded-xl border-2 gap-3",
                                    currentMode === tItem.id
                                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                        : "border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5"
                                )}
                                style={{
                                    borderColor: currentMode === tItem.id ? theme.colors.primary : undefined
                                }}
                            >
                                <tItem.Icon size={20} color={currentMode === tItem.id ? theme.colors.primary : theme.colors.textSecondary} />
                                <Text
                                    className={clsx("text-base font-semibold")}
                                    style={{
                                        color: currentMode === tItem.id ? theme.colors.primary : theme.colors.textSecondary
                                    }}
                                >
                                    {tItem.label}
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
