import React, { useState, useRef, useCallback } from 'react';
import { ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';
import ScreenLayout from '@/components/ScreenLayout';
import DailyActivityChart from '../components/DailyActivityChart';
import StatsShareCard from '@/features/share/components/StatsShareCard';
import SharePreviewModal from '@/features/share/components/SharePreviewModal';

import { ReadingSessionRepository } from '@/services/database/ReadingSessionRepository';
import { BookRepository } from '@/services/database/BookRepository';

const GOAL_SECONDS = 30 * 60; // 30 minutes

const ReadingStatsScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const viewShotRef = useRef<ViewShot>(null);

    const [loading, setLoading] = useState(false);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [streak, setStreak] = useState(0);
    const [booksRead, setBooksRead] = useState(0);
    const [dailyStats, setDailyStats] = useState<{ date: string; seconds: number }[]>([]);

    // Share Preview State
    const [previewUri, setPreviewUri] = useState<string | null>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Total Time
            const total = await ReadingSessionRepository.getTotalReadingTime();
            setTotalSeconds(total);

            // 2. Daily Stats (Last 7 days)
            const stats = await ReadingSessionRepository.getDailyReadingStats(7);
            setDailyStats(stats);

            // 3. Books Read
            const books = await BookRepository.getAll();
            const readCount = books.filter(
                (b) =>
                    b.progress >= 100 ||
                    (b.totalChapters > 0 && b.currentChapterIndex >= b.totalChapters - 1),
            ).length;
            setBooksRead(readCount);

            // 4. Streak Calculation (Simple implementation)
            // Ideally we get more history. Let's ask for 30 days to calculate streak.
            const history = await ReadingSessionRepository.getDailyReadingStats(30);
            let currentStreak = 0;
            const today = new Date().toISOString().split('T')[0];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            // Check today
            const todayStat = history.find((h) => h.date === today);
            if (todayStat && todayStat.seconds > 0) {
                currentStreak++;
            }

            // Check backwards from yesterday
            for (let i = 1; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const stat = history.find((h) => h.date === dateStr);
                if (stat && stat.seconds > 0) {
                    currentStreak++;
                } else {
                    // Break unless we haven't started counting (if today was 0)
                    // But here we are just counting consecutive days.
                    // If today is 0, we check yesterday. If yesterday is 0, streak is 0.
                    // If today is >0, streak is 1 + ...
                    if (currentStreak === 0 && i === 1) {
                        // Today 0, yesterday 0 -> streak 0.
                        break;
                    }
                    if (currentStreak > 0 && (!stat || stat.seconds === 0)) {
                        break;
                    }
                }
            }
            setStreak(currentStreak);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData]),
    );

    const handleShare = async () => {
        try {
            if (viewShotRef.current?.capture) {
                const uri = await viewShotRef.current.capture();
                setPreviewUri(uri);
                setIsPreviewVisible(true);
            }
        } catch (e) {
            console.error('Share capture failed', e);
        }
    };

    const handleConfirmShare = async () => {
        if (!previewUri) return;
        try {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(previewUri, {
                    mimeType: 'image/png',
                    dialogTitle: t('stats.share_title') || 'Share your reading progress',
                    UTI: 'public.png',
                });
            }
        } catch (error) {
            console.error('Sharing failed', error);
        } finally {
            setIsPreviewVisible(false);
        }
    };

    const handleClosePreview = () => {
        setIsPreviewVisible(false);
        setPreviewUri(null);
    };

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const shareButtonStyle = {
        padding: theme.spacing.s,
        backgroundColor: theme.colors.cardPrimary,
        borderRadius: theme.borderRadii.m,
    };

    return (
        <ScreenLayout>
            {/* Hidden ViewShot Container - Rendered off-screen but measurable */}
            <Box position="absolute" left={-1000} top={0} opacity={0}>
                <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
                    <StatsShareCard
                        totalTime={totalSeconds}
                        streak={streak}
                        booksRead={booksRead}
                        wordsPerMin={320} // Mock or TODO
                    />
                </ViewShot>
            </Box>

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
                        {t('stats.title') || 'Statistics'}
                    </Text>
                </Box>

                {/* Share Action */}
                <TouchableOpacity style={shareButtonStyle} onPress={handleShare}>
                    <Ionicons
                        name="share-social-outline"
                        size={22}
                        color={theme.colors.textPrimary}
                    />
                </TouchableOpacity>
            </Box>

            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: theme.spacing.m,
                    paddingBottom: theme.spacing.xxl * 2,
                }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
            >
                {/* HERO: Total Time */}
                <Box marginTop="l" marginBottom="xl" alignItems="center">
                    <Text
                        variant="body"
                        color="textSecondary"
                        textTransform="uppercase"
                        letterSpacing={1.5}
                        marginBottom="s"
                    >
                        {t('stats.total_time') || 'Total Reading Time'}
                    </Text>
                    <Box flexDirection="row" alignItems="baseline">
                        <Text variant="header" fontSize={56} lineHeight={64} fontWeight="700">
                            {hours}
                        </Text>
                        <Text
                            variant="body"
                            fontSize={24}
                            color="textSecondary"
                            marginLeft="xs"
                            marginRight="m"
                        >
                            {t('stats.units.h') || 'h'}
                        </Text>
                        <Text variant="header" fontSize={56} lineHeight={64} fontWeight="700">
                            {minutes}
                        </Text>
                        <Text variant="body" fontSize={24} color="textSecondary" marginLeft="xs">
                            {t('stats.units.m') || 'm'}
                        </Text>
                    </Box>
                </Box>

                {/* Daily Activity Chart */}
                <Box marginBottom="xl">
                    <DailyActivityChart
                        data={dailyStats}
                        streak={streak}
                        goalSeconds={GOAL_SECONDS}
                    />
                </Box>

                {/* Overview Cards */}
                <Box>
                    <Text
                        variant="caption"
                        fontWeight="bold"
                        color="textSecondary"
                        letterSpacing={1}
                        marginBottom="m"
                        textTransform="uppercase"
                    >
                        {t('stats.overview') || 'Overview'}
                    </Text>
                    <Box flexDirection="row" gap="m">
                        {/* Books Completed */}
                        <Box flex={1} backgroundColor="cardSecondary" padding="l" borderRadius="l">
                            <Box
                                flexDirection="row"
                                justifyContent="space-between"
                                alignItems="center"
                                marginBottom="s"
                            >
                                <Ionicons
                                    name="book-outline"
                                    size={20}
                                    color={theme.colors.textPrimary}
                                />
                            </Box>
                            <Text variant="header" fontSize={32} fontWeight="600" marginBottom="xs">
                                {booksRead}
                            </Text>
                            <Text variant="caption" color="textSecondary">
                                {t('stats.books_read') || 'Books Read'}
                            </Text>
                        </Box>

                        {/* Avg Speed */}
                        <Box flex={1} backgroundColor="cardSecondary" padding="l" borderRadius="l">
                            <Box
                                flexDirection="row"
                                justifyContent="space-between"
                                alignItems="center"
                                marginBottom="s"
                            >
                                <Ionicons
                                    name="speedometer-outline"
                                    size={20}
                                    color={theme.colors.textPrimary}
                                />
                            </Box>
                            <Text variant="header" fontSize={32} fontWeight="600" marginBottom="xs">
                                320
                            </Text>
                            <Text variant="caption" color="textSecondary">
                                {t('stats.words_per_min') || 'WPM'}
                            </Text>
                        </Box>
                    </Box>
                </Box>
            </ScrollView>

            <SharePreviewModal
                visible={isPreviewVisible}
                imageUri={previewUri}
                onClose={handleClosePreview}
                onShare={handleConfirmShare}
            />
        </ScreenLayout>
    );
};

export default ReadingStatsScreen;
