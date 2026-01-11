import React from 'react';
import { View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@shopify/restyle';
import { Play, Pause, X, Maximize2, Volume2 } from 'lucide-react-native';
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
    bottomOffset = 0
}) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();
    // Robust checks against "Pro Max" dark palette (Slate + Stone)
    const isDark = [
        '#020617', '#0F172A', '#121212', '#000000', // Old Slate/Dark
        '#0C0A09', '#1C1917', '#292524'  // New Stone Dark
    ].includes(theme.colors.mainBackground);

    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeInUp.duration(300)}
            exiting={FadeOutDown.duration(300)}
            style={[
                styles.container,
                { bottom: bottomOffset + 16 }
            ]}
        >
            <TouchableOpacity onPress={onExpand} activeOpacity={0.9}>
                <BlurView
                    intensity={Platform.OS === 'ios' ? 80 : 95}
                    tint={isDark ? 'dark' : 'light'}
                    style={[
                        styles.blurContainer,
                        {
                            backgroundColor: isDark ? 'rgba(12, 10, 9, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        }
                    ]}
                >
                    {/* Visual Icon */}
                    <Box
                        width={40}
                        height={40}
                        borderRadius="full"
                        alignItems="center"
                        justifyContent="center"
                        marginRight="s"
                        style={{ backgroundColor: theme.colors.primary }}
                    >
                        <Volume2 size={20} color="white" />
                    </Box>

                    {/* Status Text */}
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text variant="body" fontSize={14} fontWeight="600" color="textPrimary" numberOfLines={1}>
                            {isPlaying && !isPaused ? t('tts.status.reading') : t('tts.status.paused')}
                        </Text>
                        <Text variant="caption" fontSize={12} color="textSecondary">
                            {t('tts.tap_expand')}
                        </Text>
                    </View>

                    {/* Controls */}
                    <View style={styles.controls}>
                        {/* Play/Pause */}
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                onPlayPause();
                            }}
                            style={[
                                styles.controlButton,
                                { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                            ]}
                        >
                            {isPlaying && !isPaused ? (
                                <Pause size={20} color={theme.colors.textPrimary} fill={theme.colors.textPrimary} />
                            ) : (
                                <Play size={20} color={theme.colors.textPrimary} fill={theme.colors.textPrimary} />
                            )}
                        </TouchableOpacity>

                        {/* Close / Stop */}
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                onStop();
                            }}
                            style={styles.controlButton}
                        >
                            <X size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 100, // High z-index
        alignItems: 'center'
    },
    blurContainer: {
        borderRadius: 32,
        padding: 8,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    controlButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999
    }
});

export default TTSMiniPlayer;
