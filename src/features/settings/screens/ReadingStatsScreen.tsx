import React, { useEffect, useState } from 'react';
import { ScrollView, RefreshControl, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import ScreenLayout from '../../../components/ScreenLayout';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { ReadingSessionRepository } from '../../../services/database/ReadingSessionRepository';
import { BookRepository } from '../../../services/database/BookRepository';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, SlideInUp, useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { Svg, Rect, Text as SvgText } from 'react-native-svg';
import clsx from 'clsx';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const CHART_HEIGHT = 180;
const BAR_WIDTH = 24;

const ReadingStatsScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [booksRead, setBooksRead] = useState(0);
    const [dailyStats, setDailyStats] = useState<{ date: string; seconds: number }[]>([]);

    // Animation trigger
    const animationProgress = useSharedValue(0);

    const loadStats = async () => {
        setLoading(true);
        animationProgress.value = 0; // Reset animation
        try {
            const total = await ReadingSessionRepository.getTotalReadingTime();
            const daily = await ReadingSessionRepository.getDailyReadingStats(7);
            const books = await BookRepository.getAll();
            const finished = books.filter(b => b.progress >= 99 || b.currentChapterIndex === b.totalChapters - 1).length;

            setTotalSeconds(total);
            setDailyStats(daily);
            setBooksRead(finished);

            // Trigger animation after data load
            setTimeout(() => {
                animationProgress.value = withTiming(1, { duration: 800 });
            }, 100);
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

    const BarItem = ({ index, value, max, label }: { index: number, value: number, max: number, label: string }) => {
        const height = (value / max) * (CHART_HEIGHT - 30);

        const animatedProps = useAnimatedProps(() => ({
            height: height * animationProgress.value,
            y: (CHART_HEIGHT - 20) - (height * animationProgress.value)
        }));

        return (
            <React.Fragment>
                {/* Background Track */}
                <Rect
                    x={index * 45 + 10}
                    y={10}
                    width={BAR_WIDTH}
                    height={CHART_HEIGHT - 30}
                    fill={theme.colors.border}
                    rx={4}
                    opacity={0.3}
                />
                {/* Animated Bar */}
                <AnimatedRect
                    x={index * 45 + 10}
                    width={BAR_WIDTH}
                    fill={theme.colors.primary}
                    rx={4}
                    animatedProps={animatedProps}
                />
                {/* Label */}
                <SvgText
                    x={index * 45 + 10 + BAR_WIDTH / 2}
                    y={CHART_HEIGHT}
                    fontSize="10"
                    fill={theme.colors.textSecondary}
                    textAnchor="middle"
                >
                    {label}
                </SvgText>
            </React.Fragment>
        );
    };

    return (
        <ScreenLayout>
            <View className="flex-row items-center px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text className="text-xl font-bold ml-2 text-gray-900 dark:text-gray-100">阅读统计</Text>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} />}
            >
                {/* Summary Cards */}
                <View className="flex-row gap-4 mb-6">
                    <Animated.View
                        entering={FadeIn.delay(100)}
                        className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 items-center"
                    >
                        <View className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full items-center justify-center mb-2">
                            <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{formatDuration(totalSeconds)}</Text>
                        <Text className="text-xs text-gray-400">总阅读时长</Text>
                    </Animated.View>

                    <Animated.View
                        entering={FadeIn.delay(200)}
                        className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 items-center"
                    >
                        <View className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full items-center justify-center mb-2">
                            <Ionicons name="book-outline" size={24} color={theme.colors.primary} />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{booksRead}</Text>
                        <Text className="text-xs text-gray-400">读完书籍</Text>
                    </Animated.View>
                </View>

                {/* Daily Chart */}
                <Animated.View entering={SlideInUp.delay(300).springify()}>
                    <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">最近7天阅读时长</Text>
                    <View className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 items-center overflow-hidden">
                        <Svg height={CHART_HEIGHT} width={320}>
                            {dailyStats.map((stat, index) => {
                                const max = Math.max(...dailyStats.map(s => s.seconds), 3600); // Scale to at least 1 hour if low
                                return (
                                    <BarItem
                                        key={index}
                                        index={index}
                                        value={stat.seconds}
                                        max={max}
                                        label={stat.date.slice(5)}
                                    />
                                );
                            })}
                        </Svg>
                    </View>
                </Animated.View>

                {dailyStats.length === 0 && !loading && (
                    <Text className="text-center text-gray-400 mt-8">暂无阅读数据，快去阅读吧！</Text>
                )}
            </ScrollView>
        </ScreenLayout>
    );
};

export default ReadingStatsScreen;
