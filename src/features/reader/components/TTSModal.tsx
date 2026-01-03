import React, { useEffect, useState, useRef } from 'react';
import { Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';

interface TTSModalProps {
    visible: boolean;
    onClose: () => void;
    content: string; // HTML or Plain Text
}

const RATES = [0.75, 1.0, 1.25, 1.5, 2.0];

const TTSModal: React.FC<TTSModalProps> = ({ visible, onClose, content }) => {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [rateIndex, setRateIndex] = useState(1); // Default 1.0
    const [statusText, setStatusText] = useState('准备就绪');

    const cleanTextRef = useRef('');

    // Pre-process text when content changes
    useEffect(() => {
        if (content) {
            // Strip HTML tags for TTS
            const text = content.replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            cleanTextRef.current = text;
        }
    }, [content]);

    // Handle Modal Open/Close
    useEffect(() => {
        if (visible) {
            startSpeaking();
        } else {
            stopSpeaking();
        }
    }, [visible]);

    const startSpeaking = () => {
        const text = cleanTextRef.current;
        if (!text) {
            setStatusText('当前章节无文字内容');
            return;
        }

        setStatusText('正在朗读...');
        setIsPlaying(true);
        setIsPaused(false);

        Speech.speak(text, {
            rate: RATES[rateIndex],
            language: 'zh-CN', // Auto-detect or fixed? Let's try explicit for now, or remove for auto
            pitch: 1.0,
            onDone: () => {
                setIsPlaying(false);
                setIsPaused(false);
                setStatusText('朗读结束');
            },
            onStopped: () => {
                setIsPlaying(false);
                setIsPaused(false);
                setStatusText('已停止');
            },
            onError: (e) => {
                setIsPlaying(false);
                setStatusText('朗读出错: ' + e.message);
            }
        });
    };

    const stopSpeaking = () => {
        Speech.stop();
        setIsPlaying(false);
        setIsPaused(false);
    };

    const togglePlayPause = async () => {
        if (isPlaying) {
            if (isPaused) {
                Speech.resume();
                setIsPaused(false);
                setStatusText('正在朗读...');
            } else {
                Speech.pause();
                setIsPaused(true);
                setStatusText('已暂停');
            }
        } else {
            startSpeaking();
        }
    };

    const changeRate = () => {
        // Need to stop and restart to change rate on some versions, 
        // but let's just cycle the index first. 
        // Android/iOS behavior differs on dynamic rate change.
        // Safest is to update index, stop, and if playing, restart.
        const nextIndex = (rateIndex + 1) % RATES.length;
        setRateIndex(nextIndex);

        // If currently speaking, we effectively need to restart to apply rate (on many engines)
        if (isPlaying) {
            Speech.stop();
            // Small timeout to allow stop to process
            setTimeout(() => {
                // Re-trigger speak with new rate. 
                // Note: This restarts from beginning! 
                // Speech.speak doesn't support "seek". 
                // Ideally we'd just set the state and let user restart, 
                // or accept that it restarts the chapter.
                // For MVP: Just update state. User needs to re-play to apply if logic requires it.
                // Actually, let's just stop.
                setIsPlaying(false);
                setStatusText('语速已切换，请重新播放');
            }, 200);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet" // Better for iOS
            onRequestClose={onClose}
        >
            <Box flex={1} backgroundColor="background">
                {/* Header */}
                <Box
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="space-between"
                    paddingHorizontal="m"
                    paddingBottom="s"
                    borderBottomWidth={1}
                    borderBottomColor="border"
                    style={{ paddingTop: 20 }} // Modal default padding
                >
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="chevron-down" size={32} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text variant="title">语音朗读</Text>
                    <Box width={32} />
                </Box>

                {/* Content */}
                <Box flex={1} justifyContent="center" alignItems="center" padding="xl">
                    <Box
                        width={120}
                        height={120}
                        borderRadius="xl"
                        backgroundColor="card"
                        justifyContent="center"
                        alignItems="center"
                        style={{ elevation: 5, shadowOpacity: 0.2, shadowRadius: 10 }}
                    >
                        <Ionicons name={isPlaying && !isPaused ? "volume-high" : "volume-medium"} size={60} color={theme.colors.primary} />
                    </Box>

                    <Text variant="body" marginTop="l" textAlign="center" color="textSecondary">
                        {statusText}
                    </Text>

                    {/* Controls */}
                    <Box flexDirection="row" gap="xl" marginTop="xl" alignItems="center">
                        {/* Speed Button */}
                        <TouchableOpacity onPress={changeRate} style={{ alignItems: 'center' }}>
                            <Text variant="small" fontWeight="bold">{RATES[rateIndex]}x</Text>
                            <Text variant="small" color="textSecondary">倍速</Text>
                        </TouchableOpacity>

                        {/* Play/Pause */}
                        <TouchableOpacity onPress={togglePlayPause}>
                            <Ionicons
                                name={isPlaying && !isPaused ? "pause-circle" : "play-circle"}
                                size={80}
                                color={theme.colors.primary}
                            />
                        </TouchableOpacity>

                        {/* Stop/Sync (Placeholder for now) */}
                        <TouchableOpacity onPress={stopSpeaking} style={{ alignItems: 'center' }}>
                            <Ionicons name="stop-circle-outline" size={32} color={theme.colors.text} />
                            <Text variant="small" color="textSecondary">停止</Text>
                        </TouchableOpacity>
                    </Box>

                    <Box marginTop="xl" paddingHorizontal="l">
                        <Text variant="small" color="textSecondary" textAlign="center">
                            提示：切换倍速会从头重新朗读。
                        </Text>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

export default TTSModal;
