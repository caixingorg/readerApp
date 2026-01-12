import { getDatabase } from './database';
import { Bookmark } from './types';

const TABLE_NAME = 'bookmarks';

export const BookmarkRepository = {
    /**
     * Create a new bookmark
     */
    async create(bookmark: Bookmark): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(
            `INSERT INTO ${TABLE_NAME} (id, book_id, cfi, page, offset, percentage, preview_text, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                bookmark.id,
                bookmark.bookId,
                bookmark.cfi ?? null,
                bookmark.page ?? null,
                bookmark.offset ?? null,
                bookmark.percentage,
                bookmark.previewText ?? '',
                bookmark.createdAt,
            ],
        );
    },

    /**
     * Get all bookmarks for a specific book
     */
    async getByBookId(bookId: string): Promise<Bookmark[]> {
        const db = await getDatabase();
        const rows = await db.getAllAsync<any>(
            `SELECT * FROM ${TABLE_NAME} WHERE book_id = ? ORDER BY created_at DESC`,
            [bookId],
        );

        return rows.map((row) => ({
            id: row.id,
            bookId: row.book_id,
            cfi: row.cfi,
            page: row.page,
            offset: row.offset,
            percentage: row.percentage,
            previewText: row.preview_text,
            createdAt: row.created_at,
        }));
    },

    /**
     * Get all bookmarks
     */
    async getAll(): Promise<Bookmark[]> {
        const db = await getDatabase();
        const rows = await db.getAllAsync<any>(
            `SELECT * FROM ${TABLE_NAME} ORDER BY created_at DESC`,
        );

        return rows.map((row) => ({
            id: row.id,
            bookId: row.book_id,
            cfi: row.cfi,
            page: row.page,
            offset: row.offset,
            percentage: row.percentage,
            previewText: row.preview_text,
            createdAt: row.created_at,
        }));
    },

    /**
     * Delete a bookmark
     */
    async delete(id: string): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
    },

    /**
     * Update a bookmark (partial update)
     */
    async update(id: string, updates: Partial<Bookmark>): Promise<void> {
        const db = await getDatabase();

        // Build query dynamically based on updates
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.previewText !== undefined) {
            fields.push('preview_text = ?');
            values.push(updates.previewText);
        }

        // Add other fields if needed in future

        if (fields.length === 0) return;

        values.push(id);

        await db.runAsync(`UPDATE ${TABLE_NAME} SET ${fields.join(', ')} WHERE id = ?`, values);
    },

    /**
     * Restore a bookmark from backup
     */
    async restore(bookmark: Bookmark): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(
            `INSERT OR REPLACE INTO ${TABLE_NAME} (id, book_id, cfi, page, offset, percentage, preview_text, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                bookmark.id,
                bookmark.bookId,
                bookmark.cfi ?? null,
                bookmark.page ?? null,
                bookmark.offset ?? null,
                bookmark.percentage,
                bookmark.previewText ?? '',
                bookmark.createdAt,
            ],
        );
    },
};
