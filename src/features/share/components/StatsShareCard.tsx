
import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import Text from '@/components/Text';
import Box from '@/components/Box';
import { useTranslation } from 'react-i18next';
import { formatDuration } from '@/features/stats/utils/statsUtils';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface StatsShareCardProps {
    totalTime: number;
    streak: number;
    booksRead: number;
    wordsPerMin: number;
}

const CARD_WIDTH = 375;
const CARD_HEIGHT = 500; // 3:4 aspect ratio

const StatsShareCard: React.FC<StatsShareCardProps> = ({
    totalTime,
    streak,
    booksRead,
    wordsPerMin
}) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const { hours, minutes } = formatDuration(totalTime);

    return (
        <Box
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            overflow="hidden"
            borderRadius="l"
            backgroundColor="mainBackground" // Fallback
        >
            <LinearGradient
                colors={['#292524', '#1c1917']} // Stone 800 -> Stone 900 (Premium Dark)
                style={StyleSheet.absoluteFill}
            />

            <Box flex={1} padding="xl" justifyContent="space-between">
                {/* Header: Brand & Date */}
                <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                    <Box flexDirection="row" alignItems="center">
                        <Ionicons name="book" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text variant="header" fontSize={18} color="white" fontWeight="bold">ReaderApp</Text>
                    </Box>
                    <Text variant="caption" color="textTertiary">{new Date().toLocaleDateString()}</Text>
                </Box>

                {/* Main Content: Time */}
                <Box marginTop="l">
                    <Text variant="caption" color="textTertiary" textTransform="uppercase" letterSpacing={2} marginBottom="s">
                        {t('stats.total_time')}
                    </Text>
                    <Box flexDirection="row" alignItems="baseline">
                        <Text variant="header" fontSize={80} lineHeight={80} color="white" fontWeight="900">
                            {hours}
                        </Text>
                        <Text variant="body" fontSize={24} color="textSecondary" marginLeft="xs" marginRight="m">
                            H
                        </Text>
                        <Text variant="header" fontSize={80} lineHeight={80} color="white" fontWeight="900">
                            {minutes}
                        </Text>
                        <Text variant="body" fontSize={24} color="textSecondary" marginLeft="xs">
                            M
                        </Text>
                    </Box>
                </Box>

                {/* Middle: Streak with a nice visual */}
                <Box
                    flexDirection="row"
                    alignItems="center"
                    style={styles.glassContainer}
                    padding="m"
                    borderRadius="m"
                    alignSelf="flex-start"
                >
                    <Ionicons name="flame" size={32} color="#EF4444" style={{ marginRight: 12 }} />
                    <Box>
                        <Text variant="header" fontSize={24} color="white" lineHeight={28}>
                            {streak} {t('stats.days')}
                        </Text>
                        <Text variant="caption" color="textTertiary">
                            {t('stats.streak')}
                        </Text>
                    </Box>
                </Box>

                {/* Footer Stats Grid */}
                <Box flexDirection="row" gap="m">
                    {/* Books Read */}
                    <Box flex={1} padding="m" style={styles.glassContainer} borderRadius="m">
                        <Box flexDirection="row" alignItems="center" marginBottom="s">
                            <Ionicons name="library-outline" size={18} color="#A8A29E" style={{ marginRight: 6 }} />
                            <Text variant="caption" color="textTertiary" numberOfLines={1}>
                                {t('stats.books_read')}
                            </Text>
                        </Box>
                        <Text variant="header" fontSize={28} color="white">{booksRead}</Text>
                    </Box>

                    {/* WPM */}
                    <Box flex={1} padding="m" style={styles.glassContainer} borderRadius="m">
                        <Box flexDirection="row" alignItems="center" marginBottom="s">
                            <Ionicons name="speedometer-outline" size={18} color="#A8A29E" style={{ marginRight: 6 }} />
                            <Text variant="caption" color="textTertiary" numberOfLines={1}>
                                {t('stats.words_per_min')}
                            </Text>
                        </Box>
                        <Text variant="header" fontSize={28} color="white">{wordsPerMin}</Text>
                    </Box>
                </Box>

                {/* Quote */}
                <Box marginTop="m">
                    <Text variant="caption" color="textTertiary" fontStyle="italic" textAlign="center">
                        "Read everyday, growing everyday."
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};

const styles = StyleSheet.create({
    glassContainer: {
        backgroundColor: "rgba(255,255,255,0.05)"
    }
});

export default StatsShareCard;
