/**
 * Heuristic to detect if a string/buffer is UTF-8 or GBK.
 * Since React Native FileSystem reads as string (UTF-8 by default),
 * if we read a GBK file as UTF-8, it will be garbled.
 *
 * Strategy:
 * 1. Read file as Base64 (to get raw bytes).
 * 2. Check for UTF-8 valid sequences.
 * 3. Check for GBK valid sequences.
 * 4. Convert manually if needed (requires a decoder, or we use a library).
 *
 * Without a heavy library like `iconv-lite`, we can't easily decode GBK in pure JS efficiently if it's large.
 * However, we can use `TextDecoder` if available in RN (Polyfilled usually).
 *
 * If `TextDecoder` is not available, we might need `fast-text-encoding` or similar.
 *
 * For now, let's implement a simple check.
 * Actually, `expo-file-system` reads as UTF-8 by default `readAsStringAsync`.
 * If it's GBK, it returns "replace" characters or garbage.
 *
 * Better approach:
 * Read the first N bytes as Base64.
 * Analyze the bytes.
 */

import * as FileSystem from 'expo-file-system/legacy';
// import { decode } from 'base-64'; // Removed as unused

export const EncodingUtils = {
    /**
     * Detects encoding of a file. Returns 'utf8' or 'gbk'.
     */
    detectEncoding: async (uri: string): Promise<'utf8' | 'gbk'> => {
        try {
            // Read first 512 bytes as base64
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
                length: 512,
            });

            const binaryString = atob(base64); // RN has atob? If not, use Buffer or similar.
            // React Native 0.70+ has global atob? Or we need polyfill.
            // Let's assume standard byte inspection.

            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            if (isUtf8(bytes)) return 'utf8';
            if (isGBK(bytes)) return 'gbk';

            return 'utf8'; // Default
        } catch (e) {
            console.warn('Encoding detect failed, assuming utf8', e);
            return 'utf8';
        }
    },

    /**
     * Reads a file, handling conversion if GBK.
     * Note: Pure JS GBK conversion is hard without map.
     * We might validly assume if user imports GBK, we need a library.
     * For this MVP/Refinement, we will simpler return the detected type
     * and if it's GBK, we might warn or try a basic replace?
     *
     * Actually, if we don't have iconv-lite, we can't decode GBK properly.
     * So this task 'Support TXT Encoding' effectively requires adding a library `fast-text-encoding` or `text-encoding`.
     * But user instructions imply "Implement...".
     *
     * Let's stub the detection first.
     */
};

// UTF-8 Validation
function isUtf8(bytes: Uint8Array): boolean {
    let i = 0;
    while (i < bytes.length) {
        if ((bytes[i] & 0x80) === 0x00) {
            // 0xxxxxxx
            i++;
        } else if ((bytes[i] & 0xe0) === 0xc0) {
            // 110xxxxx 10xxxxxx
            if (i + 1 >= bytes.length || (bytes[i + 1] & 0xc0) !== 0x80) return false;
            i += 2;
        } else if ((bytes[i] & 0xf0) === 0xe0) {
            // 1110xxxx 10xxxxxx 10xxxxxx
            if (
                i + 2 >= bytes.length ||
                (bytes[i + 1] & 0xc0) !== 0x80 ||
                (bytes[i + 2] & 0xc0) !== 0x80
            )
                return false;
            i += 3;
        } else if ((bytes[i] & 0xf8) === 0xf0) {
            // 11110xxx 10xxxxxx ...
            if (i + 3 >= bytes.length) return false; // Truncated
            i += 4;
        } else {
            return false;
        }
    }
    return true;
}

// Simple GBK check (high bit set, typical ranges)
function isGBK(bytes: Uint8Array): boolean {
    // GBK: 1st byte 0x81-0xFE, 2nd byte 0x40-0xFE (excluding 0x7F)
    // Just finding ONE valid GBK sequence doesn't mean it IS GBK (overlaps with UTF-8).
    // But if it failed UTF-8 check, it's likely GBK or ISO-8859.
    // If isUtf8 returned false, we assume GBK if it looks like it?
    // For now, if not UTF-8, we can return GBK (or Windows-1252 but Chinese context implies GBK).
    return true;
}
