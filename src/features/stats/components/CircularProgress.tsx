import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';
import Text from '../../../components/Text';

interface CircularProgressProps {
    hours: number;
    minutes: number;
    size?: number;
    strokeWidth?: number;
    progress?: number; // 0 to 1
}

const CircularProgress: React.FC<CircularProgressProps> = ({
    hours,
    minutes,
    size = 200,
    strokeWidth = 15,
    progress = 0.75 // Default visual for now
}) => {
    const theme = useTheme<Theme>();
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <Box alignItems="center" justifyContent="center">
            <View style={{ width: size, height: size, transform: [{ rotate: '-90deg' }] }}>
                <Svg width={size} height={size}>
                    {/* Background Circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={theme.colors.cardSecondary}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Progress Circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={theme.colors.primary}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </Svg>
            </View>
            <Box position="absolute" alignItems="center">
                <Box flexDirection="row" alignItems="baseline">
                    <Text variant="header" fontSize={48} fontWeight="bold">{hours}</Text>
                    <Text variant="body" fontSize={24} color="textSecondary" style={{ marginRight: 8 }}>h</Text>
                    <Text variant="header" fontSize={48} fontWeight="bold">{minutes}</Text>
                    <Text variant="body" fontSize={24} color="textSecondary">m</Text>
                </Box>
                <Text variant="caption" color="textSecondary" letterSpacing={1}>TOTAL TIME</Text>
            </Box>
        </Box>
    );
};

export default CircularProgress;
