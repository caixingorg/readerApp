import React, { useCallback, useState } from 'react';
import { ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import ScreenLayout from '../../../components/ScreenLayout';
import CircularProgress from '../components/CircularProgress';
import DailyActivityChart from '../components/DailyActivityChart';
import { ReadingSessionRepository } from '../../../services/database/ReadingSessionRepository';
import { BookRepository } from '../../../services/database/BookRepository';
import { calculateStreak, formatDuration } from '../utils/statsUtils';

// Mock Goal
const GOAL_SECONDS = 60 * 60; // 1 hour

const ReadingStatsScreen: React.FC = () => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();
    const [loading, setLoading] = useState(true);
    const [totalTime, setTotalTime] = useState(0);
    const [dailyStats, setDailyStats] = useState<{ date: string; seconds: number }[]>([]);
    const [streak, setStreak] = useState(0);
    const [booksRead, setBooksRead] = useState(0);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [total, stats, allBooks] = await Promise.all([
                ReadingSessionRepository.getTotalReadingTime(),
                ReadingSessionRepository.getDailyReadingStats(7),
                BookRepository.getAll(),
            ]);

            setTotalTime(total);
            setDailyStats(stats);
            setStreak(calculateStreak(stats));

            // Count completed books (progress >= 100)
            const completed = allBooks.filter(b => b.progress >= 100).length;
            setBooksRead(completed);

        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const { hours, minutes } = formatDuration(totalTime);

    return (
        <ScreenLayout>
            {/* Pro Max Header */}
            <Box
                paddingHorizontal="m"
                paddingTop="l"
                paddingBottom="m"
                backgroundColor="mainBackground"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="flex-end"
            >
                {/* Title Block */}
                <Box>
                    <Text
                        variant="header"
                        fontSize={34}
                        lineHeight={40}
                        fontWeight="800"
                        color="textPrimary"
                    >
                        {t('stats.title')}
                    </Text>
                    {/* <Text
                        variant="body"
                        color="textSecondary"
                        letterSpacing={1.5}
                        textTransform="uppercase"
                        fontSize={12}
                        fontWeight="600"
                        marginTop="xs"
                    >
                        {t('stats.subtitle') || 'INSIGHTS'}
                    </Text> */}
                </Box>

                {/* Share Action */}
                <TouchableOpacity
                    style={{
                        padding: 8,
                        marginBottom: 4,
                        backgroundColor: theme.colors.cardSecondary,
                        borderRadius: 20,
                    }}
                >
                    <Ionicons name="share-social-outline" size={22} color={theme.colors.textPrimary} />
                </TouchableOpacity>
            </Box>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
            >
                {/* HERO: Total Time */}
                {/* "Editorial" typography style - big number, minimal label */}
                <Box marginTop="l" marginBottom="xl" alignItems="center">
                    <Text variant="body" color="textSecondary" textTransform="uppercase" letterSpacing={1.5} marginBottom="s">
                        {t('stats.total_time')}
                    </Text>
                    <Box flexDirection="row" alignItems="baseline">
                        <Text variant="header" fontSize={56} lineHeight={64} fontWeight="700">
                            {hours}
                        </Text>
                        <Text variant="body" fontSize={24} color="textSecondary" marginLeft="xs" marginRight="m">
                            {t('stats.units.h')}
                        </Text>
                        <Text variant="header" fontSize={56} lineHeight={64} fontWeight="700">
                            {minutes}
                        </Text>
                        <Text variant="body" fontSize={24} color="textSecondary" marginLeft="xs">
                            {t('stats.units.m')}
                        </Text>
                    </Box>
                </Box>

                {/* Daily Activity Chart */}
                {/* Remove card background, just show the chart in the open or minimal container */}
                <Box marginBottom="xl">
                    <DailyActivityChart
                        data={dailyStats}
                        streak={streak}
                        goalSeconds={GOAL_SECONDS}
                    />
                </Box>

                {/* Motivation Text - Style as a "Quote" or Insight */}
                <Box marginBottom="xl" paddingHorizontal="m" borderLeftWidth={2} borderColor="primary">
                    <Text variant="body" fontStyle="italic" color="textPrimary">
                        <Text>{t('stats.quote').split('<bold>')[0]}</Text>
                        <Text fontWeight="bold">{t('stats.quote').split('<bold>')[1].split('</bold>')[0]}</Text>
                        <Text>{t('stats.quote').split('</bold>')[1]}</Text>
                        {/* Note: In a real app reduce split complexity or use Trans component */}
                    </Text>
                </Box>

                {/* Overview Cards - Flat Grid */}
                <Box>
                    <Text variant="caption" fontWeight="bold" color="textSecondary" letterSpacing={1} marginBottom="m" textTransform="uppercase">
                        {t('stats.overview')}
                    </Text>
                    <Box flexDirection="row" gap="m">
                        {/* Books Completed */}
                        <Box
                            flex={1}
                            backgroundColor="cardSecondary" // Flat style
                            padding="l"
                            borderRadius="l"
                        // No shadows
                        >
                            <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="s">
                                <Ionicons name="book-outline" size={20} color={theme.colors.textPrimary} />
                            </Box>
                            <Text variant="header" fontSize={32} fontWeight="600" marginBottom="xs">{booksRead}</Text>
                            <Text variant="caption" color="textSecondary">{t('stats.books_read')}</Text>
                        </Box>

                        {/* Avg Speed */}
                        <Box
                            flex={1}
                            backgroundColor="cardSecondary" // Flat style
                            padding="l"
                            borderRadius="l"
                        >
                            <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="s">
                                <Ionicons name="speedometer-outline" size={20} color={theme.colors.textPrimary} />
                            </Box>
                            <Text variant="header" fontSize={32} fontWeight="600" marginBottom="xs">320</Text>
                            <Text variant="caption" color="textSecondary">{t('stats.words_per_min')}</Text>
                        </Box>
                    </Box>

                    {/* Additional Row Example: Highlights/Notes */}
                    <Box marginTop="m">
                        <Box
                            width="100%"
                            backgroundColor="cardSecondary"
                            padding="l"
                            borderRadius="l"
                            flexDirection="row"
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            <Box>
                                <Text variant="header" fontSize={32} fontWeight="600" marginBottom="xs">12</Text>
                                <Text variant="caption" color="textSecondary">{t('stats.highlights')}</Text>
                            </Box>
                            <Ionicons name="pencil-outline" size={24} color={theme.colors.textSecondary} />
                        </Box>
                    </Box>
                </Box>
            </ScrollView>
        </ScreenLayout>
    );
};

export default ReadingStatsScreen;
