// Book model
export interface Book {
    id: string;
    title: string;
    author: string;
    cover?: string;
    filePath: string;
    fileType: 'txt' | 'epub';
    progress: number;        // 0-100
    readingPosition: number; // 滚动位置（像素）
    currentChapterIndex: number; // 当前章节索引 (EPUB)
    currentScrollPosition: number; // 当前章节滚动百分比 0-1 (EPUB)
    totalChapters: number;   // 总章节数 (EPUB)
    lastRead: number;        // timestamp
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
