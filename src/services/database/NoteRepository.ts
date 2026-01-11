import * as SQLite from 'expo-sqlite';
import { getDatabase } from './database';
import { Note } from './types';

const TABLE_NAME = 'notes';

export const NoteRepository = {
    /**
     * Create a new note/highlight
     */
    async create(note: Note): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(
            `INSERT INTO ${TABLE_NAME} (id, book_id, cfi, full_text, note, color, type, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                note.id,
                note.bookId,
                note.cfi,
                note.fullText,
                note.note ?? null,
                note.color,
                note.type,
                note.createdAt,
            ],
        );
    },

    /**
     * Get all notes for a specific book
     */
    async getByBookId(bookId: string): Promise<Note[]> {
        const db = await getDatabase();
        const rows = await db.getAllAsync<any>(
            `SELECT * FROM ${TABLE_NAME} WHERE book_id = ? ORDER BY created_at DESC`,
            [bookId],
        );

        return rows.map((row) => ({
            id: row.id,
            bookId: row.book_id,
            cfi: row.cfi,
            fullText: row.full_text,
            note: row.note,
            color: row.color,
            type: row.type,
            createdAt: row.created_at,
        }));
    },

    /**
     * Get all notes
     */
    async getAll(): Promise<Note[]> {
        const db = await getDatabase();
        const rows = await db.getAllAsync<any>(
            `SELECT * FROM ${TABLE_NAME} ORDER BY created_at DESC`,
        );

        return rows.map((row) => ({
            id: row.id,
            bookId: row.book_id,
            cfi: row.cfi,
            fullText: row.full_text,
            note: row.note,
            color: row.color,
            type: row.type,
            createdAt: row.created_at,
        }));
    },

    /**
     * Delete a note
     */
    async delete(id: string): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(`DELETE FROM ${TABLE_NAME} WHERE id = ?`, [id]);
    },

    /**
     * Update a note (e.g. edit text or color)
     */
    async update(id: string, updates: Partial<Note>): Promise<void> {
        const db = await getDatabase();
        // Construct query dynamically
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.note !== undefined) {
            fields.push('note = ?');
            values.push(updates.note);
        }
        if (updates.color !== undefined) {
            fields.push('color = ?');
            values.push(updates.color);
        }

        if (fields.length === 0) return;

        values.push(id);

        await db.runAsync(`UPDATE ${TABLE_NAME} SET ${fields.join(', ')} WHERE id = ?`, values);
    },
    /**
     * Restore a note from backup
     */
    async restore(note: Note): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(
            `INSERT OR REPLACE INTO ${TABLE_NAME} (id, book_id, cfi, full_text, note, color, type, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                note.id,
                note.bookId,
                note.cfi,
                note.fullText,
                note.note ?? null,
                note.color,
                note.type,
                note.createdAt,
            ],
        );
    },
};
