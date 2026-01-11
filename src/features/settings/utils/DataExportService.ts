import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import { BookRepository } from '@/services/database/BookRepository';
import { NoteRepository } from '@/services/database/NoteRepository';
import { BookmarkRepository } from '@/services/database/BookmarkRepository';
import { ReadingSessionRepository } from '@/services/database/ReadingSessionRepository';
import i18n from '@/i18n';

export const DataExportService = {
    async exportData() {
        try {
            const books = await BookRepository.getAll();
            const notes = await NoteRepository.getAll();
            const bookmarks = await BookmarkRepository.getAll();
            const sessions = await ReadingSessionRepository.getAll();

            const exportData = {
                version: 1,
                timestamp: Date.now(),
                books,
                notes,
                bookmarks,
                sessions
            };

            const json = JSON.stringify(exportData, null, 2);
            const fileName = `reader_backup_${new Date().toISOString().split('T')[0]}.json`;
            const filePath = `${FileSystem.documentDirectory}${fileName} `;

            await FileSystem.writeAsStringAsync(filePath, json, {
                encoding: FileSystem.EncodingType.UTF8
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath);
            } else {
                Toast.show({
                    type: 'success',
                    text1: i18n.t('settings.data.export_success'),
                    text2: i18n.t('settings.data.export_saved_to', { path: filePath })
                });
            }
        } catch (error) {
            console.error('Export failed:', error);
            Toast.show({
                type: 'error',
                text1: i18n.t('settings.data.export_failed'),
                text2: i18n.t('settings.data.export_error_msg')
            });
        }
    },

    async importData() {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const fileUri = result.assets[0].uri;
            const fileContent = await FileSystem.readAsStringAsync(fileUri);
            const data = JSON.parse(fileContent);

            if (!data.books || !Array.isArray(data.books)) {
                throw new Error('Invalid backup file format');
            }

            // Import Books
            for (const book of data.books) {
                await BookRepository.restore(book);
            }

            // Import Notes
            if (data.notes && Array.isArray(data.notes)) {
                for (const note of data.notes) {
                    await NoteRepository.restore(note);
                }
            }

            // Import Bookmarks
            if (data.bookmarks && Array.isArray(data.bookmarks)) {
                for (const bookmark of data.bookmarks) {
                    await BookmarkRepository.restore(bookmark);
                }
            }

            // Import Sessions
            if (data.sessions && Array.isArray(data.sessions)) {
                for (const session of data.sessions) {
                    await ReadingSessionRepository.restore(session);
                }
            }

            Toast.show({
                type: 'success',
                text1: i18n.t('settings.data.import_success'),
                text2: i18n.t('settings.data.import_success_msg')
            });
        } catch (error) {
            console.error('Import failed:', error);
            Toast.show({
                type: 'error',
                text1: i18n.t('settings.data.import_failed'),
                text2: (error as Error).message
            });
        }
    }
};
