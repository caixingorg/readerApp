// Book model
export interface Book {
    id: string;
    title: string;
    author: string;
    cover?: string;
    filePath: string;
    fileType: 'txt' | 'epub' | 'pdf';
    progress: number;        // 0-100
    readingPosition: number; // 滚动位置（像素）
    currentChapterIndex: number; // 当前章节索引 (EPUB)
    currentScrollPosition: number; // 当前章节滚动百分比 0-1 (EPUB)
    totalChapters: number;   // 总章节数 (EPUB)
    lastRead: number;        // timestamp
    lastPositionCfi?: string; // EPUB CFI string
    size?: number;           // File size in bytes
    createdAt: number;
    updatedAt: number;
}

// Reading Session model
export interface ReadingSession {
    id: string;
    bookId: string;
    startTime: number;
    duration: number;        // seconds
    createdAt: number;
}

export interface Bookmark {
    id: string;
    bookId: string;
    // Location data - we store multiple formats to support different engines
    cfi?: string;      // EPUB CFI
    page?: number;     // PDF Page
    offset?: number;   // TXT Character Offset

    percentage: number; // 0-100 for progress bar
    previewText?: string; // Short text snippet
    createdAt: number;
}

export interface Note {
    id: string;
    bookId: string;
    cfi: string; // EPS "epubcfi(...)" or TXT "start,end"
    fullText: string; // Selected text content
    note?: string; // User written note
    color: string; // Hex color
    type: 'highlight' | 'note';
    createdAt: number;
}
