import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert, StyleSheet } from 'react-native';
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
        <View style={styles.container}>
            <Text style={styles.title}>
                DB Diagnostic
            </Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    onPress={testSave}
                    style={styles.saveButton}
                >
                    <Text style={styles.buttonText}>Test Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={testLoad}
                    style={styles.loadButton}
                >
                    <Text style={styles.buttonText}>Test Load</Text>
                </TouchableOpacity>
            </View>
            {lastResult ? (
                <Text style={styles.resultText}>
                    {lastResult}
                </Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        left: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        borderRadius: 8,
        zIndex: 9999
    },
    title: {
        color: 'white',
        fontSize: 12,
        marginBottom: 10
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
        flex: 1
    },
    loadButton: {
        backgroundColor: '#2196F3',
        padding: 10,
        borderRadius: 5,
        flex: 1
    },
    buttonText: {
        color: 'white',
        textAlign: 'center'
    },
    resultText: {
        color: 'white',
        fontSize: 10,
        marginTop: 8
    }
});
