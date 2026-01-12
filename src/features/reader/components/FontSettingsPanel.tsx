import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Slider from '@react-native-community/slider';
import { Theme } from '@/theme/theme';
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
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    margin,
    setMargin, // Unused visually but kept for compatibility
    fontFamily,
    setFontFamily,
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

    if (!visible) return null;

    const getFontName = (f: string) => {
        if (f === 'serif') return t('reader.fonts.serif');
        if (f === 'sans-serif') return t('reader.fonts.sans_serif');
        return t('reader.fonts.system');
    };

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

            {/* 1. Font Size Slider */}
            <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                marginBottom="m"
                borderRadius="l"
                padding="m"
                backgroundColor={isDark ? 'glassStrong' : 'cardSecondary'}
            >
                <CaseUpper size={16} color={theme.colors.textSecondary} />
                <Slider
                    style={{ flex: 1, marginHorizontal: 12, height: 40 }}
                    minimumValue={12}
                    maximumValue={32}
                    step={1}
                    value={fontSize}
                    onValueChange={setFontSize}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.border}
                    thumbTintColor={theme.colors.primary}
                />
                <CaseUpper size={24} color={theme.colors.textPrimary} strokeWidth={2.5} />
            </Box>

            {/* 2. Font Family Selector */}
            <TouchableOpacity
                onPress={() => {
                    const next =
                        fontFamily === 'system'
                            ? 'serif'
                            : fontFamily === 'serif'
                              ? 'sans-serif'
                              : 'system';
                    setFontFamily(next);
                }}
                activeOpacity={0.7}
            >
                <Box
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    borderRadius="l"
                    padding="l"
                    marginBottom="m"
                    backgroundColor={isDark ? 'glassStrong' : 'cardSecondary'}
                >
                    <Box flexDirection="row" alignItems="center" gap="s">
                        <Box
                            width={32}
                            height={32}
                            borderRadius="full"
                            alignItems="center"
                            justifyContent="center"
                            backgroundColor="mainBackground"
                            style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#FFFFFF' }}
                        >
                            <Type size={18} color={theme.colors.textPrimary} />
                        </Box>
                        <Text variant="body" fontWeight="600" color="textPrimary">
                            {getFontName(fontFamily)}
                        </Text>
                    </Box>
                    <ChevronRight size={20} color={theme.colors.textTertiary} />
                </Box>
            </TouchableOpacity>

            {/* 3. Line Height / Layout */}
            <Box
                flexDirection="row"
                borderRadius="l"
                padding="xs"
                justifyContent="space-between"
                backgroundColor={isDark ? 'glassStrong' : 'cardSecondary'}
            >
                {[1.2, 1.5, 1.8].map((lh, index) => {
                    const isActive = lineHeight === lh;
                    return (
                        <TouchableOpacity
                            key={lh}
                            onPress={() => setLineHeight(lh)}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                alignItems: 'center',
                                borderRadius: 12,
                                backgroundColor: isActive
                                    ? isDark
                                        ? theme.colors.cardSecondary
                                        : theme.colors.white
                                    : 'transparent',
                                // Shadow only for active state
                                ...(isActive
                                    ? {
                                          shadowColor: '#000',
                                          shadowOffset: { width: 0, height: 1 },
                                          shadowOpacity: 0.1,
                                          shadowRadius: 2,
                                          elevation: 1,
                                      }
                                    : {}),
                            }}
                        >
                            <MoveVertical
                                size={20}
                                color={isActive ? theme.colors.primary : theme.colors.textTertiary}
                                style={{ transform: [{ scaleY: 0.8 + index * 0.3 }] }}
                            />
                        </TouchableOpacity>
                    );
                })}
            </Box>
        </Box>
    );
};

export default FontSettingsPanel;
