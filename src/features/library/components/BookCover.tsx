import React from 'react';
import { View, Image, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../../theme/theme';
import Text from '../../../components/Text';
import { getSafePath } from '../../../utils/PathUtils';

interface BookCoverProps {
    cover?: string | null;
    title: string;
    width?: number | string;
    height?: number | string;
    style?: ViewStyle;
    borderRadius?: number;
    children?: React.ReactNode;
}

// Theme-aware Gradients
// Light Mode: Option B - Natural Paper (Warm, Earthy, Cozy)
// Requires Dark Warm Text (e.g., #44403C, #57534E)
const LIGHT_GRADIENTS = [
    ['#FAFAF9', '#E7E5E4'], // Stone Paper
    ['#FEF3C7', '#FDE68A'], // Cream / Amber
    ['#F5F5F4', '#D6D3D1'], // Warm Grey
    ['#ECFCCB', '#BEF264'], // Light Lime/Sage
    ['#FFEDD5', '#FDBA74'], // Soft Orange
    ['#E0E7FF', '#C7D2FE'], // Periwinkle (for variety)
];

// Dark Mode: Option B - Natural Paper (Library, Leather, Wood)
// Requires Light Cream/White Text
const DARK_GRADIENTS = [
    ['#44403C', '#57534E'], // Espresso / Stone
    ['#78350F', '#92400E'], // Leather / Saddle Brown
    ['#3F2C22', '#5D4037'], // Deep Coffee
    ['#14532D', '#166534'], // Forest Green
    ['#7C2D12', '#9A3412'], // Rust
    ['#312E81', '#4338CA'], // Royal Blue (Bookbinding)
];

const getGradient = (title: string, isDark: boolean) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradients = isDark ? DARK_GRADIENTS : LIGHT_GRADIENTS;
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
};

const BookCover: React.FC<BookCoverProps> = ({
    cover,
    title,
    width = '100%',
    height = '100%',
    style,
    borderRadius = 8,
    children
}) => {
    const theme = useTheme<Theme>();
    const safeCover = getSafePath(cover);
    const [imageError, setImageError] = React.useState(false);

    // Detect Dark Mode based on background color
    // Supports: Old Slate (#020617, #0F172A) and New Stone (#0C0A09)
    const isDark = [
        '#020617', '#0F172A', // Old Slate
        '#0C0A09', '#1C1917', '#292524' // New Stone/Dark Grays
    ].includes(theme.colors.mainBackground);

    React.useEffect(() => {
        setImageError(false);
    }, [safeCover]);

    const colors = getGradient(title, isDark);

    // Always render the Gradient Background + Title (as fallback and placeholder)
    return (
        <View style={[{ width: width as DimensionValue, height: height as DimensionValue, borderRadius, overflow: 'hidden', backgroundColor: theme.colors.cardSecondary }, style]}>
            <LinearGradient
                colors={colors as [string, string, ...string[]]}
                style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', padding: 8 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Overlay pattern/icon for texture */}
                <Ionicons
                    name="book"
                    size={typeof width === 'number' ? width * 0.4 : 32}
                    color={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
                    style={{ position: 'absolute', bottom: -10, right: -10, transform: [{ rotate: '-15deg' }] }}
                />

                <Text
                    variant="body"
                    color="textPrimary"
                    fontWeight="700"
                    textAlign="center"
                    numberOfLines={3}
                    style={{
                        fontSize: typeof width === 'number' ? Math.max(10, width * 0.12) : 12,
                        textShadowColor: isDark ? 'rgba(0,0,0,0.5)' : 'transparent',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2
                    }}
                >
                    {title}
                </Text>
            </LinearGradient>

            {/* If we have a valid cover and no error, overlay it absolutely */}
            {safeCover && !imageError && (
                <Image
                    source={{ uri: safeCover }}
                    style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
                    resizeMode="cover"
                    onError={() => {
                        console.log('[BookCover] Failed to load image:', safeCover);
                        setImageError(true);
                    }}
                />
            )}

            {/* Children (e.g. progress bar) overlay everything */}
            {children}
        </View>
    );
};

export default BookCover;
