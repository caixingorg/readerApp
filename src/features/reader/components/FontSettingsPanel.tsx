import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Slider from '@react-native-community/slider';
import { Theme } from '@/theme/theme';
import { BlurView } from 'expo-blur';
import { Type, ChevronRight, CaseUpper, MoveVertical } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Box from '@/components/Box';
import Text from '@/components/Text';

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
        <View style={[styles.container, { bottom: bottomOffset }]}>
            <BlurView
                intensity={Platform.OS === 'ios' ? 40 : 95}
                tint={isDark ? 'systemThickMaterialDark' : 'systemMaterial'}
                style={styles.blurContainer}
            >
                {/* 1. Font Size Slider */}
                <View style={[styles.sectionContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <CaseUpper size={16} color={theme.colors.textSecondary} />
                    <Slider
                        style={styles.slider}
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
                    style={[styles.familySelector, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    activeOpacity={0.7}
                    onPress={() => {
                        const next = fontFamily === 'system' ? 'serif' : fontFamily === 'serif' ? 'sans-serif' : 'system';
                        setFontFamily(next);
                    }}
                >
                    <Box flexDirection="row" alignItems="center" gap="s">
                        <Box
                            width={32}
                            height={32}
                            borderRadius="full"
                            backgroundColor="mainBackground" // Fallback
                            style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#FFFFFF' }}
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Type size={18} color={theme.colors.textPrimary} />
                        </Box>
                        <Text variant="body" fontWeight="600" color="textPrimary">
                            {getFontName(fontFamily)}
                        </Text>
                    </Box>
                    <ChevronRight size={20} color={theme.colors.textTertiary} />
                </TouchableOpacity>

                {/* 3. Line Height / Layout */}
                <View style={[styles.lineHeightContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    {[1.2, 1.5, 1.8].map((lh, index) => {
                        const isActive = lineHeight === lh;
                        return (
                            <TouchableOpacity
                                key={lh}
                                onPress={() => setLineHeight(lh)}
                                style={[
                                    styles.lhButton,
                                    isActive && { backgroundColor: isDark ? '#374151' : '#FFFFFF' }, // Approximate gray-700 / white
                                    isActive && styles.shadow
                                ]}
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
    sectionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderRadius: 16,
        padding: 12
    },
    slider: {
        flex: 1,
        marginHorizontal: 12,
        height: 40
    },
    familySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20
    },
    lineHeightContainer: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 6,
        justifyContent: 'space-between'
    },
    lhButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1
    }
});

export default FontSettingsPanel;
