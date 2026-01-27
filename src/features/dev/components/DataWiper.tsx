import React, { useState } from 'react';
import { TouchableOpacity, Alert, Platform } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react-native';
import Text from '@/components/Text';
import Box from '@/components/Box';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

// Note: In a real app, you would also import your DatabaseService to clear SQLite
// import { DatabaseService } from '@/services/database';

const DataWiper: React.FC = () => {
    const theme = useTheme<Theme>();
    const [wiping, setWiping] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleWipe = async () => {
        Alert.alert(
            'Factory Reset',
            'Are you sure? This will delete ALL data (Books, Notes, Settings) and restart the app.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Nuke it 🚀',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setWiping(true);
                            // 1. Clear AsyncStorage
                            await AsyncStorage.clear();

                            // 2. Clear Database (Stub)
                            // await DatabaseService.clearAll();

                            // 3. Clear Files (Stub - usually verify if implementing)
                            // await FileSystem.deleteAsync(FileSystem.documentDirectory + 'books');

                            setSuccess(true);

                            setTimeout(async () => {
                                // Reload the app
                                try {
                                    await Updates.reloadAsync();
                                } catch (e) {
                                    // Fallback for dev mode if Updates not available
                                    Alert.alert('Done', 'Please manually restart the app.');
                                }
                            }, 1000);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to wipe data.');
                            setWiping(false);
                        }
                    },
                },
            ]
        );
    };

    if (success) {
        return (
            <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                backgroundColor="success"
                padding="m"
                borderRadius="m"
            >
                <CheckCircle size={20} color="white" style={{ marginRight: 8 }} />
                <Text color="white" fontWeight="bold">Wiped! Restarting...</Text>
            </Box>
        );
    }

    return (
        <TouchableOpacity onPress={handleWipe} disabled={wiping}>
            <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                backgroundColor={wiping ? 'textTertiary' : 'error'}
                padding="m"
                borderRadius="m"
            >
                <Box flexDirection="row" alignItems="center">
                    <Trash2 size={20} color="white" style={{ marginRight: 12 }} />
                    <Text color="white" fontWeight="bold">
                        {wiping ? 'Wiping...' : 'Factory Reset'}
                    </Text>
                </Box>
                <AlertTriangle size={16} color="white" opacity={0.8} />
            </Box>
        </TouchableOpacity>
    );
};

export default DataWiper;
