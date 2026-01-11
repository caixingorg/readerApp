
import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import Text from '@/components/Text';
import Box from '@/components/Box';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface NoteShareCardProps {
    type: 'note' | 'highlight';
    quote?: string;
    note?: string;
    bookTitle: string;
    author: string;
    date: string;
}

const CARD_WIDTH = 375;
// Auto height based on content, but for ViewShot usually we want a specific container.
// We'll let it grow but pad it nicely.

const NoteShareCard: React.FC<NoteShareCardProps> = ({
    type,
    quote,
    note,
    bookTitle,
    author,
    date
}) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    const isHighlight = type === 'highlight';

    return (
        <Box
            width={CARD_WIDTH}
            borderRadius="l"
            overflow="hidden"
            backgroundColor="mainBackground"
        >
            <LinearGradient
                colors={['#292524', '#1c1917']} // Stone 800 -> Stone 900
                style={StyleSheet.absoluteFill}
            />

            <Box padding="xl" flex={1}>
                {/* Header: Date & Branding - Kept minimal */}
                <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="l">
                    <Box flexDirection="row" alignItems="center" opacity={0.7}>
                        <Ionicons name="book-outline" size={14} color="white" style={{ marginRight: 6 }} />
                        <Text variant="caption" color="textTertiary" letterSpacing={1} fontSize={10}>
                            {date.toUpperCase()}
                        </Text>
                    </Box>
                    <Box opacity={0.7}>
                        <Text variant="caption" color="textTertiary" letterSpacing={1} fontWeight="bold" fontSize={10}>
                            READER
                        </Text>
                    </Box>
                </Box>

                {/* Main Content Area - Flex Grow to Center Vertically */}
                <Box flex={1} justifyContent="center" marginBottom="xl">
                    {/* Scenario 1: Quote Present */}
                    {quote && (
                        <Box marginBottom="xl" position="relative">
                            {/* Decorative mark background */}
                            <Text
                                style={{
                                    position: 'absolute',
                                    top: -20,
                                    left: -10,
                                    fontSize: 80,
                                    fontFamily: 'Serif',
                                    fontWeight: '900',
                                    color: 'rgba(255,255,255,0.05)',
                                    lineHeight: 80
                                }}
                            >
                                “
                            </Text>

                            <Text
                                fontSize={24}
                                lineHeight={36}
                                fontFamily={Platform.OS === 'ios' ? 'Georgia' : 'serif'}
                                color="white"
                                fontWeight="600"
                                style={{ letterSpacing: 0.2 }}
                            >
                                {quote}
                            </Text>
                        </Box>
                    )}

                    {/* Scenario 2: Note Present */}
                    {note && (
                        <View
                            style={{
                                backgroundColor: quote ? "rgba(255,255,255,0.05)" : "transparent", // Only box it if there's a quote separate
                                padding: quote ? 20 : 0,
                                borderRadius: 16,
                                borderLeftWidth: quote ? 2 : 0,
                                borderLeftColor: "#EF4444",
                            }}
                        >
                            {!quote && (
                                <Box flexDirection="row" alignItems="center" marginBottom="m" opacity={0.8}>
                                    <View style={{ width: 24, height: 1, backgroundColor: '#EF4444', marginRight: 10 }} />
                                    <Text variant="caption" color="textTertiary" fontWeight="bold">
                                        THOUGHT
                                    </Text>
                                </Box>
                            )}

                            <Text
                                variant="body"
                                fontSize={quote ? 16 : 22} // Larger if it's the only content
                                lineHeight={quote ? 26 : 34}
                                style={{
                                    color: quote ? "rgba(255,255,255,0.9)" : "white",
                                    fontStyle: quote ? 'normal' : 'italic'
                                }}
                            >
                                {note}
                            </Text>
                        </View>
                    )}
                </Box>

                {/* Footer: Book Info */}
                <Box borderTopWidth={1} style={{ borderTopColor: "rgba(255,255,255,0.1)" }} paddingTop="m" flexDirection="row" alignItems="center">
                    {/* Placeholder for Book Cover if checking in future (Image) */}
                    <Box flex={1}>
                        <Text
                            variant="subheader"
                            fontSize={16}
                            color="white"
                            fontWeight="bold"
                            numberOfLines={1}
                            style={{ letterSpacing: 0.5 }}
                        >
                            {bookTitle}
                        </Text>
                        <Text variant="caption" color="textTertiary" fontSize={13} marginTop="xs">
                            {author}
                        </Text>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

const styles = StyleSheet.create({
    // Removed unused styles to keep it clean, utilizing inline or functional styles for dynamic logic
});

export default NoteShareCard;
