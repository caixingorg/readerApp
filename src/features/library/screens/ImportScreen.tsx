import React, { useState, useEffect } from 'react';
import { FlatList, ActivityIndicator, Alert, TouchableOpacity, Switch, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import Box from '../../../components/Box';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import ScreenLayout from '../../../components/ScreenLayout';
import { Theme } from '../../../theme/theme';
import { RootStackParamList } from '../../../types/navigation';
import { fileScanService, ScannedFile } from '../utils/FileScanService';
import { useCreateBook } from '../hooks/useBooks';
import { epubService } from '../../reader/utils/EpubService';
import { EncodingUtils } from '../../reader/utils/EncodingUtils';
import WiFiTransferScreen from './WiFiTransferScreen';

type ImportTab = 'local' | 'wifi' | 'scan';

const ImportScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const createBook = useCreateBook();
    const [activeTab, setActiveTab] = useState<ImportTab>('local');

    // Scan State
    const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        if (activeTab === 'scan') {
            scanFiles();
        }
    }, [activeTab]);

    const scanFiles = async () => {
        setIsScanning(true);
        const files = await fileScanService.scanForNewFiles();
        setScannedFiles(files);
        setIsScanning(false);
    };

    /**
     * Shared Import Logic
     */
    /**
     * Shared Import Logic
     */
    const performImport = async (uri: string, name: string, copy = true) => {
        let finalType: 'txt' | 'epub' | 'pdf' = 'txt';
        const lowerName = name.toLowerCase();
        if (lowerName.endsWith('.epub')) finalType = 'epub';
        else if (lowerName.endsWith('.pdf')) finalType = 'pdf';

        const booksDir = FileSystem.documentDirectory + 'books/';
        const dirInfo = await FileSystem.getInfoAsync(booksDir);
        if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(booksDir, { intermediates: true });

        const sanitizedName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueName = `book_${Date.now()}_${sanitizedName}`;
        const destPath = `${booksDir}${uniqueName}`;

        if (copy) {
            await FileSystem.copyAsync({ from: uri, to: destPath });
        } else {
            await FileSystem.moveAsync({ from: uri, to: destPath });
        }

        let title = name.replace(/\.(txt|epub|pdf)$/i, '');
        let author = 'Unknown Author';
        let cover: string | undefined;
        let totalChapters = 0;

        if (finalType === 'txt') {
            // Check encoding
            const encoding = await EncodingUtils.detectEncoding(destPath); // We copied it already, so check dest
            if (encoding === 'gbk') {
                // Warn user
                // For now, we continue but warn. Or we could stop and delete.
                // Let's just create it but warn.
                Alert.alert('Encoding Warning', 'This file appears to be GBK encoded. Automatic conversion is not yet supported. Text may appear scrambled. Please convert to UTF-8.');
            }
        }

        if (finalType === 'epub') {
            try {
                const tempId = `unique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await epubService.unzipBook(destPath, tempId);
                const bookStruct = await epubService.parseBook(tempId);
                if (bookStruct.metadata.title) title = bookStruct.metadata.title;
                if (bookStruct.metadata.author) author = bookStruct.metadata.author;
                if (bookStruct.metadata.cover) cover = bookStruct.metadata.cover;
                if (bookStruct.spine) totalChapters = bookStruct.spine.length;
            } catch (e) {
                console.warn('EPUB meta parse failed', e);
            }
        }

        await createBook.mutateAsync({
            title, author, cover, filePath: destPath, fileType: finalType,
            progress: 0, readingPosition: 0, currentChapterIndex: 0, currentScrollPosition: 0, totalChapters, lastRead: 0
        });

        return title;
    };

    const importFile = async (uri: string, name: string, copy = true) => {
        setIsImporting(true);
        try {
            const title = await performImport(uri, name, copy);
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: `Imported ${title}`
            });
            if (activeTab === 'scan') scanFiles();
        } catch (e) {
            console.error(e);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Import failed'
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handlePickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/epub+zip', 'text/plain', 'application/pdf', '*/*'], // Explicit types might help, or keep *
                copyToCacheDirectory: true,
                multiple: true // Enable multiple
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            setIsImporting(true);
            let successCount = 0;

            for (const file of result.assets) {
                try {
                    await performImport(file.uri, file.name, true);
                    successCount++;
                } catch (e) {
                    console.error('Failed to import', file.name, e);
                }
            }

            Toast.show({
                type: 'success',
                text1: 'Import Complete',
                text2: `Successfully imported ${successCount} files.`
            });
            if (activeTab === 'scan') scanFiles();

        } catch (e) {
            console.error(e);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'File picker failed'
            });
        } finally {
            setIsImporting(false);
        }
    };

    const renderTabButton = (id: ImportTab, label: string, icon: any) => {
        const isActive = activeTab === id;
        return (
            <TouchableOpacity onPress={() => setActiveTab(id)} style={{ flex: 1 }}>
                <Box
                    alignItems="center"
                    paddingVertical="m"
                    borderBottomWidth={isActive ? 2 : 0}
                    borderColor="primary"
                >
                    <Ionicons
                        name={icon}
                        size={24}
                        color={isActive ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <Text
                        variant="body"
                        color={isActive ? 'primary' : 'textSecondary'}
                        marginTop="xs"
                    >
                        {label}
                    </Text>
                </Box>
            </TouchableOpacity>
        );
    };

    return (
        <ScreenLayout>
            <Box flexDirection="row" alignItems="center" paddingHorizontal="m" paddingVertical="s" borderBottomWidth={1} borderColor="borderLight">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text variant="subheader" marginLeft="m">Import Books</Text>
            </Box>

            {/* Tabs */}
            <Box flexDirection="row" borderBottomWidth={1} borderColor="borderLight">
                {renderTabButton('local', 'Local File', 'document-text-outline')}
                {renderTabButton('wifi', 'WiFi Transfer', 'wifi-outline')}
                {renderTabButton('scan', 'File Scan', 'search-outline')}
            </Box>

            {/* Content Area */}
            <Box flex={1} padding="m">
                {/* LOCAL TAB */}
                {activeTab === 'local' && (
                    <Box flex={1} justifyContent="center" alignItems="center">
                        <TouchableOpacity onPress={handlePickFile}>
                            <Box
                                width={200} height={200}
                                backgroundColor="card"
                                alignItems="center" justifyContent="center"
                                borderRadius="l" borderWidth={1} borderColor="border"
                                shadowOpacity={0.1} shadowRadius={10} elevation={5}
                            >
                                <Ionicons name="folder-open" size={64} color={theme.colors.primary} />
                                <Text variant="subheader" marginTop="m">Pick File</Text>
                                <Text variant="caption" color="textSecondary" marginTop="s">From System Picker</Text>
                            </Box>
                        </TouchableOpacity>
                    </Box>
                )}

                {/* WIFI TAB */}
                {activeTab === 'wifi' && (
                    <Box flex={1}>
                        <WiFiTransferScreen />
                    </Box>
                )}

                {/* SCAN TAB */}
                {activeTab === 'scan' && (
                    <Box flex={1}>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="s">
                            <Text variant="subheader">Scanned Files</Text>
                            <Button title="Refresh" onPress={scanFiles} size="small" variant="outline" disabled={isScanning} />
                        </Box>

                        <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m" backgroundColor="card" padding="s" borderRadius="s">
                            <Text variant="body">Auto Discovery</Text>
                            <Switch
                                value={false}
                                onValueChange={(val) => {
                                    if (val) {
                                        Alert.alert('Auto Discovery', 'Started background scanning...');
                                        fileScanService.startAutoDiscovery((files) => setScannedFiles(files));
                                    }
                                }}
                            />
                        </Box>
                        <Box marginBottom="m">
                            <Button
                                title={Platform.OS === 'android' ? "Select Folder to Scan..." : "Select Files from Other Folders..."}
                                variant="outline"
                                onPress={async () => {
                                    if (Platform.OS === 'android') {
                                        try {
                                            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                                            if (permissions.granted) {
                                                const uri = permissions.directoryUri;
                                                setIsScanning(true);
                                                const files = await fileScanService.scanExternalDirectory(uri);
                                                setScannedFiles(files);
                                                setIsScanning(false);
                                            }
                                        } catch (e) {
                                            console.warn(e);
                                            Toast.show({
                                                type: 'error',
                                                text1: 'Error',
                                                text2: 'Failed to access folder'
                                            });
                                        }
                                    } else {
                                        // iOS
                                        Alert.alert(
                                            'iOS Folder Scan',
                                            'On iOS, direct folder scanning is restricted. Please use the "Local File" tab to pick multiple files from any folder.',
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                {
                                                    text: 'Go to Local Import',
                                                    onPress: () => setActiveTab('local')
                                                }
                                            ]
                                        );
                                    }
                                }}
                            />
                        </Box>

                        {isScanning ? (
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        ) : scannedFiles.length === 0 ? (
                            <Box flex={1} justifyContent="center" alignItems="center">
                                <Text variant="body" color="textSecondary">No new files in Documents folder.</Text>
                                <Text variant="caption" color="textTertiary" textAlign="center" marginTop="m">
                                    Files added via iTunes/Finder Sharing will appear here.
                                </Text>
                            </Box>
                        ) : (
                            <FlatList
                                data={scannedFiles}
                                keyExtractor={item => item.path}
                                renderItem={({ item }) => (
                                    <Box flexDirection="row" alignItems="center" backgroundColor="card" padding="m" marginBottom="s" borderRadius="s">
                                        <Ionicons
                                            name={item.name.endsWith('.epub') ? 'book-outline' : 'document-text-outline'}
                                            size={24} color={theme.colors.text}
                                        />
                                        <Box flex={1} marginLeft="m">
                                            <Text variant="body">{item.name}</Text>
                                            <Text variant="caption" color="textSecondary">{(item.size / 1024 / 1024).toFixed(2)} MB</Text>
                                        </Box>
                                        <Button
                                            title="Import"
                                            size="small"
                                            onPress={() => importFile(item.path, item.name, false)}
                                            disabled={isImporting}
                                        />
                                    </Box>
                                )}
                            />
                        )}
                    </Box>
                )}
            </Box>

            {/* Import Loading Overlay */}
            {isImporting && (
                <Box
                    position="absolute" top={0} left={0} right={0} bottom={0}
                    backgroundColor="overlay"
                    justifyContent="center" alignItems="center"
                >
                    <Box backgroundColor="background" padding="l" borderRadius="m">
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text marginTop="m">Importing...</Text>
                    </Box>
                </Box>
            )}
        </ScreenLayout>
    );
};

export default ImportScreen;
