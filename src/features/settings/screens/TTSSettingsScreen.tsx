import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import Slider from '@react-native-community/slider';
import Box from '@/components/Box';
import Text from '@/components/Text';
import ScreenLayout from '@/components/ScreenLayout';
import { Theme } from '@/theme/theme';
import { useReaderSettings } from '@/features/reader/stores/useReaderSettings';
import { useNavigation } from '@react-navigation/native';

const TTSSettingsScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const navigation = useNavigation();
    const {
        ttsRate, setTtsRate,
        ttsPitch, setTtsPitch,
        ttsVoice, setTtsVoice
    } = useReaderSettings();

    const [voices, setVoices] = useState<Speech.Voice[]>([]);
    const [loadingVoices, setLoadingVoices] = useState(true);

    useEffect(() => {
        loadVoices();
    }, []);

    const loadVoices = async () => {
        try {
            const availableVoices = await Speech.getAvailableVoicesAsync();
            // Filter for Chinese/English or just show all but sort nicely
            const sortedVoices = availableVoices.sort((a, b) => {
                // Prioritize current language if possible, otherwise by name
                if (a.language.startsWith('zh') && !b.language.startsWith('zh')) return -1;
                if (!a.language.startsWith('zh') && b.language.startsWith('zh')) return 1;
                return a.name.localeCompare(b.name);
            });
            setVoices(sortedVoices);
        } catch (error) {
            console.error('Failed to load voices', error);
        } finally {
            setLoadingVoices(false);
        }
    };

    const handlePreview = () => {
        Speech.stop();
        Speech.speak('这是一段语音朗读测试，您觉得语速和音调合适吗？', {
            rate: ttsRate,
            pitch: ttsPitch,
            voice: ttsVoice || undefined,
            language: 'zh-CN'
        });
    };

    return (
        <ScreenLayout>
            <Box paddingHorizontal="l" paddingTop="m" paddingBottom="m" flexDirection="row" alignItems="center">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Box marginRight="m">
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                    </Box>
                </TouchableOpacity>
                <Text variant="header">朗读设置</Text>
            </Box>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Rate Control */}
                <Box marginBottom="xl">
                    <Box flexDirection="row" justifyContent="space-between" marginBottom="s">
                        <Text variant="title">语速</Text>
                        <Text variant="body" color="primary">{ttsRate.toFixed(1)}x</Text>
                    </Box>
                    <Box flexDirection="row" alignItems="center">
                        <Text variant="body" color="textSecondary">-</Text>
                        <Box flex={1} marginHorizontal="m">
                            <Slider
                                style={styles.slider}
                                minimumValue={0.5}
                                maximumValue={2.0}
                                step={0.1}
                                value={ttsRate}
                                onSlidingComplete={setTtsRate}
                                minimumTrackTintColor={theme.colors.primary}
                                maximumTrackTintColor={theme.colors.border}
                                thumbTintColor={theme.colors.primary}
                            />
                        </Box>
                        <Text variant="body" color="textSecondary">+</Text>
                    </Box>
                </Box>

                {/* Pitch Control */}
                <Box marginBottom="xl">
                    <Box flexDirection="row" justifyContent="space-between" marginBottom="s">
                        <Text variant="title">音调</Text>
                        <Text variant="body" color="primary">{ttsPitch.toFixed(1)}</Text>
                    </Box>
                    <Slider
                        style={styles.slider}
                        minimumValue={0.5}
                        maximumValue={2.0}
                        step={0.1}
                        value={ttsPitch}
                        onSlidingComplete={setTtsPitch}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={theme.colors.border}
                        thumbTintColor={theme.colors.primary}
                    />
                </Box>

                {/* Preview Button */}
                <Box marginBottom="xl">
                    <TouchableOpacity onPress={handlePreview}>
                        <Box
                            backgroundColor="primary"
                            paddingVertical="m"
                            borderRadius="m"
                            alignItems="center"
                            flexDirection="row"
                            justifyContent="center"
                        >
                            <Box marginRight="s">
                                <Ionicons name="play-circle-outline" size={20} color="white" />
                            </Box>
                            <Text variant="body" color="background" fontWeight="bold">试听</Text>
                        </Box>
                    </TouchableOpacity>
                </Box>

                {/* Voice Selection */}
                <Text variant="title" marginBottom="m">选择语音 ({voices.length})</Text>

                {loadingVoices ? (
                    <Text variant="body" color="textSecondary">加载语音中...</Text>
                ) : (
                    <Box
                        backgroundColor="card"
                        borderRadius="m"
                        borderWidth={1}
                        borderColor="border"
                        overflow="hidden"
                    >
                        {voices.map((voice, index) => (
                            <VoiceItem
                                key={voice.identifier}
                                voice={voice}
                                isSelected={ttsVoice === voice.identifier}
                                isLast={index === voices.length - 1}
                                onSelect={() => setTtsVoice(voice.identifier)}
                                theme={theme}
                            />
                        ))}
                    </Box>
                )}
            </ScrollView>
        </ScreenLayout>
    );
};

// Separated component to cleaner handle styles
const VoiceItem = ({ voice, isSelected, isLast, onSelect, theme }: any) => {
    const rowStyle = useMemo(() => ({
        backgroundColor: isSelected ? theme.colors.primary + '1A' : undefined
    }), [isSelected, theme.colors.primary]);

    return (
        <TouchableOpacity onPress={onSelect}>
            <Box
                padding="m"
                borderBottomWidth={isLast ? 0 : 1}
                borderBottomColor="border"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                style={rowStyle}
            >
                <Box>
                    <Text variant="body" fontWeight={isSelected ? 'bold' : 'normal'} color={isSelected ? 'primary' : 'textPrimary'}>
                        {voice.name}
                    </Text>
                    <Text variant="caption" color={isSelected ? 'primary' : 'textSecondary'}>
                        {voice.language}
                    </Text>
                </Box>
                {isSelected && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
            </Box>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: 24
    },
    slider: {
        width: '100%',
        height: 40
    }
});

export default TTSSettingsScreen;
