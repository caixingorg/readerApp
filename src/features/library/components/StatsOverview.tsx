import React from 'react';
import { ScrollView } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { MaterialIcons } from '@expo/vector-icons';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';

interface StatsOverviewProps {
    stats?: {
        readingTime: string;
        booksRead: number;
        streak: number;
    };
}

const StatsOverview: React.FC<StatsOverviewProps> = ({
    stats = { readingTime: '0h', booksRead: 0, streak: 0 }
}) => {
    const theme = useTheme<Theme>();

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.s }}
        >
            {/* Reading Time Card */}
            <Box
                width={140}
                height={80}
                backgroundColor="card"
                borderRadius="m"
                padding="m"
                marginRight="s"
                justifyContent="space-between"
                borderLeftWidth={4}
                borderLeftColor="primary"
                shadowColor="black"
                shadowOpacity={0.12}
                shadowRadius={3}
                shadowOffset={{ width: 0, height: 1 }}
                elevation={3}
            >
                <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
                    <MaterialIcons name="schedule" size={24} color={theme.colors.primary} />
                    <Text variant="small" color="textSecondary" fontWeight="500">Reading</Text>
                </Box>
                <Text fontSize={20} fontWeight="700" lineHeight={24} color="text">{stats.readingTime}</Text>
            </Box>

            {/* Read Books Card */}
            <Box
                width={140}
                height={80}
                backgroundColor="card"
                borderRadius="m"
                padding="m"
                marginRight="s"
                justifyContent="space-between"
                borderLeftWidth={4}
                borderLeftColor="success"
                shadowColor="black"
                shadowOpacity={0.12}
                shadowRadius={3}
                shadowOffset={{ width: 0, height: 1 }}
                elevation={3}
            >
                <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
                    <MaterialIcons name="menu-book" size={24} color={theme.colors.success} />
                    <Text variant="small" color="textSecondary" fontWeight="500">Read</Text>
                </Box>
                <Text fontSize={20} fontWeight="700" lineHeight={24} color="text">{stats.booksRead}</Text>
            </Box>

            {/* Streak Card */}
            <Box
                width={140}
                height={80}
                backgroundColor="card"
                borderRadius="m"
                padding="m"
                justifyContent="space-between"
                borderLeftWidth={4}
                borderLeftColor="warning"
                shadowColor="black"
                shadowOpacity={0.12}
                shadowRadius={3}
                shadowOffset={{ width: 0, height: 1 }}
                elevation={3}
            >
                <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
                    <MaterialIcons name="local-fire-department" size={24} color={theme.colors.warning} />
                    <Text variant="small" color="textSecondary" fontWeight="500">Streak</Text>
                </Box>
                <Text fontSize={20} fontWeight="700" lineHeight={24} color="text">{stats.streak} Days</Text>
            </Box>
        </ScrollView>
    );
};

export default StatsOverview;
