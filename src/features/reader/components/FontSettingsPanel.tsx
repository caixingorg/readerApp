import React from 'react';
import { TouchableOpacity, View, Text, Platform } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Slider from '@react-native-community/slider';
import { Theme } from '../../../theme/theme';
import { BlurView } from 'expo-blur';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import clsx from 'clsx';
import { Type, AlignJustify, ChevronRight, CaseUpper, MoveVertical } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface FontSettingsPanelProps {
    visible: boolean;
    fontSize: number;
    setFontSize: (size: number) => void;
    lineHeight: number;
    setLineHeight: (h: number) => void;
    margin: number;
    setMargin: (m: number) => void;
    fontFamily: string;
    setFontFamily: (f: string) => void;
    bottomOffset?: number;
}

const FontSettingsPanel: React.FC<FontSettingsPanelProps> = ({
    visible,
    fontSize, setFontSize,
    lineHeight, setLineHeight,
    margin, setMargin, // Unused visually but kept for compatibility
    fontFamily, setFontFamily,
    bottomOffset = 0,
}) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();
    // Robust checks against "Pro Max" dark palette (Slate + Stone)
    const isDark = [
        '#020617', '#0F172A', '#121212', // Old Slate/Dark
        '#0C0A09', '#1C1917', '#292524'  // New Stone Dark
    ].includes(theme.colors.mainBackground);

    if (!visible) return null;

    const getFontName = (f: string) => {
        if (f === 'serif') return t('reader.fonts.serif');
        if (f === 'sans-serif') return t('reader.fonts.sans_serif');
        return t('reader.fonts.system');
    };

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
                {/* 1. Font Size Slider */}
                <View className="flex-row items-center justify-between mb-5 bg-black/5 dark:bg-white/10 rounded-2xl p-3">
                    <CaseUpper size={16} color={theme.colors.textSecondary} />
                    <Slider
                        style={{ flex: 1, height: 40, marginHorizontal: 12 }}
                        minimumValue={12}
                        maximumValue={32}
                        step={1}
                        value={fontSize}
                        onValueChange={setFontSize}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                        thumbTintColor={theme.colors.primary}
                    />
                    <CaseUpper size={24} color={theme.colors.textPrimary} strokeWidth={2.5} />
                </View>

                {/* 2. Font Family Selector */}
                <TouchableOpacity
                    className="flex-row items-center justify-between bg-black/5 dark:bg-white/10 rounded-2xl p-4 mb-5"
                    activeOpacity={0.7}
                    onPress={() => {
                        const next = fontFamily === 'system' ? 'serif' : fontFamily === 'serif' ? 'sans-serif' : 'system';
                        setFontFamily(next);
                    }}
                >
                    <View className="flex-row items-center gap-3">
                        <View className="w-8 h-8 rounded-full bg-white dark:bg-black/30 items-center justify-center">
                            <Type size={18} color={theme.colors.textPrimary} />
                        </View>
                        <Text className="text-base font-semibold" style={{ color: theme.colors.textPrimary }}>
                            {getFontName(fontFamily)}
                        </Text>
                    </View>
                    <ChevronRight size={20} color={theme.colors.textTertiary} />
                </TouchableOpacity>

                {/* 3. Line Height / Layout */}
                <View className="flex-row bg-black/5 dark:bg-white/10 rounded-2xl p-1.5 justify-between">
                    {[1.2, 1.5, 1.8].map((lh, index) => {
                        const isActive = lineHeight === lh;
                        return (
                            <TouchableOpacity
                                key={lh}
                                onPress={() => setLineHeight(lh)}
                                className={clsx(
                                    "flex-1 py-3 items-center rounded-xl",
                                    isActive ? "bg-white dark:bg-gray-700 shadow-sm" : ""
                                )}
                            >
                                <MoveVertical
                                    size={20}
                                    color={isActive ? theme.colors.primary : theme.colors.textTertiary}
                                    style={{ transform: [{ scaleY: 0.8 + index * 0.3 }] }}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
};

export default FontSettingsPanel;
