import { createTheme } from '@shopify/restyle';

// Complete Tailwind-inspired Color Palette
const palette = {
    // Brand Colors (Indigo - More Premium than basic Blue)
    blue50: '#EEF2FF',
    blue100: '#E0E7FF',
    blue200: '#C7D2FE',
    blue300: '#A5B4FC',
    blue400: '#818CF8',
    blue500: '#6366F1',
    blue600: '#4F46E5', // Primary
    blue700: '#4338CA',
    blue800: '#3730A3',
    blue900: '#312E81',
    blue950: '#1E1B4B',

    // Grayscale (Slate - Cool/Blueish Gray for premium tech feel)
    gray50: '#F8FAFC',
    gray100: '#F1F5F9',
    gray200: '#E2E8F0',
    gray300: '#CBD5E1',
    gray400: '#94A3B8',
    gray500: '#64748B',
    gray600: '#475569',
    gray700: '#334155',
    gray800: '#1E293B',
    gray900: '#0F172A',
    gray950: '#020617', // Richer dark background

    // Semantic Status Colors
    green500: '#22C55E',
    green600: '#16A34A',
    red500: '#EF4444',
    red600: '#DC2626',
    amber500: '#F59E0B',

    // Primitives
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
};

const theme = createTheme({
    colors: {
        // --- Core Application Backgrounds ---
        mainBackground: palette.gray50,
        cardPrimary: palette.white,
        cardSecondary: palette.gray100,
        modalBackground: palette.white,

        // --- Text Hierarchy ---
        textPrimary: palette.gray900,
        textSecondary: palette.gray600,
        textTertiary: palette.gray400,
        textInverse: palette.white,

        // --- Brand Identity ---
        primary: palette.blue600,
        onPrimary: palette.white,
        secondary: palette.gray200,

        // --- Borders & Separators ---
        border: palette.gray200,
        borderStrong: palette.gray300,

        // --- Status Indicators ---
        success: palette.green600,
        error: palette.red600,
        warning: palette.amber500,
        info: palette.blue500,

        // --- Overlays ---
        overlay: 'rgba(0, 0, 0, 0.5)',

        // --- Legacy Mappings (Backward Compatibility) ---
        background: palette.gray50,       // Maps to mainBackground
        card: palette.white,              // Maps to cardPrimary
        text: palette.gray900,            // Maps to textPrimary
        borderLight: palette.gray100,
        foreground: palette.gray100,      // Maps to cardSecondary
        white: palette.white,
        black: palette.black,
        gray800: palette.gray800,         // Keep for custom ad-hoc usage if needed
        gray900: palette.gray900,
        transparent: palette.transparent,
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadii: {
        s: 4,
        m: 8,
        l: 12,
        xl: 16,
        full: 9999,
    },
    textVariants: {
        defaults: {
            fontSize: 16,
            fontWeight: '400',
            lineHeight: 24,
            color: 'textPrimary',
        },
        header: {
            fontSize: 32,
            fontWeight: '700',
            lineHeight: 40,
            color: 'textPrimary',
        },
        subheader: {
            fontSize: 24,
            fontWeight: '600',
            lineHeight: 32,
            color: 'textPrimary',
        },
        title: {
            fontSize: 20,
            fontWeight: '600',
            lineHeight: 28,
            color: 'textPrimary',
        },
        body: {
            fontSize: 16,
            fontWeight: '400',
            lineHeight: 24,
            color: 'textPrimary',
        },
        caption: {
            fontSize: 14,
            fontWeight: '400',
            lineHeight: 20,
            color: 'textSecondary',
        },
        small: {
            fontSize: 12,
            fontWeight: '400',
            lineHeight: 16,
            color: 'textSecondary',
        },
    },
    breakpoints: {},
});

export type Theme = typeof theme;

export const darkTheme = createTheme({
    ...theme,
    colors: {
        ...theme.colors,
        // --- Dark Mode Maps ---

        // Backgrounds: Deep rich blacks/grays
        mainBackground: palette.gray950,
        cardPrimary: palette.gray900,
        cardSecondary: palette.gray800,
        modalBackground: palette.gray900,

        // Text: Light on Dark
        textPrimary: palette.gray50,
        textSecondary: palette.gray400,
        textTertiary: palette.gray500,
        textInverse: palette.gray900,

        // Brand: Slightly lighter/desaturated for contrast
        primary: palette.blue500,
        onPrimary: palette.white,
        secondary: palette.gray800,

        // Borders
        border: palette.gray800,
        borderStrong: palette.gray700,

        // Status: Adjusted for dark mode brightness
        success: palette.green500,
        error: palette.red500,

        // --- Legacy Mappings (Dark Mode updates) ---
        background: palette.gray950,
        card: palette.gray900,
        text: palette.gray50,
        borderLight: palette.gray800,
        foreground: palette.gray800,
        white: palette.white, // Keep white as white! Use textPrimary for dynamic text.
        black: palette.black,
    },
});

export default theme;
