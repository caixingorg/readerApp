import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { BookRepository } from '../../../services/database';

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
                lastRead: Date.now()
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

    return (
        <View style={{
            position: 'absolute',
            bottom: 100,
            left: 10,
            right: 10,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 10,
            borderRadius: 8,
            zIndex: 9999
        }}>
            <Text style={{ color: 'white', fontSize: 12, marginBottom: 10 }}>
                DB Diagnostic
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                    onPress={testSave}
                    style={{
                        backgroundColor: '#4CAF50',
                        padding: 10,
                        borderRadius: 5,
                        flex: 1
                    }}
                >
                    <Text style={{ color: 'white', textAlign: 'center' }}>Test Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={testLoad}
                    style={{
                        backgroundColor: '#2196F3',
                        padding: 10,
                        borderRadius: 5,
                        flex: 1
                    }}
                >
                    <Text style={{ color: 'white', textAlign: 'center' }}>Test Load</Text>
                </TouchableOpacity>
            </View>
            {lastResult ? (
                <Text style={{ color: 'white', fontSize: 10, marginTop: 8 }}>
                    {lastResult}
                </Text>
            ) : null}
        </View>
    );
};
