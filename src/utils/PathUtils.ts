import * as FileSystem from 'expo-file-system/legacy';

/**
 * Helper to handle iOS Sandbox UUID changes.
 * The app container path changes on every fresh install (dev build) or update, 
 * invalidating absolute paths stored in DB.
 * 
 * @param storedPath The absolute path stored in the database.
 * @returns A safe, reconstructed path based on the current sandbox.
 */
export const getSafePath = (storedPath: string | null | undefined): string => {
    if (!storedPath) return '';

    // If it's a web URL or asset ID, return as is
    if (storedPath.startsWith('http') || storedPath.startsWith('asset-library://')) {
        return storedPath;
    }

    // Logic for 'books' directory in DocumentDirectory
    if (storedPath.includes('/books/')) {
        const fileName = storedPath.split('/books/').pop();
        if (fileName) {
            // Reconstruct path using CURRENT sandbox location
            return FileSystem.documentDirectory + 'books/' + fileName;
        }
    }

    // Future logic for cache or other folders can go here

    return storedPath;
};
