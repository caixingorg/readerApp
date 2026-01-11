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

    // Stone / Warm Gray (Natural Paper Aesthetic)
    stone50: '#FAFAF9',
    stone100: '#F5F5F4',
    stone200: '#E7E5E4',
    stone300: '#D6D3D1',
    stone400: '#A8A29E',
    stone500: '#78716C',
    stone600: '#57534E',
    stone700: '#44403C',
    stone800: '#292524',
    stone900: '#1C1917',
    stone950: '#0C0A09',

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
        mainBackground: palette.stone50, // Warm Paper Background
        cardPrimary: palette.white,
        cardSecondary: palette.stone100,
        modalBackground: palette.white,
        inputBackground: palette.stone100,

        // --- Text Hierarchy ---
        textPrimary: palette.stone900, // Ink Black
        textSecondary: palette.stone600,
        textTertiary: palette.stone400,
        textInverse: palette.white,

        // --- Brand Identity ---
        primary: palette.stone700, // Warm Dark Gray (Ink-like) - Replaces Indigo
        onPrimary: palette.white,
        secondary: palette.stone200,

        // --- Borders & Separators ---
        border: palette.stone200,
        borderStrong: palette.stone300,

        // --- Status Indicators ---
        success: palette.green600,
        error: palette.red600,
        warning: palette.amber500,
        info: palette.stone500, // Neutral info

        // --- Overlays ---
        overlay: 'rgba(28, 25, 23, 0.5)', // Warm overlay

        // --- Legacy Mappings ---
        background: palette.stone50,
        card: palette.white,
        text: palette.stone900,
        borderLight: palette.stone100,
        foreground: palette.stone100,
        white: palette.white,
        black: palette.black,
        gray800: palette.stone800,
        gray900: palette.stone900,
        transparent: palette.transparent,

        // --- Special Effects ---
        glass: 'rgba(255, 255, 255, 0.05)',
        glassStrong: 'rgba(255, 255, 255, 0.1)',
        shadow: 'rgba(0, 0, 0, 0.1)',
    },
    spacing: {
        none: 0,
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadii: {
        none: 0,
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
        // --- Dark Mode Maps (Natural Dark / Espresso) ---

        // Backgrounds: Deep Coffee/Stone
        mainBackground: palette.stone950,
        cardPrimary: palette.stone900,
        cardSecondary: palette.stone800,
        modalBackground: palette.stone900,
        inputBackground: palette.stone800,

        // Text: Warm Light
        textPrimary: palette.stone50,
        textSecondary: palette.stone400,
        textTertiary: palette.stone500,
        textInverse: palette.stone900,

        // Brand: Lighter Stone for contrast
        primary: palette.stone400, // Light Warm Gray
        onPrimary: palette.stone950,
        secondary: palette.stone800,

        // Borders
        border: palette.stone800,
        borderStrong: palette.stone700,

        // Status
        success: palette.green500,
        error: palette.red500,

        // --- Legacy Mappings ---
        background: palette.stone950,
        card: palette.stone900,
        text: palette.stone50,
        borderLight: palette.stone800,
        foreground: palette.stone800,
        white: palette.white,
        black: palette.black,
    },
});

export default theme;
