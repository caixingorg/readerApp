import React from 'react';
import { TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

interface FeaturedBookPlaceholderProps {
    onPress: () => void;
}

const FeaturedBookPlaceholder: React.FC<FeaturedBookPlaceholderProps> = ({ onPress }) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    const isDark = ['#020617', '#0F172A', '#0C0A09', '#1C1917', '#292524'].includes(
        theme.colors.mainBackground,
    );

    return (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
            <Box
                width={CARD_WIDTH}
                height={CARD_HEIGHT * 0.8}
                borderRadius="xl"
                backgroundColor="cardSecondary"
                borderWidth={2}
                borderColor="border"
                borderStyle="dashed"
                justifyContent="center"
                alignItems="center"
                padding="l"
                style={styles.container}
            >
                {/* Center Content */}
                <Box alignItems="center">
                    {/* Icon Container */}
                    <Box
                        width={64}
                        height={64}
                        borderRadius="full"
                        backgroundColor="mainBackground"
                        alignItems="center"
                        justifyContent="center"
                        marginBottom="m"
                        borderWidth={1}
                        borderColor="border"
                    >
                        <Ionicons name="book-outline" size={32} color={theme.colors.textTertiary} />
                    </Box>

                    {/* Text Hint */}
                    <Text
                        variant="subheader"
                        fontSize={20}
                        textAlign="center"
                        marginBottom="xs"
                        color="textPrimary"
                    >
                        {t('library.title')}
                    </Text>

                    <Text
                        variant="body"
                        textAlign="center"
                        marginBottom="xl"
                        fontSize={14}
                        color="textSecondary"
                        style={styles.bodyText}
                    >
                        Start your reading journey
                    </Text>

                    {/* Simple Icon-only Import Button */}
                    <Box
                        width={56}
                        height={56}
                        borderRadius="full"
                        backgroundColor="primary"
                        alignItems="center"
                        justifyContent="center"
                        style={styles.iconButton}
                    >
                        <Ionicons name="add" size={32} color="white" />
                    </Box>
                </Box>
            </Box>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        // Subtle elevation for placeholder
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    bodyText: {
        maxWidth: '80%',
        lineHeight: 20,
    },
    iconButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
});

export default FeaturedBookPlaceholder;
