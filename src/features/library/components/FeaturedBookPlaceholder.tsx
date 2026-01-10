import React from 'react';
import { View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { useTranslation } from 'react-i18next';

// Reuse the asset
const GHIBLI_BG = require('../../../../assets/ghibli_bg.png');

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

interface FeaturedBookPlaceholderProps {
    onPress: () => void;
}

const FeaturedBookPlaceholder: React.FC<FeaturedBookPlaceholderProps> = ({ onPress }) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    const isDark = [
        '#020617', '#0F172A',
        '#0C0A09', '#1C1917', '#292524'
    ].includes(theme.colors.mainBackground);

    // Styling logic similar to FeaturedBook but adapted for "Empty" state
    const borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'white';
    const borderWidth = isDark ? 1 : 4;
    const overlayColor = isDark ? 'rgba(2, 6, 23, 0.7)' : 'rgba(255, 255, 255, 0.1)';

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
                {/* 1. Background Layer */}
                <Image
                    source={GHIBLI_BG}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        opacity: 0.8, // Slightly dimmed to differentiate from real content
                    }}
                    resizeMode="cover"
                />

                {/* 2. Gradient Overlay */}
                <LinearGradient
                    colors={
                        isDark
                            ? ['rgba(2, 6, 23, 0.4)', 'rgba(2, 6, 23, 0.9)']
                            : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.8)']
                    }
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                />

                {/* 3. Center Content */}
                <Box flex={1} justifyContent="center" alignItems="center" padding="l">

                    {/* Icon Circle */}
                    <Box
                        width={80}
                        height={80}
                        borderRadius="full"
                        backgroundColor="mainBackground"
                        alignItems="center"
                        justifyContent="center"
                        marginBottom="l"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.2,
                            shadowRadius: 15,
                            elevation: 10,
                            opacity: 0.9
                        }}
                    >
                        <Ionicons name="book-outline" size={40} color={theme.colors.primary} />
                    </Box>

                    {/* Text */}
                    <Text
                        variant="header"
                        fontSize={28}
                        textAlign="center"
                        marginBottom="s"
                        style={{
                            color: isDark ? 'white' : theme.colors.textPrimary,
                            textShadowColor: 'rgba(0,0,0,0.3)',
                            textShadowRadius: 10,
                            textShadowOffset: { width: 0, height: 4 }
                        }}
                    >
                        {t('library.title')}
                    </Text>

                    <Text
                        variant="body"
                        textAlign="center"
                        marginBottom="xl"
                        style={{
                            color: isDark ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary,
                            maxWidth: '80%'
                        }}
                    >
                        Start your reading journey by importing your first book.
                    </Text>

                    {/* Import Button */}
                    <Box
                        flexDirection="row"
                        alignItems="center"
                        backgroundColor="primary"
                        paddingVertical="m"
                        paddingHorizontal="xl"
                        borderRadius="l"
                        style={{
                            shadowColor: theme.colors.primary,
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.4,
                            shadowRadius: 12,
                            elevation: 8
                        }}
                    >
                        <Ionicons name="add-circle" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text variant="body" fontWeight="bold" color="white">
                            Import Book
                        </Text>
                    </Box>

                </Box>
            </Box>
        </TouchableOpacity>
    );
};

export default FeaturedBookPlaceholder;
