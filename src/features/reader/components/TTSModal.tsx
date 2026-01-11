import React, { useEffect, useState, useRef } from 'react';
import { Modal, TouchableOpacity, View, Platform, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Play, Pause, Square, Volume2, Mic, Gauge } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { BlurView } from 'expo-blur';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';
import { useTranslation } from 'react-i18next';

import { useReaderSettings } from '@/features/reader/stores/useReaderSettings';

interface TTSModalProps {
    visible: boolean;
    onClose: () => void; // Mimimize

    // Controlled Props
    isPlaying: boolean;
    isPaused: boolean;
    statusText: string;
    onPlayPause: () => void;
    onStop: () => void;
    onRateChange: (rate: number) => void;
    currentRate: number;

    content: string; // Used for display context if needed, but speaking logic is lifted
}

const RATES = [0.75, 1.0, 1.25, 1.5, 2.0];

const TTSModal: React.FC<TTSModalProps> = ({
    visible,
    onClose,
    content,
    isPlaying,
    isPaused,
    statusText,
    onPlayPause,
    onStop,
    onRateChange,
    currentRate
}) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const isDark = [
        '#020617', '#0F172A', '#121212', '#000000',
        '#0C0A09', '#1C1917', '#292524'
    ].includes(theme.colors.mainBackground);

    const cleanTextRef = useRef('');

    useEffect(() => {
        if (content) {
            let clean = content
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            cleanTextRef.current = clean;
        }
    }, [content]);

    const changeRate = () => {
        let currentIndex = RATES.findIndex(r => Math.abs(r - currentRate) < 0.1);
        if (currentIndex === -1) currentIndex = 1;
        const nextIndex = (currentIndex + 1) % RATES.length;
        const newRate = RATES[nextIndex];
        onRateChange(newRate);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: theme.colors.mainBackground }]}>
                <BlurView
                    intensity={Platform.OS === 'ios' ? 80 : 100}
                    tint={isDark ? 'dark' : 'light'}
                    style={styles.flex1}
                >
                    {/* Header */}
                    <Box
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="space-between"
                        paddingHorizontal="l"
                        paddingTop="l"
                        paddingBottom="m"
                        borderBottomWidth={1}
                        borderBottomColor="border"
                    >
                        <TouchableOpacity
                            onPress={onClose}
                            style={[
                                styles.closeButton,
                                { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.cardSecondary }
                            ]}
                        >
                            <ChevronDown size={24} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                        <Text variant="subheader" fontSize={18}>{t('tts.title')}</Text>
                        <View style={styles.headerSpacer} />
                    </Box>

                    {/* Main Visual */}
                    <View style={styles.mainVisualContainer}>
                        <View
                            style={[
                                styles.rippleOuter,
                                {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.colors.cardSecondary,
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.border
                                }
                            ]}
                        >
                            <View
                                style={[
                                    styles.rippleInner,
                                    { backgroundColor: theme.colors.cardPrimary }
                                ]}
                            >
                                <Volume2 size={64} color={isPlaying && !isPaused ? theme.colors.primary : theme.colors.textSecondary} strokeWidth={1.5} />
                            </View>
                        </View>

                        <Text variant="body" fontWeight="500" marginBottom="xs" color="textPrimary">
                            {statusText}
                        </Text>
                        <Text variant="small" style={[styles.textCentered, { color: theme.colors.textTertiary }]} numberOfLines={3}>
                            {cleanTextRef.current}
                        </Text>
                    </View>

                    {/* Controls */}
                    <Box flexDirection="row" alignItems="center" justifyContent="center" gap="xl" paddingBottom="xxl">
                        {/* Speed */}
                        <TouchableOpacity onPress={changeRate} style={styles.controlButtonSmall}>
                            <Text variant="body" fontWeight="700" color="textPrimary">
                                {currentRate}x
                            </Text>
                            <Text variant="small" color="textSecondary">{t('tts.speed')}</Text>
                        </TouchableOpacity>

                        {/* Play/Pause */}
                        <TouchableOpacity
                            onPress={onPlayPause}
                            style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
                        >
                            {isPlaying && !isPaused ? (
                                <Pause size={36} color="white" fill="white" />
                            ) : (
                                <Play size={36} color="white" fill="white" style={styles.playIconSpacer} />
                            )}
                        </TouchableOpacity>

                        {/* Stop */}
                        <TouchableOpacity onPress={onStop} style={styles.controlButtonSmall}>
                            <Square size={24} color={theme.colors.textPrimary} fill={theme.colors.textPrimary} />
                            <Text variant="small" marginTop="xs" color="textSecondary">{t('tts.stop')}</Text>
                        </TouchableOpacity>
                    </Box>
                </BlurView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    flex1: {
        flex: 1
    },
    headerSpacer: {
        width: 40
    },
    textCentered: {
        paddingHorizontal: 32,
        textAlign: 'center'
    },
    playIconSpacer: {
        marginLeft: 4
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999
    },
    mainVisualContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -80
    },
    rippleOuter: {
        width: 192,
        height: 192,
        borderRadius: 96,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        borderWidth: 1
    },
    rippleInner: {
        width: 160,
        height: 160,
        borderRadius: 80,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5
    },
    controlButtonSmall: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 56
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6
    }
});

export default TTSModal;
