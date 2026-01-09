import React from 'react';
import { View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { Book } from '../../../services/database';
// import { getSafePath } from '../../../utils/PathUtils'; // Unused
import { useTranslation } from 'react-i18next';
import BookCover from './BookCover';

// Import the asset (ensuring it's bundled)
const GHIBLI_BG = require('../../../../assets/ghibli_bg.png');

const { width } = Dimensions.get('window');
// Card width is screen width - padding (e.g. 32px horizontal padding)
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = CARD_WIDTH * 1.4; // Slightly taller than 3:4

interface FeaturedBookProps {
    book: Book;
    onPress: () => void;

}

const FeaturedBook: React.FC<FeaturedBookProps> = ({ book, onPress }) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    // const safeCover = getSafePath(book.cover); // Unused
    const progress = Math.round(book.progress || 0);

    // Dynamic Theming for "Pro Max" Look
    const isDark = [
        '#020617', '#0F172A', // Old Slate
        '#0C0A09', '#1C1917', '#292524' // New Stone/Dark Grays
    ].includes(theme.colors.mainBackground);

    // Ghibli Theme Logic
    // Light Mode: Show full vibrancy of the image
    // Dark Mode: Add a dark blue overlay to simulate "Night Mode" Ghibli scene
    const overlayColor = isDark ? 'rgba(2, 6, 23, 0.6)' : 'rgba(255, 255, 255, 0)';
    const borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'white';
    const borderWidth = isDark ? 1 : 4; // White frame in light mode (Polaroid style), thin border in dark

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
            <Box
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                borderRadius="xl"
                backgroundColor="cardPrimary"
                overflow="hidden"
                position="relative"
                style={{
                    shadowColor: theme.colors.black,
                    shadowOffset: { width: 0, height: 20 },
                    shadowOpacity: 0.25,
                    shadowRadius: 24,
                    elevation: 12,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                }}
            >
                {/* 1. Ghibli Background Layer */}
                <Image
                    source={GHIBLI_BG}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        opacity: 1
                    }}
                    resizeMode="cover"
                />

                {/* 2. Theme Adaptation Overlay (Day/Night cycle) */}
                <Box
                    position="absolute"
                    top={0} left={0} right={0} bottom={0}
                    style={{ backgroundColor: overlayColor }}
                />

                {/* 3. Book Cover Content - Floating */}
                <Box flex={1}>
                    <Box
                        position="absolute"
                        top={40}
                        right={-20}
                        width={CARD_WIDTH * 0.5}
                        height={CARD_HEIGHT * 0.6}
                        style={{
                            transform: [{ rotate: '12deg' }],
                            shadowColor: '#000',
                            shadowOpacity: 0.5,
                            shadowRadius: 10,
                            shadowOffset: { width: 4, height: 4 },
                            elevation: 10
                        }}
                    >
                        <BookCover
                            cover={book.cover}
                            title={book.title}
                            width="100%"
                            height="100%"
                            borderRadius={8}
                        />
                    </Box>

                    {/* Gradient Overlay for Text Readability */}
                    <LinearGradient
                        colors={
                            isDark
                                ? ['transparent', 'rgba(2, 6, 23, 0.8)', 'rgba(2, 6, 23, 1)'] // Dark fade
                                : ['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)'] // Light mode needs dark text bg
                        }
                        locations={[0, 0.6, 1]}
                        style={{ position: 'absolute', width: '100%', height: '100%' }}
                    />
                </Box>

                {/* Content Overlay */}
                <Box
                    position="absolute"
                    bottom={0}
                    left={0}
                    right={0}
                    padding="l"
                >
                    {/* Chapter / Progress Context */}
                    <Text variant="caption" color="white" opacity={0.8} marginBottom="xs" letterSpacing={1} textTransform="uppercase">
                        {t('featured.continue')}
                    </Text>

                    {/* Title & Author */}
                    <Text
                        variant="header"
                        fontSize={28}
                        lineHeight={34}
                        color="white"
                        marginBottom="xs"
                        numberOfLines={2}
                        style={{
                            textShadowColor: 'rgba(0,0,0,0.5)',
                            textShadowRadius: 8,
                            textShadowOffset: { width: 0, height: 2 },
                            maxWidth: '70%'
                        }}
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
                                width={`${progress}%`}
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
                    style={{ shadowColor: 'black', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }}
                >
                    <Ionicons name="play" size={24} color={theme.colors.primary} style={{ marginLeft: 2 }} />
                </Box>
            </Box>
        </TouchableOpacity>
    );
};

export default FeaturedBook;
