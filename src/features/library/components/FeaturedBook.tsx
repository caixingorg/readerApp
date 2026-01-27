import React, { useMemo } from 'react';
import { TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';
import { Book } from '@/services/database';
import { useTranslation } from 'react-i18next';
import BookCover from './BookCover';



const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

interface FeaturedBookProps {
    book: Book;
    onPress: () => void;
}

const FeaturedBook: React.FC<FeaturedBookProps> = ({ book, onPress }) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const progress = Math.round(book.progress || 0);

    const isDark = ['#020617', '#0F172A', '#0C0A09', '#1C1917', '#292524'].includes(
        theme.colors.mainBackground,
    );

    const overlayColor = isDark ? 'rgba(2, 6, 23, 0.6)' : 'rgba(255, 255, 255, 0)';
    const borderColor = isDark ? 'rgba(255,255,255,0.15)' : theme.colors.cardPrimary;
    const borderWidth = isDark ? 1 : 4;

    const containerStyle = useMemo(
        () => [
            styles.container,
            {
                borderColor: borderColor,
                borderWidth: borderWidth,
                shadowColor: theme.colors.black,
            },
        ],
        [borderColor, borderWidth, theme.colors.black],
    );

    const floatingCoverStyle = useMemo(
        () => [
            {
                width: CARD_WIDTH * 0.5,
                height: CARD_HEIGHT * 0.6,
            },
            styles.floatingCover,
        ],
        [],
    );

    const gradientColors = useMemo(
        () =>
            (isDark
                ? ['transparent', 'rgba(2, 6, 23, 0.8)', 'rgba(2, 6, 23, 1)']
                : ['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']) as [
                string,
                string,
                string,
            ],
        [isDark],
    );

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
            <Box
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                borderRadius="xl"
                backgroundColor="cardPrimary"
                overflow="hidden"
                position="relative"
                style={containerStyle}
            >
                {/* 1. Gradient Background Layer - Matches Geometric Cover Style */}
                <LinearGradient
                    colors={isDark ? ['#2C2825', '#3D3834'] : ['#E8E5E1', '#D4CFC7']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                {/* 2. Theme Adaptation Overlay (Day/Night cycle) */}
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    style={{ backgroundColor: overlayColor }}
                />

                {/* 3. Book Cover Content - Floating */}
                <Box flex={1}>
                    <Box position="absolute" top={40} right={-20} style={floatingCoverStyle}>
                        <BookCover
                            cover={book.cover}
                            title={book.title}
                            width="100%"
                            height="100%"
                            borderRadius="m"
                        />
                    </Box>

                    {/* Gradient Overlay for Text Readability */}
                    <LinearGradient
                        colors={gradientColors}
                        locations={[0, 0.6, 1]}
                        style={StyleSheet.absoluteFill}
                    />
                </Box>

                {/* Content Overlay */}
                <Box position="absolute" bottom={0} left={0} right={0} padding="l">
                    <Text
                        variant="caption"
                        color="white"
                        opacity={0.8}
                        marginBottom="xs"
                        letterSpacing={1}
                        textTransform="uppercase"
                    >
                        {t('featured.continue')}
                    </Text>

                    <Text
                        variant="header"
                        fontSize={28}
                        lineHeight={34}
                        color="white"
                        marginBottom="xs"
                        numberOfLines={2}
                        style={styles.bookTitle}
                    >
                        {book.title}
                    </Text>

                    <Text
                        variant="subheader"
                        fontSize={16}
                        color="white"
                        opacity={0.8}
                        numberOfLines={1}
                        marginBottom="m"
                    >
                        {book.author}
                    </Text>

                    {/* Progress Indicator */}
                    <Box flexDirection="row" alignItems="center">
                        <Box
                            height={4}
                            width={100}
                            backgroundColor="white"
                            opacity={0.3}
                            borderRadius="full"
                            overflow="hidden"
                            marginRight="m"
                        >
                            <Box
                                height="100%"
                                width={`${progress}%` as any}
                                backgroundColor="white"
                                opacity={1}
                            />
                        </Box>
                        <Text variant="caption" color="white" fontWeight="bold">
                            {progress}%
                        </Text>
                    </Box>
                </Box>

                {/* Open Icon */}
                <Box
                    position="absolute"
                    bottom={32}
                    right={24}
                    width={50}
                    height={50}
                    borderRadius="full"
                    backgroundColor="white"
                    alignItems="center"
                    justifyContent="center"
                    style={styles.fabIcon}
                >
                    <Ionicons
                        name="play"
                        size={24}
                        color={theme.colors.primary}
                        style={styles.playIcon}
                    />
                </Box>
            </Box>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 12,
    },
    floatingCover: {
        transform: [{ rotate: '12deg' }],
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        shadowOffset: { width: 4, height: 4 },
        elevation: 10,
    },
    bookTitle: {
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 8,
        textShadowOffset: { width: 0, height: 2 },
        maxWidth: '70%',
    },
    fabIcon: {
        shadowColor: 'black',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    playIcon: {
        marginLeft: 2,
    },
});

export default FeaturedBook;
