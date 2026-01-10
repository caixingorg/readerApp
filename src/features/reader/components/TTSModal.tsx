import React, { useEffect, useState, useRef } from 'react';
import { Modal, TouchableOpacity, View, Platform } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Play, Pause, Square, Volume2, Mic, Gauge } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { BlurView } from 'expo-blur';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { useTranslation } from 'react-i18next'; // Imported

import { useReaderSettings } from '../../reader/stores/useReaderSettings';

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
    const { t } = useTranslation(); // Init hook
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
            <View style={{ flex: 1, backgroundColor: theme.colors.mainBackground }}>
                <BlurView
                    intensity={Platform.OS === 'ios' ? 80 : 100}
                    tint={isDark ? 'dark' : 'light'}
                    style={{ flex: 1 }}
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-5 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <TouchableOpacity onPress={onClose} className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
                            <ChevronDown size={24} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                        <Text variant="subheader" fontSize={18}>{t('tts.title')}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Main Visual */}
                    <View className="flex-1 items-center justify-center -mt-20">
                        <View
                            className="w-48 h-48 rounded-full items-center justify-center mb-8"
                            style={{
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                            }}
                        >
                            <View
                                className="w-40 h-40 rounded-full items-center justify-center shadow-lg"
                                style={{ backgroundColor: theme.colors.cardPrimary }}
                            >
                                <Volume2 size={64} color={isPlaying && !isPaused ? theme.colors.primary : theme.colors.textSecondary} strokeWidth={1.5} />
                            </View>
                        </View>

                        <Text className="text-lg font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                            {statusText}
                        </Text>
                        <Text className="text-sm px-8 text-center" style={{ color: theme.colors.textTertiary }} numberOfLines={3}>
                            {cleanTextRef.current}
                        </Text>
                    </View>

                    {/* Controls */}
                    <View className="flex-row items-center justify-center gap-10 pb-20">
                        {/* Speed */}
                        <TouchableOpacity onPress={changeRate} className="items-center justify-center w-14">
                            <Text className="text-lg font-bold" style={{ color: theme.colors.textPrimary }}>
                                {currentRate}x
                            </Text>
                            <Text className="text-xs" style={{ color: theme.colors.textSecondary }}>{t('tts.speed')}</Text>
                        </TouchableOpacity>

                        {/* Play/Pause */}
                        <TouchableOpacity
                            onPress={onPlayPause}
                            className="w-20 h-20 rounded-full items-center justify-center shadow-md bg-primary-500"
                            style={{ backgroundColor: theme.colors.primary }}
                        >
                            {isPlaying && !isPaused ? (
                                <Pause size={36} color="white" fill="white" />
                            ) : (
                                <Play size={36} color="white" fill="white" style={{ marginLeft: 4 }} />
                            )}
                        </TouchableOpacity>

                        {/* Stop */}
                        <TouchableOpacity onPress={onStop} className="items-center justify-center w-14">
                            <Square size={24} color={theme.colors.textPrimary} fill={theme.colors.textPrimary} />
                            <Text className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>{t('tts.stop')}</Text>
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </View>
        </Modal>
    );
};

export default TTSModal;
