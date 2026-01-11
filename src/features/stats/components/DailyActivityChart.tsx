import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';

interface DailyActivityChartProps {
    data: { date: string; seconds: number }[];
    streak: number;
    goalSeconds: number;
}

const CHART_HEIGHT = 120;

const DailyActivityChart: React.FC<DailyActivityChartProps> = ({ data, streak, goalSeconds }) => {
    const theme = useTheme<Theme>();
    const { t, i18n } = useTranslation();

    // Find max seconds to normalize height (min 1 hour for scale)
    const maxSeconds = Math.max(goalSeconds, ...data.map(d => d.seconds));

    // Get today's progress
    const today = new Date().toISOString().split('T')[0];
    const todayStats = data.find(d => d.date === today)?.seconds || 0;

    return (
        <Box marginTop="l">
            {/* Header / Streak */}
            <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="l">
                <Text variant="caption" fontWeight="bold" color="textSecondary" letterSpacing={1}>{t('stats.daily_activity')}</Text>
                <Box flexDirection="row" alignItems="center" backgroundColor="cardSecondary" paddingHorizontal="s" paddingVertical="xs" borderRadius="m">
                    <Text color="primary" fontWeight="bold" fontSize={12}>{streak} {t('stats.streak')}</Text>
                    <Text fontSize={12}> 🔥</Text>
                </Box>
            </Box>

            {/* Chart Area */}
            {/* Removed shadow card wrapper for flat design */}
            <Box>
                {/* Chart Bars */}
                <Box flexDirection="row" justifyContent="space-between" alignItems="flex-end" height={CHART_HEIGHT} marginBottom="m">
                    {data.map((day, index) => {
                        // Use pixel height calculation to avoid overflow issues
                        // Ensure layout never breaks: clamp between min visible (4px) and max height
                        const rawHeight = (day.seconds / maxSeconds) * CHART_HEIGHT;
                        const barHeight = Math.max(4, Math.min(rawHeight, CHART_HEIGHT));

                        const isToday = day.date === today;
                        // Localize day label
                        const dayLabel = new Date(day.date).toLocaleDateString(i18n.language, { weekday: 'narrow' });

                        // Minimalist coloring
                        const barColor = day.seconds > 0
                            ? (isToday ? theme.colors.primary : theme.colors.textTertiary)
                            : theme.colors.cardSecondary;

                        return (
                            <Box key={day.date} alignItems="center" flex={1}>
                                {/* Bar */}
                                <Box
                                    width={6} // Thinner, more elegant
                                    height={barHeight}
                                    borderRadius="full"
                                    backgroundColor="transparent"
                                    style={{ backgroundColor: barColor }}
                                />
                                {/* Label */}
                                <Text variant="caption" color={isToday ? "primary" : "textTertiary"} marginTop="s" fontSize={10}>
                                    {dayLabel}
                                </Text>
                            </Box>
                        );
                    })}
                </Box>

                {/* Today's Goal text (Optional: Remove if cluttered, but user had it) */}
                <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                    <Text variant="caption" color="textSecondary">{t('stats.daily_goal')}</Text>
                    <Text variant="caption" fontWeight="bold" color="textPrimary">
                        {Math.round(todayStats / 60)} / {Math.round(goalSeconds / 60)} {t('stats.units.min')}
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};

export default DailyActivityChart;
