import * as FileSystem from 'expo-file-system/legacy';
import { BookRepository } from '../../../services/database';
import { getSafePath } from '../../../utils/PathUtils';

export interface ScannedFile {
    name: string;
    path: string;
    size: number;
    modificationTime: number;
    isDirectory: boolean;
    isImported: boolean;
}

class FileScanService {
    /**
     * Scan the documents directory for importable files.
     * Filters out system folders and already imported books.
     */
    async scanForNewFiles(): Promise<ScannedFile[]> {
        const docDir = FileSystem.documentDirectory;
        if (!docDir) return [];

        try {
            const files = await FileSystem.readDirectoryAsync(docDir);
            const scannedFiles: ScannedFile[] = [];

            // Get all existing book paths to check against
            const existingBooks = await BookRepository.getAll();
            const existingPaths = new Set(existingBooks.map(b => getSafePath(b.filePath)));

            for (const fileName of files) {
                // Ignore system folders and hidden files
                if (fileName.startsWith('.') || fileName === 'books' || fileName === 'RCTAsyncLocalStorage_V1') {
                    // Check if it is Inbox
                    if (fileName === 'Inbox') {
                        // Scan Inbox
                        try {
                            const inboxPath = docDir + 'Inbox/';
                            const inboxFiles = await FileSystem.readDirectoryAsync(inboxPath);
                            for (const inboxFile of inboxFiles) {
                                if (inboxFile.startsWith('.')) continue; // Ignore hidden in Inbox

                                const fullPath = inboxPath + inboxFile;
                                const info = await FileSystem.getInfoAsync(fullPath);
                                const lowercaseName = inboxFile.toLowerCase();

                                if (info.exists && !info.isDirectory &&
                                    (lowercaseName.endsWith('.txt') || lowercaseName.endsWith('.epub') || lowercaseName.endsWith('.pdf'))) {

                                    scannedFiles.push({
                                        name: inboxFile, // Or "Inbox/filename"? user just wants name
                                        path: fullPath,
                                        size: info.size || 0,
                                        modificationTime: info.modificationTime || 0,
                                        isDirectory: false,
                                        isImported: false
                                    });
                                }
                            }
                        } catch (inboxErr) {
                            console.log('[FileScanService] Inbox scan failed (might be empty or permission)', inboxErr);
                        }
                    }
                    continue;
                }

                const fullPath = docDir + fileName;
                const info = await FileSystem.getInfoAsync(fullPath);

                if (info.exists) {
                    const isDirectory = info.isDirectory;
                    const lowercaseName = fileName.toLowerCase();

                    // Filter extensions if it's a file
                    if (!isDirectory && !lowercaseName.endsWith('.txt') && !lowercaseName.endsWith('.epub') && !lowercaseName.endsWith('.pdf')) {
                        continue;
                    }

                    scannedFiles.push({
                        name: fileName,
                        path: fullPath,
                        size: info.size || 0,
                        modificationTime: info.modificationTime || 0,
                        isDirectory,
                        isImported: false
                    });
                }
            }

            return scannedFiles.sort((a, b) => b.modificationTime - a.modificationTime);

        } catch (e) {
            console.error('[FileScanService] Scan failed:', e);
            return [];
        }
    }
    /**
     * Scan a custom directory path
     */
    async scanCustomPath(path: string): Promise<ScannedFile[]> {
        // Validation: Ensure path is accessible?
        // In Expo, we can only access specific dirs. 
        // If user provides a full "content://" uri (Android) or file path, we try.
        try {
            // Basic Check
            const info = await FileSystem.getInfoAsync(path);
            if (!info.exists || !info.isDirectory) return [];

            // Reuse scan logic? Or simplified.
            // We'll interpret this as just reading directory
            const files = await FileSystem.readDirectoryAsync(path);
            const scannedFiles: ScannedFile[] = [];

            for (const fileName of files) {
                if (fileName.startsWith('.')) continue;
                const fullPath = path.endsWith('/') ? path + fileName : path + '/' + fileName;
                const fInfo = await FileSystem.getInfoAsync(fullPath);
                if (fInfo.exists && !fInfo.isDirectory) {
                    const lower = fileName.toLowerCase();
                    if (lower.endsWith('.epub') || lower.endsWith('.txt') || lower.endsWith('.pdf')) {
                        scannedFiles.push({
                            name: fileName,
                            path: fullPath,
                            size: fInfo.size || 0,
                            modificationTime: fInfo.modificationTime || 0,
                            isDirectory: false,
                            isImported: false
                        });
                    }
                }
            }
            return scannedFiles;
        } catch (e) {
            console.warn('Custom path scan failed', e);
            return [];
        }
    }

    /**
     * Scan external directory (Android SAF)
     */
    async scanExternalDirectory(uri: string): Promise<ScannedFile[]> {
        const scannedFiles: ScannedFile[] = [];
        try {
            // Read content from SAF URI
            const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(uri);

            for (const fileUri of files) {
                // Decode filename from URI if possible or just use a placeholder if unavailable?
                // SAF URIs are like content://.../document/primary:Download/book.epub
                // We can get name? Not easily without stat?
                // Let's generic name logic
                let name = decodeURIComponent(fileUri.split('%2F').pop() || 'Unknown');
                if (name.includes(':')) name = name.split(':').pop() || name;

                const lower = name.toLowerCase();
                if (lower.endsWith('.epub') || lower.endsWith('.txt') || lower.endsWith('.pdf')) {
                    scannedFiles.push({
                        name,
                        path: fileUri,
                        size: 0, // SAF might not give size easily in bulk without slow getInfo
                        modificationTime: 0,
                        isDirectory: false,
                        isImported: false
                    });
                }
            }
        } catch (e) {
            console.warn('SAF scan failed', e);
        }
        return scannedFiles;
    }

    /**
     * Auto Discovery Simulation
     */
    startAutoDiscovery(callback: (files: ScannedFile[]) => void) {
        // Poll every 10 seconds?
        const interval = setInterval(async () => {
            const files = await this.scanForNewFiles();
            if (files.length > 0) callback(files);
        }, 10000);
        return () => clearInterval(interval);
    }
}

export const fileScanService = new FileScanService();
