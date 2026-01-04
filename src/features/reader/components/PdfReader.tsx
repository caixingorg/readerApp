import React, { useRef } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator } from 'react-native';
import Pdf from 'react-native-pdf';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';

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
    themeMode = 'light'
}) => {
    const theme = useTheme<Theme>();

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

    return (
        <View style={styles.container}>
            <Pdf
                ref={pdfRef}
                source={{ uri, cache: true }}
                page={initialPage}
                onLoadComplete={(numberOfPages, filePath) => {
                    console.log(`[PdfReader] Loaded ${numberOfPages} pages`);
                    if (onLoadComplete) onLoadComplete(numberOfPages, filePath);
                }}
                onPageChanged={(page, numberOfPages) => {
                    if (onPageChanged) onPageChanged(page, numberOfPages);
                }}
                onError={(error) => {
                    console.error('[PdfReader] Error:', error);
                    if (onError) onError(error);
                }}
                onPressLink={(uri) => {
                    console.log(`Link pressed: ${uri}`);
                }}
                onPageSingleTap={() => {
                    if (onPress) onPress();
                }}
                style={[
                    styles.pdf,
                    { backgroundColor: themeMode === 'dark' ? '#121212' : '#FFFFFF' }
                ]}
                enablePaging={false} // Use scroll by default? Or true for page-by-page.
                // horizontal={true} // Optional: Horizontal scroll like a book
                spacing={0}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    }
});

export default PdfReader;
