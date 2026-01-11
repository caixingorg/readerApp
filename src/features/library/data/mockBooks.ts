import { Book } from '@/services/database';

export const MOCK_BOOKS: Book[] = [
    {
        id: 'mock_1',
        title: 'The Design of Everyday Things',
        author: 'Don Norman',
        cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600&h=900',
        filePath: 'mock_path_1',
        fileType: 'epub',
        progress: 45,
        readingPosition: 1200,
        currentChapterIndex: 3,
        currentScrollPosition: 0.2,
        totalChapters: 12,
        lastRead: Date.now() - 3600000 * 2, // 2 hours ago
        createdAt: Date.now() - 86400000 * 5,
        updatedAt: Date.now(),
        size: 1024 * 1024 * 2.5
    },
    {
        id: 'mock_2',
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600&h=900',
        filePath: 'mock_path_2',
        fileType: 'epub',
        progress: 12,
        readingPosition: 500,
        currentChapterIndex: 1,
        currentScrollPosition: 0.1,
        totalChapters: 38,
        lastRead: Date.now() - 86400000 * 1, // 1 day ago
        createdAt: Date.now() - 86400000 * 10,
        updatedAt: Date.now(),
        size: 1024 * 1024 * 3.8
    },
    {
        id: 'mock_3',
        title: 'Deep Work',
        author: 'Cal Newport',
        cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600&h=900',
        filePath: 'mock_path_3',
        fileType: 'pdf',
        progress: 88,
        readingPosition: 4000,
        currentChapterIndex: 0,
        currentScrollPosition: 0,
        totalChapters: 1,
        lastRead: Date.now() - 86400000 * 3, // 3 days ago
        createdAt: Date.now() - 86400000 * 20,
        updatedAt: Date.now(),
        size: 1024 * 1024 * 5.2
    },
    {
        id: 'mock_4',
        title: 'Atomic Habits',
        author: 'James Clear',
        cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=600&h=900',
        filePath: 'mock_path_4',
        fileType: 'epub',
        progress: 0,
        readingPosition: 0,
        currentChapterIndex: 0,
        currentScrollPosition: 0,
        totalChapters: 20,
        lastRead: 0,
        createdAt: Date.now() - 86400000 * 30,
        updatedAt: Date.now(),
        size: 1024 * 1024 * 1.8
    },
    {
        id: 'mock_5',
        title: 'Steve Jobs',
        author: 'Walter Isaacson',
        cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600&h=900',
        filePath: 'mock_path_5',
        fileType: 'epub',
        progress: 100,
        readingPosition: 99999,
        currentChapterIndex: 42,
        currentScrollPosition: 1,
        totalChapters: 42,
        lastRead: Date.now() - 86400000 * 100,
        createdAt: Date.now() - 86400000 * 120,
        updatedAt: Date.now(),
        size: 1024 * 1024 * 8.5
    }
];
