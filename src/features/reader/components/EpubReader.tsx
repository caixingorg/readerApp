import React, { useRef, useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, useWindowDimensions, TouchableWithoutFeedback } from 'react-native';
import { Reader, ReaderProvider, useReader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system'; // Ensure this is installed/used if needed
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';

interface EpubReaderProps {
    url: string;
    location?: string | number | null;
    theme: Theme;
    themeMode: 'light' | 'dark';
    customTheme?: { bg: string; text: string };
    fontSize: number;
    fontFamily?: string;
    onPress?: () => void;
    onReady?: () => void;  // NEW: Called when reader is ready
    onLocationChange?: (loc: string) => void;
    onSectionChange?: (section: any) => void; // NEW: Called when section changes
    onNextChapter?: () => void;
    insets?: { top: number; bottom: number; left: number; right: number };
    flow?: 'paginated' | 'scrolled';
}

export interface EpubReaderRef {
    turnPage: (direction: 'next' | 'prev') => void;
    goToLocation: (cfi: string | number) => void;
    getCurrentLocation: () => string | number | null;
    search: (query: string) => Promise<any[]>;
    // Add more as needed for highlights, etc.
}

// Inner component to access context
const InnerReader = React.forwardRef<EpubReaderRef, EpubReaderProps>((props, ref) => {
    const {
        url,
        location,
        themeMode,
        customTheme,
        fontSize,
        fontFamily = 'Helvetica, Arial, sans-serif',
        onPress,
        onReady,  // NEW
        onLocationChange,
        onSectionChange, // NEW
        insets = { top: 0, bottom: 0, left: 0, right: 0 },
        flow = 'paginated'
    } = props;

    const { goToLocation, goPrevious, goNext, isRendering, changeFontSize, changeTheme, section } = useReader();
    const { width, height } = useWindowDimensions();

    const bg = customTheme?.bg || (themeMode === 'dark' ? '#121212' : '#FFFFFF');
    const text = customTheme?.text || (themeMode === 'dark' ? '#E0E0E0' : '#000000');

    // Track current location (managed by onLocationChange only, NOT synced from prop)
    const [savedLocation, setSavedLocation] = useState<string | number | null>(null);

    // Track container dimensions
    const [readerDimensions, setReaderDimensions] = useState<{ width: number; height: number } | null>(null);

    // Navigation tracking
    const lastJumpedLocation = useRef<string | number | null>(null);

    // Expose methods
    React.useImperativeHandle(ref, () => ({
        turnPage: (direction: 'next' | 'prev') => {
            if (direction === 'next') {
                goNext();
            } else {
                goPrevious();
            }
        },
        goToLocation: (cfi: string | number) => {
            goToLocation(cfi as any);
        },
        getCurrentLocation: () => {
            return savedLocation;
        },
        search: async (query: string) => {
            console.warn('Search not fully implemented yet');
            return [];
        },
    }));

    // Define themes with comprehensive CSS resets
    const themes = React.useMemo(() => ({
        light: {
            body: {
                color: '#000000',
                background: '#FFFFFF',
                'font-family': fontFamily,
                'padding': '0 !important',
                'margin': '0 !important',
                'font-size': `${fontSize}px`,
                'line-height': '1.5',
                'box-sizing': 'border-box',
            },
            'p, div, section, article': {
                'margin': '0.5em 10px !important',
                'padding': '0 !important',
            },
            '*': {
                'box-sizing': 'border-box !important',
            }
        },
        dark: {
            body: {
                color: '#E0E0E0',
                background: '#121212',
                'font-family': fontFamily,
                'padding': '0 !important',
                'margin': '0 !important',
                'font-size': `${fontSize}px`,
                'line-height': '1.5',
                'box-sizing': 'border-box',
            },
            'p, div, section, article': {
                'margin': '0.5em 10px !important',
                'padding': '0 !important',
            },
            '*': {
                'box-sizing': 'border-box !important',
            }
        },
        custom: {
            body: {
                color: text,
                background: bg,
                'font-family': fontFamily,
                'padding': '0 !important',
                'margin': '0 !important',
                'font-size': `${fontSize}px`,
                'line-height': '1.5',
                'box-sizing': 'border-box',
            },
            'p, div, section, article': {
                'margin': '0.5em 10px !important',
                'padding': '0 !important',
            },
            '*': {
                'box-sizing': 'border-box !important',
            }
        }
    }), [bg, text, fontFamily, fontSize]);

    // Apply font size changes
    useEffect(() => {
        if (isRendering && changeFontSize) {
            changeFontSize(`${fontSize}px`);
        }
    }, [fontSize, isRendering, changeFontSize]);

    // Apply theme changes
    useEffect(() => {
        if (isRendering && changeTheme) {
            const activeTheme = themeMode === 'light' && customTheme ? themes.custom : (themeMode === 'dark' ? themes.dark : themes.light);
            changeTheme(activeTheme);
        }
    }, [themeMode, customTheme, themes, isRendering, changeTheme]);

    // Call onReady when reader is ready (only once)
    const onReadyCalledRef = useRef(false);
    useEffect(() => {
        if (isRendering && onReady && !onReadyCalledRef.current) {
            console.log('[EpubReader] Reader is ready, calling onReady');
            onReadyCalledRef.current = true;
            onReady();
        }
    }, [isRendering, onReady]);

    // Notify parent when section changes
    useEffect(() => {
        if (section && onSectionChange) {
            onSectionChange(section);
        }
    }, [section, onSectionChange]);

    // Handle Initial Location Restoration (executes once when reader is ready)
    // location can be a string (HREF) or number (legacy fallback)
    useEffect(() => {
        if (!isRendering) return;

        // Check if location prop changed from what we last jumped to
        if (location !== undefined && location !== null && location !== lastJumpedLocation.current) {
            console.warn(`[🚀 Stage 4: Native] Executing goToLocation(${location}) type: ${typeof location}`);

            try {
                goToLocation(location as any);
                lastJumpedLocation.current = location;
            } catch (err) {
                console.error('[❌ Stage 4: Native] Jump failed:', err);
            }
        }
    }, [location, isRendering, goToLocation]);

    return (
        <View style={[styles.container, { backgroundColor: bg }]}>
            <TouchableWithoutFeedback onPress={onPress}>
                <View
                    style={styles.innerContainer}
                    onLayout={(event) => {
                        const { width, height } = event.nativeEvent.layout;
                        setReaderDimensions({ width, height });
                    }}
                >
                    {readerDimensions && (
                        <Reader
                            src={url}
                            width={readerDimensions.width}
                            height={readerDimensions.height}
                            fileSystem={useFileSystem}
                            defaultTheme={themeMode === 'light' && customTheme ? themes.custom : (themeMode === 'dark' ? themes.dark : themes.light)}
                            flow={flow}
                            onLocationChange={(location: any) => {
                                // Update saved location when user navigates
                                if (location && typeof location === 'object' && location.start?.cfi) {
                                    const cfi = location.start.cfi;
                                    // console.log('[EpubReader] Internal onLocationChange:', cfi);
                                    setSavedLocation(cfi);
                                    if (onLocationChange) {
                                        onLocationChange(cfi);
                                    }
                                }
                            }}
                        />
                    )}
                </View>
            </TouchableWithoutFeedback>
        </View>
    );
});

const EpubReader = React.forwardRef<EpubReaderRef, EpubReaderProps>((props, ref) => {
    return (
        <ReaderProvider>
            <InnerReader {...props} ref={ref} />
        </ReaderProvider>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        height: '100%',
        overflow: 'hidden',
    },
});

export default EpubReader;
