import React from 'react';
import { ScrollView } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';
import EpubReader from '@/features/reader/components/EpubReader';
import PdfReader from '@/features/reader/components/PdfReader';

interface ReaderRendererProps {
    book: any;
    content: string;
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    readerThemeColors: { bg: string; text: string };
    stableInsets: any;
    epubRef: any;
    scrollViewRef: any;
    currentChapterIndex: number;
    currentChapterIndexRef: any;
    toggleControls: () => void;
    handleLocationUpdate: (loc: any) => void;
    handleEpubScroll: (val: number) => void;
    handleSectionChange: (href: string) => void;
    handleScroll: (event: any) => void;
    handleTextLayout: (event: any) => void;
    setTotalPdfPages: (total: number) => void;
    mode: 'light' | 'dark';
    readerTheme: string;
    initialScrollPosition?: number;
}

const ReaderRenderer: React.FC<ReaderRendererProps> = ({
    book,
    content,
    fontSize,
    fontFamily,
    lineHeight,
    readerThemeColors,
    stableInsets,
    epubRef,
    scrollViewRef,
    currentChapterIndex,
    currentChapterIndexRef,
    toggleControls,
    handleLocationUpdate,
    handleEpubScroll,
    handleSectionChange,
    handleScroll,
    handleTextLayout,
    setTotalPdfPages,
    mode,
    readerTheme,
    initialScrollPosition = 0,
}) => {
    const theme = useTheme<Theme>();
    const isDark = mode === 'dark' || readerTheme === 'dark';

    // Fix: Capture initial location ONCE.
    // Fallback to Chapter-level restoration for stability as requested by user.
    // We explicitly ignore lastPositionCfi for now to ensure reliable restoration (albeit less precise).
    const [initialEpubLocation] = React.useState(currentChapterIndex);

    if (book?.fileType === 'epub') {
        console.log('[ReaderRenderer] Mounting EpubReader with FROZEN location (Chapter Index):', initialEpubLocation);
        return (
            <EpubReader
                ref={epubRef}
                url={book.filePath}
                location={initialEpubLocation}
                theme={theme}
                themeMode={mode === 'dark' ? 'dark' : 'light'}
                customTheme={
                    readerTheme === 'warm' || readerTheme === 'eye-care'
                        ? readerThemeColors
                        : undefined
                }
                fontSize={fontSize}
                fontFamily={fontFamily}
                onPress={toggleControls}
                onReady={() => {
                    // No-op or cleanup legacy timeout logic if relying on 'location' prop
                }}
                onLocationChange={(cfi) => {
                    if (cfi) {
                        handleLocationUpdate(cfi);
                        handleEpubScroll(0);
                    }
                }}
                onSectionChange={(section) => {
                    if (section?.href) handleSectionChange(section.href);
                }}
                insets={stableInsets}
            />
        );
    }

    if (book?.fileType === 'pdf') {
        return (
            <PdfReader
                uri={book.filePath}
                initialPage={currentChapterIndex > 0 ? currentChapterIndex : 1}
                onPageChanged={(page, total) => {
                    setTotalPdfPages(total);
                    handleLocationUpdate({ type: 'pdf', page });
                }}
                onPress={toggleControls}
                themeMode={isDark ? 'dark' : 'light'}
            />
        );
    }

    return (
        <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: theme.spacing.l, paddingBottom: 100 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={(w, h) => {
                if (initialScrollPosition > 0 && h > initialScrollPosition) {
                    scrollViewRef.current?.scrollTo({ y: initialScrollPosition, animated: false });
                }
            }}
        >
            <Text
                variant="body"
                style={{
                    fontSize,
                    lineHeight: fontSize * lineHeight,
                    color: readerThemeColors.text,
                    fontFamily,
                }}
                selectable
                onPress={toggleControls}
                onTextLayout={handleTextLayout}
            >
                {content}
            </Text>
        </ScrollView>
    );
};

export default ReaderRenderer;
