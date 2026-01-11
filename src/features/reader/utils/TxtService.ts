import { EpubChapter } from '@/features/reader/utils/EpubService';

export class TxtService {
    /**
     * Parse chapters from TXT content using regex.
     * Maps chapters to character offsets (or line numbers if preferred, but char index is easier with string).
     *
     * @param content Full TXT content
     * @returns Array of chapters with href as 'txt://offset'
     */
    parseChapters(content: string): EpubChapter[] {
        const chapters: EpubChapter[] = [];

        // Regex for Chinese chapters: 第 + (chinese/arabic numbers) + 章/回/节/卷 + (optional title)
        // Matches: "第1章", "第一章 序言", "Chapter 1"
        const chapterRegex =
            /(?:第[0-9一二三四五六七八九十百千]+[章回节卷集][^\n\r]*)|(?:Chapter\s+[0-9]+[^\n\r]*)/g;

        let match;
        let index = 0;

        while ((match = chapterRegex.exec(content)) !== null) {
            // match.index is the character offset
            chapters.push({
                id: `txt_chapter_${index}`,
                label: match[0].trim(),
                href: `txt://${match.index}`, // Custom protocol to distinguish from file paths
                subitems: [],
            });
            index++;
        }

        // If no chapters found, add a default one
        if (chapters.length === 0) {
            chapters.push({
                id: 'txt_default',
                label: '开始阅读',
                href: 'txt://0',
                subitems: [],
            });
        }

        return chapters;
    }
    /**
     * Generate virtual chapters for large files based on chunk size.
     *
     * @param totalSize Total file size in bytes
     * @param chunkSize Chunk size in bytes (default 100KB)
     */
    getVirtualChapters(totalSize: number, chunkSize: number = 100 * 1024): EpubChapter[] {
        const chapters: EpubChapter[] = [];
        const totalChunks = Math.ceil(totalSize / chunkSize);

        for (let i = 0; i < totalChunks; i++) {
            chapters.push({
                id: `txt_chunk_${i}`,
                label: `Section ${i + 1}`,
                href: `txtchunk://${i * chunkSize}?len=${chunkSize}`, // txtchunk://START?len=LENGTH
                subitems: [],
            });
        }
        return chapters;
    }
}

export const txtService = new TxtService();
