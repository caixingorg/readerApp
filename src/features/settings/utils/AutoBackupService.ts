import * as FileSystem from 'expo-file-system/legacy';
import { DataExportService } from './DataExportService';
import { useReaderSettings } from '../../reader/stores/useReaderSettings';
import { BookRepository } from '../../../services/database/BookRepository';
import { NoteRepository } from '../../../services/database/NoteRepository';
import { BookmarkRepository } from '../../../services/database/BookmarkRepository';
import { ReadingSessionRepository } from '../../../services/database/ReadingSessionRepository';

const BACKUP_DIR = FileSystem.documentDirectory + 'backups/';
const MAX_BACKUPS = 5;

export const AutoBackupService = {
    async init() {
        try {
            const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
            }
            this.checkAndBackup();
        } catch (e) {
            console.error('Failed to init AutoBackupService', e);
        }
    },

    async checkAndBackup() {
        const { autoBackupEnabled, lastBackupTime, setLastBackupTime } = useReaderSettings.getState();

        if (!autoBackupEnabled) return;

        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (lastBackupTime && (now - lastBackupTime < oneDay)) {
            // Less than 24 hours since last backup
            return;
        }

        await this.performBackup();
        setLastBackupTime(now);
    },

    async performBackup() {
        try {

            const books = await BookRepository.getAll();
            const notes = await NoteRepository.getAll();
            const bookmarks = await BookmarkRepository.getAll();
            const sessions = await ReadingSessionRepository.getAll();

            const exportData = {
                version: 1,
                timestamp: Date.now(),
                type: 'auto-backup',
                books,
                notes,
                bookmarks,
                sessions
            };

            const json = JSON.stringify(exportData, null, 2);
            const fileName = `auto_backup_${Date.now()}.json`;
            const filePath = `${BACKUP_DIR}${fileName}`;

            await FileSystem.writeAsStringAsync(filePath, json, {
                encoding: FileSystem.EncodingType.UTF8
            });

            await this.pruneBackups();
        } catch (error) {
            console.error('Auto backup failed:', error);
        }
    },

    async pruneBackups() {
        try {
            const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
            const backupFiles = files
                .filter(f => f.startsWith('auto_backup_') && f.endsWith('.json'))
                .sort(); // Sorts by timestamp in filename (assumes consistently named)

            if (backupFiles.length > MAX_BACKUPS) {
                const toDelete = backupFiles.slice(0, backupFiles.length - MAX_BACKUPS);
                for (const file of toDelete) {
                    await FileSystem.deleteAsync(BACKUP_DIR + file, { idempotent: true });
                }
            }
        } catch (e) {
            console.error('Prune backups failed', e);
        }
    }
};
