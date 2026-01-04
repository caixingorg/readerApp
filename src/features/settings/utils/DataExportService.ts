import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { BookRepository } from '../../../services/database/BookRepository';
import { NoteRepository } from '../../../services/database/NoteRepository';
import { BookmarkRepository } from '../../../services/database/BookmarkRepository';
import { ReadingSessionRepository } from '../../../services/database/ReadingSessionRepository';
import { Alert } from 'react-native';

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
            const filePath = `${FileSystem.documentDirectory}${fileName}`;

            await FileSystem.writeAsStringAsync(filePath, json, {
                encoding: FileSystem.EncodingType.UTF8
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath);
            } else {
                Alert.alert('导出成功', `文件已保存至: ${filePath}`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            Alert.alert('导出失败', '无法导出数据');
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

            Alert.alert('导入成功', '数据已恢复');
        } catch (error) {
            console.error('Import failed:', error);
            Alert.alert('导入失败', '无法恢复数据: ' + (error as Error).message);
        }
    }
};
