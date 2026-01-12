import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { fileScanService, ScannedFile } from '@/features/library/utils/FileScanService';
import { useFileImport } from '@/features/library/hooks/useFileImport';

export type ImportView = 'main' | 'wifi' | 'scan';

export const useImportLogic = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const [currentView, setCurrentView] = useState<ImportView>('main');
    const { importFile: baseImportFile, pickDocument, isImporting } = useFileImport();

    const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    const scanFiles = useCallback(async () => {
        setIsScanning(true);
        try {
            const files = await fileScanService.scanForNewFiles();
            setScannedFiles(files);
        } catch (error) {
            console.error('[ImportLogic] Scan failed:', error);
        } finally {
            setIsScanning(false);
        }
    }, []);

    useEffect(() => {
        if (currentView === 'scan') {
            scanFiles();
        }
    }, [currentView, scanFiles]);

    const handleBackPress = useCallback(() => {
        if (currentView === 'main') {
            navigation.goBack();
        } else {
            setCurrentView('main');
        }
    }, [currentView, navigation]);

    const importFile = useCallback(
        async (path: string, name: string) => {
            await baseImportFile(path, name, false, () => {
                if (currentView === 'scan') scanFiles();
            });
        },
        [baseImportFile, currentView, scanFiles],
    );

    return {
        currentView,
        setCurrentView,
        scannedFiles,
        isScanning,
        isImporting,
        scanFiles,
        handleBackPress,
        pickDocument,
        importFile,
    };
};
