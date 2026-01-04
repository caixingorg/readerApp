import React, { useEffect, useState } from 'react';
import { ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import ScreenLayout from '../../../components/ScreenLayout';
import { Theme } from '../../../theme/theme';
import { ReadingSessionRepository } from '../../../services/database/ReadingSessionRepository';
import { BookRepository } from '../../../services/database/BookRepository';

import { useNavigation } from '@react-navigation/native';

const ReadingStatsScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [booksRead, setBooksRead] = useState(0);
    const [dailyStats, setDailyStats] = useState<{ date: string; seconds: number }[]>([]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const total = await ReadingSessionRepository.getTotalReadingTime();
            const daily = await ReadingSessionRepository.getDailyReadingStats(7);
            const books = await BookRepository.getAll();
            const finished = books.filter(b => b.progress >= 99 || b.currentChapterIndex === b.totalChapters - 1).length; // Rough estimate of finished

            setTotalSeconds(total);
            setDailyStats(daily);
            setBooksRead(finished);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <ScreenLayout>
            <Box flexDirection="row" alignItems="center" paddingHorizontal="m" paddingVertical="s">
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text variant="header" marginLeft="m" style={{ fontSize: 20 }}>阅读统计</Text>
            </Box>

            <ScrollView
                contentContainerStyle={{ padding: theme.spacing.m }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} />}
            >
                {/* Summary Cards */}
                <Box flexDirection="row" gap="m" marginBottom="l">
                    <Box flex={1} backgroundColor="card" padding="m" borderRadius="m" elevation={2} alignItems="center">
                        <Ionicons name="time-outline" size={32} color={theme.colors.primary} />
                        <Text variant="header" marginTop="s">{formatDuration(totalSeconds)}</Text>
                        <Text variant="caption" color="textSecondary">总阅读时长</Text>
                    </Box>
                    <Box flex={1} backgroundColor="card" padding="m" borderRadius="m" elevation={2} alignItems="center">
                        <Ionicons name="book-outline" size={32} color={theme.colors.primaryDark} />
                        <Text variant="header" marginTop="s">{booksRead}</Text>
                        <Text variant="caption" color="textSecondary">读完书籍</Text>
                    </Box>
                </Box>

                {/* Daily Chart (Simple Bar) */}
                <Text variant="title" marginBottom="m">最近7天阅读时长</Text>
                <Box backgroundColor="card" padding="m" borderRadius="m" elevation={2}>
                    <Box height={150} flexDirection="row" alignItems="flex-end" justifyContent="space-between">
                        {dailyStats.map((stat, index) => {
                            const max = Math.max(...dailyStats.map(s => s.seconds), 60); // Min 1 min scale
                            const height = (stat.seconds / max) * 100;
                            const label = stat.date.slice(5); // MM-DD
                            return (
                                <Box key={index} alignItems="center" flex={1}>
                                    <Box
                                        width={20}
                                        height={`${Math.max(height, 5)}%`}
                                        backgroundColor={stat.seconds > 0 ? "primary" : "border"}
                                        borderRadius="s"
                                    />
                                    <Text variant="small" marginTop="xs" style={{ fontSize: 10 }}>{label}</Text>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </ScrollView>
        </ScreenLayout>
    );
};

export default ReadingStatsScreen;
