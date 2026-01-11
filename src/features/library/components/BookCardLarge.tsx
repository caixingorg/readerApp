import React from 'react';
import { Image, Dimensions, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';
import { Book } from '@/services/database';
import { getSafePath } from '@/utils/PathUtils';

interface BookCardLargeProps {
    book: Book;
    width?: number;
    height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_WIDTH = SCREEN_WIDTH * 0.75;

const BookCardLarge: React.FC<BookCardLargeProps> = ({
    book,
    width = DEFAULT_WIDTH,
    height = DEFAULT_WIDTH * 1.5,
}) => {
    const theme = useTheme<Theme>();
    const safeCover = getSafePath(book.cover);
    const year = new Date(book.createdAt || Date.now()).getFullYear();

    return (
        <Box
            width={width}
            height={height}
            borderRadius="l"
            backgroundColor="cardPrimary"
            overflow="hidden"
            position="relative"
            shadowColor="black"
            shadowOpacity={0.3}
            shadowRadius={10}
            elevation={8}
            borderWidth={1}
            borderColor="border"
        >
            {/* Background / Cover */}
            <Box flex={1} backgroundColor="gray900">
                {safeCover ? (
                    <Image
                        source={{ uri: safeCover }}
                        style={styles.coverImage}
                        resizeMode="cover"
                    />
                ) : (
                    <Box
                        flex={1}
                        justifyContent="center"
                        alignItems="center"
                        style={styles.placeholderIcon}
                    >
                        <Ionicons name="book" size={80} color={theme.colors.white} />
                    </Box>
                )}
                {/* Dark Overlay for Text Readability */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={StyleSheet.absoluteFill}
                />
            </Box>

            {/* Content Overlay */}
            <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                padding="l"
                justifyContent="space-between"
            >
                {/* Top Row */}
                <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
                    <Ionicons
                        name="book-outline"
                        size={24}
                        color={theme.colors.white}
                        style={styles.topIcon}
                    />
                    <Text variant="body" color="white" style={styles.yearText}>
                        {year}
                    </Text>
                </Box>

                {/* Bottom Row */}
                <Box>
                    <Text
                        variant="header"
                        fontSize={32}
                        lineHeight={38}
                        color="white"
                        numberOfLines={3}
                        style={styles.bookTitle}
                    >
                        {book.title}
                    </Text>

                    <Box
                        height={1}
                        width={40}
                        backgroundColor="white"
                        marginVertical="m"
                        style={styles.divider}
                    />

                    <Text
                        variant="body"
                        color="white"
                        textTransform="uppercase"
                        letterSpacing={1.5}
                        style={styles.authorText}
                    >
                        {book.author}
                    </Text>

                    {/* Progress Line */}
                    {book.progress > 0 && (
                        <Box
                            height={4}
                            backgroundColor="white"
                            borderRadius="full"
                            marginTop="l"
                            style={styles.progressTrack}
                            overflow="hidden"
                        >
                            <Box
                                width={`${Math.min(book.progress, 100)}%`}
                                height="100%"
                                backgroundColor="white"
                            />
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

const styles = StyleSheet.create({
    coverImage: {
        width: '100%',
        height: '100%',
        opacity: 0.6,
    },
    placeholderIcon: {
        opacity: 0.3,
    },
    topIcon: {
        opacity: 0.8,
    },
    yearText: {
        opacity: 0.6,
    },
    bookTitle: {
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 4,
    },
    divider: {
        opacity: 0.5,
    },
    authorText: {
        opacity: 0.8,
    },
    progressTrack: {
        opacity: 0.3,
    },
});

export default BookCardLarge;
