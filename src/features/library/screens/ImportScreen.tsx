import React, { useState, useEffect } from 'react';
import { FlatList, ActivityIndicator, Alert, TouchableOpacity, Switch, Platform, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { FolderOpen, Wifi, Search, ChevronLeft, ChevronRight, FileText, BookOpen, HelpCircle, HardDrive } from 'lucide-react-native';
import { useTheme } from '@shopify/restyle';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

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

type ImportView = 'main' | 'wifi' | 'scan';

const ImportScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const createBook = useCreateBook();
    const [currentView, setCurrentView] = useState<ImportView>('main');

    // Scan State
    const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        if (currentView === 'scan') {
            scanFiles();
        }
    }, [currentView]);

    const scanFiles = async () => {
        setIsScanning(true);
        const files = await fileScanService.scanForNewFiles();
        setScannedFiles(files);
        setIsScanning(false);
    };

    /**
     * Shared Import Logic (unchanged)
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
            const encoding = await EncodingUtils.detectEncoding(destPath);
            if (encoding === 'gbk') {
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
                text1: t('import.success'),
                text2: t('import.success_msg', { title, defaultValue: `Imported ${title}` })
            });
            if (currentView === 'scan') scanFiles();
        } catch (e) {
            console.error(e);
            Toast.show({
                type: 'error',
                text1: t('import.error'),
                text2: t('import.failed_msg', { defaultValue: 'Import failed' })
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handlePickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/epub+zip', 'text/plain', 'application/pdf', '*/*'],
                copyToCacheDirectory: true,
                multiple: true
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
                text1: t('import.complete'),
                text2: t('import.imported_count', { count: successCount })
            });
            if (currentView === 'scan') scanFiles();

        } catch (e) {
            console.error(e);
            Toast.show({
                type: 'error',
                text1: t('import.error'),
                text2: 'File picker failed'
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleBackPress = () => {
        if (currentView === 'main') {
            navigation.goBack();
        } else {
            setCurrentView('main');
        }
    };

    // --- Components ---

    const ImportActionCard = ({ title, subtitle, icon, delay = 0, onPress }: any) => {
        const IconComponent = icon;
        return (
            <Animated.View entering={FadeInUp.delay(delay).duration(500)}>
                <TouchableOpacity onPress={onPress}>
                    <Box
                        flexDirection="row"
                        alignItems="center"
                        backgroundColor="cardPrimary"
                        padding="l"
                        borderRadius="xl"
                        marginBottom="m"
                        style={{
                            shadowColor: theme.colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.05,
                            shadowRadius: 12,
                            elevation: 2,
                            borderWidth: 1,
                            borderColor: theme.colors.border
                        }}
                    >
                        <Box
                            width={56}
                            height={56}
                            borderRadius="l"
                            alignItems="center"
                            justifyContent="center"
                            backgroundColor="mainBackground"
                            marginRight="m"
                        >
                            <IconComponent size={28} color={theme.colors.primary} strokeWidth={1.5} />
                        </Box>
                        <Box flex={1}>
                            <Text variant="subheader" fontSize={18} marginBottom="xs" color="textPrimary">{title}</Text>
                            <Text variant="body" color="textSecondary" fontSize={14}>{subtitle}</Text>
                        </Box>
                        <ChevronRight size={20} color={theme.colors.textTertiary} />
                    </Box>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const getHeaderTitle = () => {
        switch (currentView) {
            case 'wifi': return t('import.wifi.title');
            case 'scan': return t('import.scan.title');
            default: return t('import.header_title');
        }
    };

    return (
        <ScreenLayout>
            {/* Header */}
            <Box paddingHorizontal="l" paddingTop="m" paddingBottom="m">
                <TouchableOpacity onPress={handleBackPress} style={{ marginBottom: 16 }}>
                    <Box flexDirection="row" alignItems="center">
                        <ChevronLeft size={24} color={theme.colors.primary} />
                        <Text variant="body" color="primary" fontWeight="600" marginLeft="xs">
                            {currentView === 'main' ? t('import.bookshelf') : t('import.title')}
                        </Text>
                    </Box>
                </TouchableOpacity>

                <Animated.View entering={FadeInUp.duration(600)}>
                    <Text variant="header" fontSize={34} lineHeight={40} fontWeight="800" color="textPrimary">
                        {getHeaderTitle()}
                    </Text>
                    {currentView === 'main' && (
                        <Text variant="body" color="textSecondary" marginTop="s">
                            {t('import.subtitle')}
                        </Text>
                    )}
                </Animated.View>
            </Box>

            <Box flex={1} paddingHorizontal="l">
                {currentView === 'main' && (
                    <Box flex={1} paddingTop="m">
                        <ImportActionCard
                            title={t('import.methods.local')}
                            subtitle={t('import.methods.local_sub')}
                            icon={FolderOpen}
                            onPress={handlePickFile}
                            delay={100}
                        />
                        <ImportActionCard
                            title={t('import.methods.wifi')}
                            subtitle={t('import.methods.wifi_sub')}
                            icon={Wifi}
                            onPress={() => setCurrentView('wifi')}
                            delay={200}
                        />
                        <ImportActionCard
                            title={t('import.methods.scan')}
                            subtitle={t('import.methods.scan_sub')}
                            icon={Search}
                            onPress={() => setCurrentView('scan')}
                            delay={300}
                        />

                        {/* Footer Help */}
                        <Box flex={1} justifyContent="flex-end" paddingBottom="xl" alignItems="center">
                            <Box flexDirection="row" alignItems="center" opacity={0.6}>
                                <HelpCircle size={16} color={theme.colors.textSecondary} />
                                <Text variant="caption" color="textSecondary" marginLeft="xs">{t('import.supported_formats')}</Text>
                            </Box>
                        </Box>
                    </Box>
                )}

                {currentView === 'wifi' && (
                    <Box flex={1}>
                        <WiFiTransferScreen />
                    </Box>
                )}

                {currentView === 'scan' && (
                    <Box flex={1} paddingTop="s">
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="l">
                            <Text variant="body" fontWeight="600" color="textSecondary">{t('import.scan.available_files')}</Text>
                            <TouchableOpacity onPress={scanFiles} disabled={isScanning}>
                                <Box flexDirection="row" alignItems="center" backgroundColor="cardSecondary" paddingHorizontal="m" paddingVertical="xs" borderRadius="full">
                                    {isScanning && <ActivityIndicator size="small" color={theme.colors.textSecondary} style={{ marginRight: 6 }} />}
                                    <Text variant="caption" fontWeight="600">{t('import.scan.refresh')}</Text>
                                </Box>
                            </TouchableOpacity>
                        </Box>

                        {scannedFiles.length === 0 && !isScanning ? (
                            <Box flex={1} justifyContent="center" alignItems="center" opacity={0.6}>
                                <HardDrive size={48} color={theme.colors.textTertiary} strokeWidth={1} />
                                <Text variant="body" color="textSecondary" marginTop="m">{t('import.scan.no_files')}</Text>
                            </Box>
                        ) : (
                            <FlatList
                                data={scannedFiles}
                                keyExtractor={item => item.path}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 40 }}
                                renderItem={({ item, index }) => (
                                    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
                                        <Box
                                            flexDirection="row"
                                            alignItems="center"
                                            backgroundColor="cardPrimary"
                                            padding="m"
                                            marginBottom="s"
                                            borderRadius="l"
                                            borderBottomWidth={1}
                                            borderBottomColor="border"
                                        >
                                            <Box
                                                width={42} height={42}
                                                borderRadius="m"
                                                alignItems="center" justifyContent="center"
                                                backgroundColor="cardSecondary"
                                            >
                                                {item.name.endsWith('.epub') ?
                                                    <BookOpen size={22} color={theme.colors.primary} /> :
                                                    <FileText size={22} color={theme.colors.textSecondary} />
                                                }
                                            </Box>
                                            <Box flex={1} marginLeft="m">
                                                <Text variant="body" fontWeight="600" numberOfLines={1} color="textPrimary">{item.name}</Text>
                                                <Text variant="caption" color="textSecondary">{(item.size / 1024 / 1024).toFixed(2)} MB</Text>
                                            </Box>
                                            <TouchableOpacity onPress={() => importFile(item.path, item.name, false)} disabled={isImporting}>
                                                <Box backgroundColor="primary" paddingHorizontal="m" paddingVertical="s" borderRadius="full">
                                                    <Text variant="caption" fontWeight="bold" color="onPrimary">{t('import.scan.import_btn')}</Text>
                                                </Box>
                                            </TouchableOpacity>
                                        </Box>
                                    </Animated.View>
                                )}
                            />
                        )}
                    </Box>
                )}
            </Box>

            {/* Loading Overlay */}
            {isImporting && (
                <Box
                    position="absolute" top={0} left={0} right={0} bottom={0}
                    backgroundColor="overlay"
                    justifyContent="center" alignItems="center"
                >
                    <Box backgroundColor="modalBackground" padding="xl" borderRadius="l" alignItems="center" shadowColor="black" shadowOpacity={0.2} shadowRadius={20}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text variant="subheader" marginTop="m" fontWeight="600" color="textPrimary">{t('import.scan.importing')}</Text>
                        <Text variant="caption" color="textSecondary" marginTop="s">{t('import.scan.wait_msg')}</Text>
                    </Box>
                </Box>
            )}
        </ScreenLayout>
    );
};

export default ImportScreen;
