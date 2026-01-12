import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@shopify/restyle';
import { Play, Pause, X, Volume2 } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import Text from '@/components/Text';
import Box from '@/components/Box';
import { Theme } from '@/theme/theme';

import { useTranslation } from 'react-i18next';

interface TTSMiniPlayerProps {
    visible: boolean;
    isPlaying: boolean;
    isPaused: boolean;
    onPlayPause: () => void;
    onStop: () => void;
    onExpand: () => void;
    bottomOffset?: number;
}

const TTSMiniPlayer: React.FC<TTSMiniPlayerProps> = ({
    visible,
    isPlaying,
    isPaused,
    onPlayPause,
    onStop,
    onExpand,
    bottomOffset = 0,
}) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();
    // Robust checks against "Pro Max" dark palette (Slate + Stone)
    const isDark = [
        '#020617',
        '#0F172A',
        '#121212',
        '#000000', // Old Slate/Dark
        '#0C0A09',
        '#1C1917',
        '#292524', // New Stone Dark
    ].includes(theme.colors.mainBackground);

    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeInUp.duration(300)}
            exiting={FadeOutDown.duration(300)}
            style={{
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: bottomOffset + 16,
                zIndex: 100,
                alignItems: 'center',
            }}
        >
            <TouchableOpacity onPress={onExpand} activeOpacity={0.9} style={{ width: '100%' }}>
                <BlurView
                    intensity={Platform.OS === 'ios' ? 80 : 95}
                    tint={isDark ? 'dark' : 'light'}
                    style={{
                        borderRadius: 32,
                        padding: 8,
                        overflow: 'hidden',
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        backgroundColor: isDark
                            ? 'rgba(12, 10, 9, 0.7)'
                            : 'rgba(255, 255, 255, 0.7)',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 5,
                    }}
                >
                    {/* Visual Icon */}
                    <Box
                        width={40}
                        height={40}
                        borderRadius="full"
                        alignItems="center"
                        justifyContent="center"
                        marginRight="s"
                        backgroundColor="primary"
                    >
                        <Volume2 size={20} color="white" />
                    </Box>

                    {/* Status Text */}
                    <Box flex={1} marginRight="s">
                        <Text
                            variant="body"
                            fontSize={14}
                            fontWeight="600"
                            color="textPrimary"
                            numberOfLines={1}
                        >
                            {isPlaying && !isPaused
                                ? t('tts.status.reading')
                                : t('tts.status.paused')}
                        </Text>
                        <Text variant="caption" fontSize={12} color="textSecondary">
                            {t('tts.tap_expand')}
                        </Text>
                    </Box>

                    {/* Controls */}
                    <Box flexDirection="row" alignItems="center" gap="s">
                        {/* Play/Pause */}
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                onPlayPause();
                            }}
                            style={{
                                width: 40,
                                height: 40,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 999,
                                backgroundColor: isDark
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'rgba(0,0,0,0.05)',
                            }}
                        >
                            {isPlaying && !isPaused ? (
                                <Pause
                                    size={20}
                                    color={theme.colors.textPrimary}
                                    fill={theme.colors.textPrimary}
                                />
                            ) : (
                                <Play
                                    size={20}
                                    color={theme.colors.textPrimary}
                                    fill={theme.colors.textPrimary}
                                />
                            )}
                        </TouchableOpacity>

                        {/* Close / Stop */}
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                onStop();
                            }}
                            style={{
                                width: 40,
                                height: 40,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 999,
                            }}
                        >
                            <X size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </Box>
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default TTSMiniPlayer;
