import React, { useRef, useState, useEffect } from 'react';
import { TouchableWithoutFeedback, LayoutChangeEvent } from 'react-native';
import { Reader, ReaderProvider, useReader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import { Theme } from '@/theme/theme';
import Box from '@/components/Box';

interface EpubReaderProps {
    url: string;
    location?: string | number | null;
    theme: Theme;
    themeMode: 'light' | 'dark';
    customTheme?: { bg: string; text: string };
    fontSize: number;
    fontFamily?: string;
    onPress?: () => void;
    onReady?: () => void;
    onLocationChange?: (loc: string) => void;
    onSectionChange?: (section: any) => void;
    onNextChapter?: () => void;
    insets?: { top: number; bottom: number; left: number; right: number };
}

export interface EpubReaderRef {
    turnPage: (direction: 'next' | 'prev') => void;
    goToLocation: (cfi: string | number) => void;
    getCurrentLocation: () => string | number | null;
    search: (query: string) => Promise<any[]>;
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
        onReady,
        onLocationChange,
        onSectionChange,
    } = props;

    const {
        goToLocation,
        goPrevious,
        goNext,
        isRendering,
        changeFontSize,
        changeTheme,
        section,
        getCurrentLocation,
    } = useReader();

    const bg = customTheme?.bg || (themeMode === 'dark' ? '#121212' : '#FFFFFF');
    const text = customTheme?.text || (themeMode === 'dark' ? '#E0E0E0' : '#000000');

    // Track current location (managed by onLocationChange only, NOT synced from prop)
    const [savedLocation, setSavedLocation] = useState<string | number | null>(null);

    // Track container dimensions
    const [readerDimensions, setReaderDimensions] = useState<{
        width: number;
        height: number;
    } | null>(null);

    // Helper to parse location strings (legacy compatibility)
    const parseLocation = (
        loc: string | number | null | undefined,
    ): string | number | undefined => {
        if (loc === null || loc === undefined) return undefined;
        if (typeof loc === 'string' && loc.startsWith('chapter:')) {
            const index = parseInt(loc.replace('chapter:', ''), 10);
            return isNaN(index) ? 0 : index;
        }
        return loc as string | number;
    };

    // Capture initial location for the Reader prop (Run once)
    const initialLocationRef = useRef(parseLocation(location));

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
            const target = parseLocation(cfi);
            if (target !== undefined) goToLocation(target as any);
        },
        getCurrentLocation: () => {
            return savedLocation;
        },
        search: async (query: string) => {
            console.warn('Search not fully implemented yet');
            return [];
        },
    }));

    // Define themes
    const themes = React.useMemo(
        () => ({
            light: {
                body: {
                    color: '#000000',
                    background: '#FFFFFF',
                    'font-family': fontFamily,
                    padding: '0 !important',
                    margin: '0 !important',
                    'font-size': `${fontSize}px`,
                    'line-height': '1.5',
                    'box-sizing': 'border-box',
                },
                'p, div, section, article': {
                    margin: '0.5em 10px !important',
                    padding: '0 !important',
                },
                '*': {
                    'box-sizing': 'border-box !important',
                },
            },
            dark: {
                body: {
                    color: '#E0E0E0',
                    background: '#121212',
                    'font-family': fontFamily,
                    padding: '0 !important',
                    margin: '0 !important',
                    'font-size': `${fontSize}px`,
                    'line-height': '1.5',
                    'box-sizing': 'border-box',
                },
                'p, div, section, article': {
                    margin: '0.5em 10px !important',
                    padding: '0 !important',
                },
                '*': {
                    'box-sizing': 'border-box !important',
                },
            },
            custom: {
                body: {
                    color: text,
                    background: bg,
                    'font-family': fontFamily,
                    padding: '0 !important',
                    margin: '0 !important',
                    'font-size': `${fontSize}px`,
                    'line-height': '1.5',
                    'box-sizing': 'border-box',
                },
                'p, div, section, article': {
                    margin: '0.5em 10px !important',
                    padding: '0 !important',
                },
                '*': {
                    'box-sizing': 'border-box !important',
                },
            },
        }),
        [bg, text, fontFamily, fontSize],
    );

    // Apply font size changes
    useEffect(() => {
        if (isRendering && changeFontSize) {
            changeFontSize(`${fontSize}px`);
        }
    }, [fontSize, isRendering, changeFontSize]);

    // Apply theme changes
    useEffect(() => {
        if (isRendering && changeTheme) {
            const activeTheme =
                themeMode === 'light' && customTheme
                    ? themes.custom
                    : themeMode === 'dark'
                      ? themes.dark
                      : themes.light;
            changeTheme(activeTheme);
        }
    }, [themeMode, customTheme, themes, isRendering, changeTheme]);

    // Call onReady when reader is ready (only once)
    const onReadyCalledRef = useRef(false);
    useEffect(() => {
        if (isRendering && onReady && !onReadyCalledRef.current) {
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

    return (
        <Box flex={1} style={{ backgroundColor: bg }}>
            <TouchableWithoutFeedback onPress={onPress}>
                <Box
                    flex={1}
                    height="100%"
                    overflow="hidden"
                    onLayout={(event: LayoutChangeEvent) => {
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
                            initialLocation={initialLocationRef.current as any}
                            defaultTheme={
                                themeMode === 'light' && customTheme
                                    ? themes.custom
                                    : themeMode === 'dark'
                                      ? themes.dark
                                      : themes.light
                            }
                            flow="paginated"
                            onLocationChange={(loc: any) => {
                                let cfi: string | undefined = undefined;

                                if (loc && typeof loc === 'object' && loc.start?.cfi) {
                                    cfi = loc.start.cfi;
                                } else if (getCurrentLocation) {
                                    // Fallback: use context if provided
                                    const ctxLoc = getCurrentLocation();
                                    if (
                                        ctxLoc &&
                                        typeof ctxLoc === 'object' &&
                                        (ctxLoc as any).start?.cfi
                                    ) {
                                        cfi = (ctxLoc as any).start.cfi;
                                    } else if (typeof ctxLoc === 'string') {
                                        cfi = ctxLoc;
                                    }
                                }

                                if (cfi) {
                                    setSavedLocation(cfi);
                                    if (onLocationChange) {
                                        onLocationChange(cfi);
                                    }
                                }
                            }}
                        />
                    )}
                </Box>
            </TouchableWithoutFeedback>
        </Box>
    );
});

InnerReader.displayName = 'InnerReader';

const EpubReader = React.forwardRef<EpubReaderRef, EpubReaderProps>((props, ref) => {
    return (
        <ReaderProvider>
            <InnerReader {...props} ref={ref} />
        </ReaderProvider>
    );
});

EpubReader.displayName = 'EpubReader';

export default EpubReader;
