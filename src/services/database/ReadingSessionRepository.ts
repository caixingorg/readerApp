import { getDatabase } from './database';
import * as Crypto from 'expo-crypto';

export class ReadingSessionRepository {

    static async createSession(bookId: string, durationSeconds: number): Promise<void> {
        if (durationSeconds <= 0) return;

        const db = await getDatabase();
        const id = Crypto.randomUUID();
        const now = Date.now();
        const startTime = now - (durationSeconds * 1000);

        try {
            await db.runAsync(
                `INSERT INTO reading_sessions (id, book_id, start_time, duration, created_at) VALUES (?, ?, ?, ?, ?)`,
                [id, bookId, startTime, durationSeconds, now]
            );
        } catch (e) {
            console.error('Failed to create reading session', e);
        }
    }

    static async getTotalReadingTime(): Promise<number> {
        try {
            const db = await getDatabase();
            const result = await db.getAllAsync<{ total: number }>('SELECT SUM(duration) as total FROM reading_sessions');
            return result[0]?.total || 0;
        } catch (e) {
            console.warn('Failed to get reading stats', e);
            return 0;
        }
    }

    static async getDailyReadingStats(days: number = 7): Promise<{ date: string; seconds: number }[]> {
        try {
            const db = await getDatabase();
            const now = new Date();
            // Calculate start timestamp (days ago)
            const cutoffDate = new Date();
            cutoffDate.setDate(now.getDate() - days);
            const cutoffTimestamp = cutoffDate.getTime();

            const result = await db.getAllAsync<any>(
                'SELECT created_at, duration FROM reading_sessions WHERE created_at >= ?',
                [cutoffTimestamp]
            );

            const stats: Record<string, number> = {};

            // Initialize last 'days' days with 0
            for (let i = 0; i < days; i++) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const key = d.toISOString().split('T')[0];
                stats[key] = 0;
            }

            result.forEach(row => {
                const date = new Date(row.created_at).toISOString().split('T')[0];
                if (stats[date] !== undefined) {
                    stats[date] += (row.duration || 0);
                }
            });

            return Object.entries(stats)
                .map(([date, seconds]) => ({ date, seconds }))
                .sort((a, b) => a.date.localeCompare(b.date));
        } catch (e) {
            console.warn('Failed to get daily stats', e);
            return [];
        }
    }

    static async getAll(): Promise<any[]> {
        try {
            const db = await getDatabase();
            return await db.getAllAsync('SELECT * FROM reading_sessions');
        } catch (e) {
            console.warn('Failed to get all sessions', e);
            return [];
        }
    }
    static async restore(session: any): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(
            `INSERT OR REPLACE INTO reading_sessions (id, book_id, start_time, duration, created_at) VALUES (?, ?, ?, ?, ?)`,
            [
                session.id,
                session.book_id || session.bookId, // Handle both snake_case (DB) and camelCase (if mapped)
                session.start_time || session.startTime,
                session.duration,
                session.created_at || session.createdAt
            ]
        );
    }
}
