import { useState } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { useCreateBook } from '@/features/library/hooks/useBooks';
import { epubService } from '@/features/reader/utils/EpubService';
import { EncodingUtils } from '@/features/reader/utils/EncodingUtils';
import { fileScanService } from '@/features/library/utils/FileScanService';

export const useFileImport = () => {
    const { t } = useTranslation();
    const createBook = useCreateBook();
    const [isImporting, setIsImporting] = useState(false);

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

    const importFile = async (uri: string, name: string, copy = true, onSuccess?: () => void) => {
        setIsImporting(true);
        try {
            const title = await performImport(uri, name, copy);
            Toast.show({
                type: 'success',
                text1: t('import.success'),
                text2: t('import.success_msg', { title, defaultValue: `Imported ${title}` })
            });
            if (onSuccess) onSuccess();
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

    const pickDocument = async (onSuccess?: () => void) => {
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
            if (onSuccess) onSuccess();

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

    return {
        isImporting,
        importFile,
        pickDocument
    };
};
