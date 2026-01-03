import { createTheme } from '@shopify/restyle';

const palette = {
    // Primary colors
    blue500: '#007AFF',
    blue400: '#339DFF',
    blue600: '#0055CC',

    // Neutral colors
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',

    // Semantic colors  
    green500: '#10B981',
    red500: '#EF4444',
    yellow500: '#F59E0B',
};

const theme = createTheme({
    colors: {
        // Light theme
        primary: palette.blue500,
        primaryLight: palette.blue400,
        primaryDark: palette.blue600,

        background: palette.white,
        foreground: palette.gray50,
        card: palette.white,

        text: palette.gray900,
        textSecondary: palette.gray600,
        textTertiary: palette.gray400,

        border: palette.gray200,
        borderLight: palette.gray100,

        transparent: 'transparent',
        white: palette.white,

        success: palette.green500,
        error: palette.red500,
        warning: palette.yellow500,

        overlay: 'rgba(0, 0, 0, 0.5)',
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
            color: 'text',
        },
        header: {
            fontSize: 32,
            fontWeight: '700',
            lineHeight: 40,
            color: 'text',
        },
        subheader: {
            fontSize: 24,
            fontWeight: '600',
            lineHeight: 32,
            color: 'text',
        },
        title: {
            fontSize: 20,
            fontWeight: '600',
            lineHeight: 28,
            color: 'text',
        },
        body: {
            fontSize: 16,
            fontWeight: '400',
            lineHeight: 24,
            color: 'text',
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
        background: palette.gray900,
        foreground: palette.gray800,
        card: palette.gray800,

        text: palette.gray50,
        textSecondary: palette.gray300,
        textTertiary: palette.gray500,

        border: palette.gray700,
        borderLight: palette.gray800,

        white: palette.black, // Inverting for logic specific scenarios if needed
    },
});

export default theme;
