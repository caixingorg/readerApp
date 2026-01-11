import React, { useState } from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import { BookRepository } from '@/services/database';

interface DiagnosticPanelProps {
    bookId: string;
}

/**
 * Diagnostic panel to test database operations
 * Add this temporarily to ReaderScreen to verify DB persistence works
 */
export const DatabaseDiagnostic: React.FC<DiagnosticPanelProps> = ({ bookId }) => {
    const [lastResult, setLastResult] = useState<string>('');

    const testSave = async () => {
        const testCFI = `epubcfi(/6/4[test-chapter]!/4/2/1:0)`;
        try {
            await BookRepository.update(bookId, {
                lastPositionCfi: testCFI,
                lastRead: Date.now(),
            });
            setLastResult(`✅ Saved test CFI: ${testCFI}`);
            Alert.alert('Success', 'Test CFI saved to database');
        } catch (e) {
            setLastResult(`❌ Save failed: ${e}`);
            Alert.alert('Error', `Save failed: ${e}`);
        }
    };

    const testLoad = async () => {
        try {
            const book = await BookRepository.getById(bookId);
            if (book) {
                setLastResult(`✅ Loaded CFI: ${book.lastPositionCfi || 'null'}`);
                Alert.alert('Success', `CFI from DB: ${book.lastPositionCfi || 'null'}`);
            } else {
                setLastResult(`❌ Book not found`);
                Alert.alert('Error', 'Book not found');
            }
        } catch (e) {
            setLastResult(`❌ Load failed: ${e}`);
            Alert.alert('Error', `Load failed: ${e}`);
        }
    };

    const theme = useTheme<Theme>();

    return (
        <Box
            position="absolute"
            bottom={100}
            left={10}
            right={10}
            backgroundColor="glassStrong"
            padding="m"
            borderRadius="m"
            zIndex={9999}
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
        >
            <Text variant="caption" color="white" marginBottom="s">
                DB Diagnostic
            </Text>
            <Box flexDirection="row" gap="m">
                <TouchableOpacity
                    onPress={testSave}
                    style={{
                        backgroundColor: '#4CAF50',
                        padding: 10,
                        borderRadius: 5,
                        flex: 1,
                    }}
                >
                    <Text color="white" textAlign="center" fontWeight="600">
                        Test Save
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={testLoad}
                    style={{
                        backgroundColor: '#2196F3',
                        padding: 10,
                        borderRadius: 5,
                        flex: 1,
                    }}
                >
                    <Text color="white" textAlign="center" fontWeight="600">
                        Test Load
                    </Text>
                </TouchableOpacity>
            </Box>
            {lastResult ? (
                <Text color="white" fontSize={10} marginTop="s">
                    {lastResult}
                </Text>
            ) : null}
        </Box>
    );
};
