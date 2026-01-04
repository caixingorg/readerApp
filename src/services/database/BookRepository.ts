import { getDatabase } from './database';
import { Book } from './types';

/**
 * Repository for managing books in the database
 */
export class BookRepository {
    /**
     * Get all books
     */
    static async getAll(): Promise<Book[]> {
        const db = await getDatabase();
        const result = await db.getAllAsync<any>(
            'SELECT * FROM books ORDER BY last_read DESC'
        );
        return result.map(this.mapToBook);
    }

    /**
     * Get a book by ID
     */
    static async getById(id: string): Promise<Book | null> {
        const db = await getDatabase();
        const result = await db.getFirstAsync<any>(
            'SELECT * FROM books WHERE id = ?',
            [id]
        );
        return result ? this.mapToBook(result) : null;
    }

    /**
     * Create a new book
     */
    static async create(data: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const db = await getDatabase();
        const id = `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();

        await db.runAsync(
            `INSERT INTO books (
        id, title, author, cover, file_path, file_type, 
        progress, reading_position, 
        current_chapter_index, current_scroll_position, total_chapters,
        last_read, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.title,
                data.author,
                data.cover || null,
                data.filePath,
                data.fileType,
                data.progress || 0,
                data.readingPosition || 0,
                data.currentChapterIndex || 0,
                data.currentScrollPosition || 0,
                data.totalChapters || 0,
                data.lastRead || 0,
                now,
                now
            ]
        );

        return id;
    }

    /**
     * Update a book's progress or other details
     */
    static async update(id: string, data: Partial<Omit<Book, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
        const db = await getDatabase();
        const updates: string[] = [];
        const values: any[] = [];

        if (data.title !== undefined) {
            updates.push('title = ?');
            values.push(data.title);
        }
        if (data.author !== undefined) {
            updates.push('author = ?');
            values.push(data.author);
        }
        if (data.cover !== undefined) {
            updates.push('cover = ?');
            values.push(data.cover);
        }
        if (data.progress !== undefined) {
            updates.push('progress = ?');
            values.push(data.progress);
        }
        if (data.readingPosition !== undefined) {
            updates.push('reading_position = ?');
            values.push(data.readingPosition);
        }
        if (data.currentChapterIndex !== undefined) {
            updates.push('current_chapter_index = ?');
            values.push(data.currentChapterIndex);
        }
        if (data.currentScrollPosition !== undefined) {
            updates.push('current_scroll_position = ?');
            values.push(data.currentScrollPosition);
        }
        if (data.totalChapters !== undefined) {
            updates.push('total_chapters = ?');
            values.push(data.totalChapters);
        }
        if (data.lastRead !== undefined) {
            updates.push('last_read = ?');
            values.push(data.lastRead);
        }

        updates.push('updated_at = ?');
        values.push(Date.now());

        values.push(id);

        if (updates.length > 0) {
            await db.runAsync(
                `UPDATE books SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }
    }

    /**
     * Delete a book
     */
    static async delete(id: string): Promise<void> {
        const db = await getDatabase();
        await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
    }

    /**
     * Delete all books
     */
    static async deleteAll(): Promise<void> {
        const db = await getDatabase();
        await db.runAsync('DELETE FROM books');
    }

    /**
     * Map database row to Book object
     */
    private static mapToBook(row: any): Book {
        return {
            id: row.id,
            title: row.title,
            author: row.author,
            cover: row.cover,
            filePath: row.file_path,
            fileType: row.file_type as 'txt' | 'epub',
            progress: row.progress || 0,
            readingPosition: row.reading_position || 0,
            currentChapterIndex: row.current_chapter_index || 0,
            currentScrollPosition: row.current_scroll_position || 0,
            totalChapters: row.total_chapters || 0,
            lastRead: row.last_read || 0,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    /**
     * Restore a book from backup
     */
    static async restore(book: Book): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(
            `INSERT OR REPLACE INTO books (
                id, title, author, cover, file_path, file_type, 
                progress, reading_position, 
                current_chapter_index, current_scroll_position, total_chapters,
                last_read, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                book.id,
                book.title,
                book.author,
                book.cover || null,
                book.filePath,
                book.fileType,
                book.progress || 0,
                book.readingPosition || 0,
                book.currentChapterIndex || 0,
                book.currentScrollPosition || 0,
                book.totalChapters || 0,
                book.lastRead || 0,
                book.createdAt,
                book.updatedAt
            ]
        );
    }
}
