import React, { useMemo, useEffect, useState } from 'react';
import { Image, StyleSheet, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import Text from '@/components/Text';
import Box from '@/components/Box';
import { getSafePath } from '@/utils/PathUtils';

interface BookCoverProps {
    cover?: string | null;
    title: string;
    width?: number | string;
    height?: number | string;
    style?: any;
    borderRadius?: keyof Theme['borderRadii'];
    children?: React.ReactNode;
}

const LIGHT_GRADIENTS = [
    ['#FAFAF9', '#E7E5E4'],
    ['#FEF3C7', '#FDE68A'],
    ['#F5F5F4', '#D6D3D1'],
    ['#ECFCCB', '#BEF264'],
    ['#FFEDD5', '#FDBA74'],
    ['#E0E7FF', '#C7D2FE'],
];

const DARK_GRADIENTS = [
    ['#44403C', '#57534E'],
    ['#78350F', '#92400E'],
    ['#3F2C22', '#5D4037'],
    ['#14532D', '#166534'],
    ['#7C2D12', '#9A3412'],
    ['#312E81', '#4338CA'],
];

const getGradient = (title: string, isDark: boolean) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradients = isDark ? DARK_GRADIENTS : LIGHT_GRADIENTS;
    const index = Math.abs(hash) % gradients.length;
    return gradients[index] as [string, string, ...string[]];
};

const BookCover: React.FC<BookCoverProps> = ({
    cover,
    title,
    width = '100%',
    height = '100%',
    style,
    borderRadius = 'm',
    children,
}) => {
    const theme = useTheme<Theme>();
    const safeCover = getSafePath(cover);
    const [imageError, setImageError] = useState(false);

    const isDark = ['#020617', '#0F172A', '#0C0A09', '#1C1917', '#292524'].includes(
        theme.colors.mainBackground,
    );

    useEffect(() => {
        setImageError(false);
    }, [safeCover]);

    const colors = useMemo(() => getGradient(title, isDark), [title, isDark]);

    const iconColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
    const iconSize = typeof width === 'number' ? width * 0.4 : 32;

    const textStyle = useMemo(
        () => ({
            fontSize: typeof width === 'number' ? Math.max(10, width * 0.12) : 12,
            textShadowColor: isDark ? 'rgba(0,0,0,0.5)' : 'transparent',
        }),
        [width, isDark],
    );

    return (
        <Box
            width={width as any}
            height={height as any}
            borderRadius={borderRadius as any}
            backgroundColor="cardSecondary"
            overflow="hidden"
            style={style}
        >
            <LinearGradient
                colors={colors}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name="book" size={iconSize} color={iconColor} style={styles.bgIcon} />

                <Text
                    variant="body"
                    color="textPrimary"
                    fontWeight="700"
                    textAlign="center"
                    numberOfLines={3}
                    style={[styles.titleText, textStyle]}
                >
                    {title}
                </Text>
            </LinearGradient>

            {safeCover && !imageError && (
                <Image
                    source={{ uri: safeCover }}
                    style={styles.coverImage}
                    resizeMode="cover"
                    onError={() => {
                        console.log('[BookCover] Failed to load image:', safeCover);
                        setImageError(true);
                    }}
                />
            )}

            {children}
        </Box>
    );
};

const styles = StyleSheet.create({
    gradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    bgIcon: {
        position: 'absolute',
        bottom: -10,
        right: -10,
        transform: [{ rotate: '-15deg' }],
    },
    titleText: {
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    coverImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
});

export default BookCover;
