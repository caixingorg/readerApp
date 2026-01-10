import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';

const TABLE_NAME = 'search_history';

export interface SearchHistoryItem {
    id: string;
    query: string;
    createdAt: number;
}

export const SearchHistoryRepository = {
    /**
     * Add or update a search query (moves to top if exists)
     */
    async add(query: string): Promise<void> {
        const db = await getDatabase();
        const normalizedQuery = query.trim();
        if (!normalizedQuery) return;

        const now = Date.now();

        // Uplift if exists, or Insert
        await db.runAsync(
            `INSERT INTO ${TABLE_NAME} (id, query, created_at)
             VALUES (?, ?, ?)
             ON CONFLICT(query) DO UPDATE SET created_at = ?`,
            [Crypto.randomUUID(), normalizedQuery, now, now]
        );
    },

    /**
     * Get recent search history
     */
    async getAll(limit = 20): Promise<string[]> {
        const db = await getDatabase();
        const rows = await db.getAllAsync<any>(
            `SELECT query FROM ${TABLE_NAME} ORDER BY created_at DESC LIMIT ?`,
            [limit]
        );
        return rows.map(row => row.query);
    },

    /**
     * Delete a specific query
     */
    async delete(query: string): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(`DELETE FROM ${TABLE_NAME} WHERE query = ?`, [query]);
    },

    /**
     * Clear all history
     */
    async clear(): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(`DELETE FROM ${TABLE_NAME}`);
    }
};
