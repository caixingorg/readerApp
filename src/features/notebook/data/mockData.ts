import { Book, Bookmark } from '@/services/database/types';

export const MOCK_NOTEBOOK_BOOKS: Record<string, Book> = {
    mock1: {
        id: 'mock1',
        title: 'The Design of Everyday Things',
        author: 'Don Norman',
        cover: 'https://m.media-amazon.com/images/I/410RTQezHYL._AC_SY400_.jpg',
        totalChapters: 10,
        currentChapterIndex: 2,
        progress: 25,
        lastRead: Date.now(),
        filePath: '',
        fileType: 'epub',
        readingPosition: 0,
        currentScrollPosition: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    mock2: {
        id: 'mock2',
        title: 'Start with Why',
        author: 'Simon Sinek',
        cover: 'https://m.media-amazon.com/images/I/71qG4G4+yFL._AC_UY436_FMwebp_QL65_.jpg',
        totalChapters: 5,
        currentChapterIndex: 0,
        progress: 10,
        lastRead: Date.now(),
        filePath: '',
        fileType: 'epub',
        readingPosition: 0,
        currentScrollPosition: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
};

export const MOCK_NOTEBOOK_ITEMS = [
    {
        type: 'highlight',
        date: Date.now(),
        data: {
            id: 'm1',
            bookId: 'mock1',
            type: 'highlight',
            fullText:
                'Good design is actually a lot harder to notice than poor design, in part because good designs fit our needs so well that the design is invisible.',
            color: '#FCD34D',
            createdAt: Date.now(),
            cfi: '',
            note: '',
        },
    },
    {
        type: 'note',
        date: Date.now() - 100000,
        data: {
            id: 'm2',
            bookId: 'mock1',
            type: 'note',
            fullText:
                'A brilliant solution to the wrong problem can be worse than no solution at all.',
            note: 'This reminds me of the project I worked on last year.',
            color: '#34D399',
            createdAt: Date.now() - 100000,
            cfi: '',
        },
    },
    {
        type: 'bookmark',
        date: Date.now() - 200000,
        data: {
            id: 'm3',
            bookId: 'mock2',
            previewText: 'People don’t buy what you do; they buy why you do it.',
            percentage: 12,
            page: 45,
            createdAt: Date.now() - 200000,
            cfi: '',
        } as Bookmark,
    },
];
