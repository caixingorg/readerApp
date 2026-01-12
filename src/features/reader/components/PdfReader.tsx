import React, { useRef, useEffect } from 'react';
import { Dimensions } from 'react-native';
import Pdf from 'react-native-pdf';
import Box from '@/components/Box';

interface PdfReaderProps {
    uri: string;
    onPageChanged?: (page: number, numberOfPages: number) => void;
    onLoadComplete?: (numberOfPages: number, filePath: string) => void;
    onError?: (error: object) => void;
    onPress?: () => void;
    initialPage?: number;
    themeMode?: 'light' | 'dark' | 'warm'; // Simple mapping for now
}

const PdfReader: React.FC<PdfReaderProps> = ({
    uri,
    onPageChanged,
    onLoadComplete,
    onError,
    onPress,
    initialPage = 1,
    themeMode = 'light',
}) => {
    // Basic Night Mode implementation using color inversion or filter
    // react-native-pdf supports 'enablePaging' and style customization
    // For dark mode, we might need to rely on the library's features or overlay.
    // Unfortunately react-native-pdf doesn't have a simple "night mode" prop that inverts colors easily
    // unless the PDF itself is text-based and we hijack rendering, which we can't easily.
    // However, we can set the background color.

    // A common trick for PDF night mode is inverting container colors,
    // but actual PDF content inversion often requires native-level prop 'enableRTL' (no)
    // or specific android/ios props if available.
    // For now, we will just support standard rendering.

    const pdfRef = useRef<any>(null);
    const hasJumpedInitialRef = useRef(false);
    const lastReportedPageRef = useRef(initialPage);

    // Only jump to initial page once on mount or when loading is complete
    const handleInitialJump = (_numberOfPages: number) => {
        if (!hasJumpedInitialRef.current && pdfRef.current) {
            // eslint-disable-next-line no-console
            console.log('[PdfReader] Performing initial jump to page:', initialPage);
            pdfRef.current.setPage(initialPage);
            hasJumpedInitialRef.current = true;
            lastReportedPageRef.current = initialPage;
        }
    };

    // Also support external jumps (e.g. from TOC)
    // CRITICAL: We only call setPage if the new initialPage is DIFFERENT from what we last reported.
    // This prevents the "scroll-to-setPage-to-scroll" feedback loop that causes bouncing.
    useEffect(() => {
        if (
            hasJumpedInitialRef.current &&
            pdfRef.current &&
            initialPage !== lastReportedPageRef.current
        ) {
            // eslint-disable-next-line no-console
            console.log('[PdfReader] External jump requested to page:', initialPage);
            pdfRef.current.setPage(initialPage);
            lastReportedPageRef.current = initialPage;
        }
    }, [initialPage]);

    return (
        <Box flex={1} justifyContent="flex-start" alignItems="center">
            <Pdf
                ref={pdfRef}
                source={{ uri, cache: true }}
                onLoadComplete={(numberOfPages, filePath) => {
                    handleInitialJump(numberOfPages);
                    if (onLoadComplete) onLoadComplete(numberOfPages, filePath);
                }}
                onPageChanged={(page, numberOfPages) => {
                    lastReportedPageRef.current = page; // Mark this page as "handled" internally
                    if (onPageChanged) onPageChanged(page, numberOfPages);
                }}
                onError={(error) => {
                    // eslint-disable-next-line no-console
                    console.error('[PdfReader] Error:', error);
                    if (onError) onError(error);
                }}
                onPressLink={(uri) => {}}
                onPageSingleTap={() => {
                    if (onPress) onPress();
                }}
                style={{
                    flex: 1,
                    width: Dimensions.get('window').width,
                    height: Dimensions.get('window').height,
                    backgroundColor: themeMode === 'dark' ? '#121212' : '#FFFFFF',
                }}
                enablePaging={false} // Always scroll for PDF as per user request
                horizontal={false} // Vertical scroll is better for "no page turn" feel
                fitPolicy={0} // Fit Width
                enableAntialiasing={true}
                maxScale={3.0}
                spacing={10} // Add some breathing room between pages
            />
        </Box>
    );
};

export default PdfReader;
