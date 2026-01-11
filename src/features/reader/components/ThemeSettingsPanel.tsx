import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Slider from '@react-native-community/slider';
import { Theme } from '@/theme/theme';
import { BlurView } from 'expo-blur';
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
        '#020617', '#0F172A', '#121212', // Old Slate/Dark
        '#0C0A09', '#1C1917', '#292524'  // New Stone Dark
    ].includes(theme.colors.mainBackground);

    const themes: { id: ReaderThemeMode; label: string; color: string; Icon: any }[] = [
        { id: 'light', label: t('reader.themes.light'), color: '#FFFFFF', Icon: Sun },
        { id: 'dark', label: t('reader.themes.dark'), color: '#1F2937', Icon: Moon },
    ];


    if (!visible) return null;

    return (
        <View style={[
            styles.container,
            { bottom: bottomOffset }
        ]}>
            <BlurView
                intensity={Platform.OS === 'ios' ? 40 : 95}
                tint={isDark ? 'systemThickMaterialDark' : 'systemMaterial'}
                style={styles.blurContainer}
            >
                {/* Brightness Slider */}
                <View style={[
                    styles.brightnessContainer,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                ]}>
                    <Sun size={18} color={theme.colors.textSecondary} style={styles.sunIconDim} />
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={1}
                        value={brightness}
                        onValueChange={setBrightness}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                        thumbTintColor={theme.colors.primary}
                    />
                    <Sun size={22} color={theme.colors.textPrimary} style={styles.sunIconBright} />
                </View>

                {/* Theme Options */}
                <View style={styles.themeOptionsContainer}>
                    {themes.map((tItem) => {
                        const isSelected = currentMode === tItem.id;
                        return (
                            <TouchableOpacity
                                key={tItem.id}
                                onPress={() => onSelectMode(tItem.id)}
                                style={styles.flex1}
                                activeOpacity={0.8}
                            >
                                <View
                                    style={[
                                        styles.themeButton,
                                        isSelected
                                            ? {
                                                borderColor: theme.colors.primary,
                                                backgroundColor: isDark ? 'rgba(var(--primary-rgb), 0.2)' : theme.colors.cardSecondary // Fallback to accessible color
                                            }
                                            : {
                                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                                            },
                                        // Hack for primary bg: Restyle defines colors. We can use conditional styles.
                                        isSelected && { backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff' } // Fallback blue tint
                                    ]}
                                >
                                    <tItem.Icon size={20} color={isSelected ? theme.colors.primary : theme.colors.textSecondary} />
                                    <Text
                                        variant="body"
                                        fontWeight="600"
                                        style={{
                                            marginLeft: 8,
                                            color: isSelected ? theme.colors.primary : theme.colors.textSecondary
                                        }}
                                    >
                                        {tItem.label}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 100
    },
    blurContainer: {
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
    },
    brightnessContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        borderRadius: 16,
        padding: 12
    },
    slider: {
        flex: 1,
        height: 40
    },
    themeOptionsContainer: {
        flexDirection: 'row',
        gap: 16
    },
    themeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        gap: 8
    },
    flex1: {
        flex: 1
    },
    sunIconDim: {
        opacity: 0.5,
        marginRight: 12
    },
    sunIconBright: {
        marginLeft: 12
    }
});

export default ThemeSettingsPanel;
