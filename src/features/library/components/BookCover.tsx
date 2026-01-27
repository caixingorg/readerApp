import React, { useMemo, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
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

// Muted, sophisticated color palette for geometric patterns
const PATTERN_COLORS_LIGHT = [
    ['#D4CFC7', '#E8E4DC', '#C0BAB0'],  // Warm Stone
    ['#C9C4BC', '#DDD8D0', '#B5AFA5'],  // Cream
    ['#D0CBC3', '#E4DFD7', '#BCB6AC'],  // Parchment
    ['#CCC7BF', '#E0DBD3', '#B8B2A8'],  // Ivory
    ['#C5C0B8', '#D9D4CC', '#B1ABA1'],  // Antique
    ['#CBC6BE', '#DFD9D1', '#B7B1A7'],  // Linen
];

const PATTERN_COLORS_DARK = [
    ['#4A4540', '#3D3834', '#57524C'],  // Espresso
    ['#504944', '#433D38', '#5D5650'],  // Dark Walnut
    ['#47413C', '#3A3430', '#544E48'],  // Charcoal
    ['#4D4641', '#403A35', '#5A534D'],  // Coffee
    ['#49433F', '#3C3733', '#564F4B'],  // Deep Stone
    ['#4B4541', '#3E3935', '#58514D'],  // Mocha
];

// Generate geometric pattern based on title hash
const getPatternConfig = (title: string, isDark: boolean) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = isDark ? PATTERN_COLORS_DARK : PATTERN_COLORS_LIGHT;
    const colorSet = colors[Math.abs(hash) % colors.length];

    // Pattern type: 0=horizontal stripes, 1=vertical stripes, 2=blocks, 3=asymmetric
    const patternType = Math.abs(hash >> 4) % 4;
    // Number of elements: 3-5
    const elementCount = 3 + (Math.abs(hash >> 8) % 3);

    return { colorSet, patternType, elementCount, hash };
};

// Geometric pattern component - NO white overlay
const GeometricPattern: React.FC<{
    title: string;
    isDark: boolean;
    width: number;
    height: number;
}> = ({ title, isDark, width, height }) => {
    const config = useMemo(() => getPatternConfig(title, isDark), [title, isDark]);
    const { colorSet, patternType, elementCount, hash } = config;

    const elements = useMemo(() => {
        const result: React.ReactNode[] = [];

        switch (patternType) {
            case 0: // Horizontal stripes
                for (let i = 0; i < elementCount; i++) {
                    const stripeHeight = height / elementCount;
                    const colorIndex = (hash + i) % colorSet.length;
                    result.push(
                        <View
                            key={i}
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: i * stripeHeight,
                                height: stripeHeight,
                                backgroundColor: colorSet[colorIndex],
                            }}
                        />
                    );
                }
                break;

            case 1: // Vertical stripes
                for (let i = 0; i < elementCount; i++) {
                    const stripeWidth = width / elementCount;
                    const colorIndex = (hash + i) % colorSet.length;
                    result.push(
                        <View
                            key={i}
                            style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: i * stripeWidth,
                                width: stripeWidth,
                                backgroundColor: colorSet[colorIndex],
                            }}
                        />
                    );
                }
                break;

            case 2: // Grid blocks
                const cols = 2;
                const rows = 2;
                const blockWidth = width / cols;
                const blockHeight = height / rows;

                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        const colorIndex = (hash + row + col) % colorSet.length;
                        result.push(
                            <View
                                key={`${row}-${col}`}
                                style={{
                                    position: 'absolute',
                                    left: col * blockWidth,
                                    top: row * blockHeight,
                                    width: blockWidth,
                                    height: blockHeight,
                                    backgroundColor: colorSet[colorIndex],
                                }}
                            />
                        );
                    }
                }
                break;

            case 3: // Asymmetric blocks (more interesting)
            default:
                const largeBlockRatio = 0.65;
                const isLeftHeavy = hash % 2 === 0;

                result.push(
                    <View
                        key="large"
                        style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: isLeftHeavy ? 0 : width * (1 - largeBlockRatio),
                            width: width * largeBlockRatio,
                            backgroundColor: colorSet[0],
                        }}
                    />
                );

                const smallWidth = width * (1 - largeBlockRatio);
                const smallHeight = height / 2;

                result.push(
                    <View
                        key="small1"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: isLeftHeavy ? width * largeBlockRatio : 0,
                            width: smallWidth,
                            height: smallHeight,
                            backgroundColor: colorSet[1],
                        }}
                    />
                );
                result.push(
                    <View
                        key="small2"
                        style={{
                            position: 'absolute',
                            top: smallHeight,
                            left: isLeftHeavy ? width * largeBlockRatio : 0,
                            width: smallWidth,
                            height: smallHeight,
                            backgroundColor: colorSet[2],
                        }}
                    />
                );
                break;
        }

        return result;
    }, [patternType, elementCount, colorSet, hash, width, height]);

    return <>{elements}</>;
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

    const numericWidth = typeof width === 'number' ? width : 100;
    const numericHeight = typeof height === 'number' ? height : 140;

    const textStyle = useMemo(
        () => ({
            fontSize: typeof width === 'number' ? Math.max(10, width * 0.11) : 11,
            color: isDark ? '#FAF9F7' : '#2C2825',
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
            {/* Geometric Pattern Background - Directly Visible */}
            <View style={styles.patternContainer}>
                <GeometricPattern
                    title={title}
                    isDark={isDark}
                    width={numericWidth}
                    height={numericHeight}
                />
            </View>

            {/* Title - Positioned at bottom with subtle background */}
            <View style={[styles.titleContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)' }]}>
                <Text
                    variant="body"
                    fontWeight="600"
                    textAlign="center"
                    numberOfLines={3}
                    style={[styles.titleText, textStyle]}
                >
                    {title}
                </Text>
            </View>

            {/* Actual Cover Image (if exists) */}
            {safeCover && !imageError && (
                <Image
                    source={{ uri: safeCover }}
                    style={styles.coverImage}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                />
            )}

            {children}
        </Box>
    );
};

const styles = StyleSheet.create({
    patternContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    titleContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingVertical: 8,
        paddingHorizontal: 6,
    },
    titleText: {
        letterSpacing: 0.2,
    },
    coverImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
    },
});

export default BookCover;
