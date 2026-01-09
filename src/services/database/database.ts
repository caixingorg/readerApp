import * as SQLite from 'expo-sqlite';

let database: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the SQLite database
 * Creates tables if they don't exist
 */
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  database = await SQLite.openDatabaseAsync('reader.db');

  // SAFEGUARD: Ensure last_position_cfi exists (Brute Force Fix)
  try {
    await database.execAsync('ALTER TABLE books ADD COLUMN last_position_cfi TEXT');
    console.log('[Database] SAFEGUARD: Added last_position_cfi column');
  } catch (e) {
    // Ignore error if column exists
  }

  // Create Books table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      cover TEXT,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      progress REAL DEFAULT 0,
      reading_position INTEGER DEFAULT 0,
      current_chapter_index INTEGER DEFAULT 0,
      current_scroll_position REAL DEFAULT 0,
      total_chapters INTEGER DEFAULT 0,
      last_read INTEGER DEFAULT 0,
      last_position_cfi TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_books_last_read ON books(last_read DESC);
    CREATE INDEX IF NOT EXISTS idx_books_title ON books(title COLLATE NOCASE);
  `);

  // Migration 1: Add reading_position column
  try {
    const result = await database.getAllAsync<{ name: string }>('PRAGMA table_info(books)');
    const columns = result.map(col => col.name);

    if (!columns.includes('reading_position')) {
      console.log('[Database] Migrating: Adding reading_position column');
      await database.execAsync('ALTER TABLE books ADD COLUMN reading_position INTEGER DEFAULT 0');
    }

    // Migration 2: Add EPUB specific columns
    if (!columns.includes('current_chapter_index')) {
      console.log('[Database] Migrating: Adding current_chapter_index column');
      await database.execAsync('ALTER TABLE books ADD COLUMN current_chapter_index INTEGER DEFAULT 0');
    }

    if (!columns.includes('current_scroll_position')) {
      console.log('[Database] Migrating: Adding current_scroll_position column');
      await database.execAsync('ALTER TABLE books ADD COLUMN current_scroll_position REAL DEFAULT 0');
    }

    if (!columns.includes('total_chapters')) {
      console.log('[Database] Migrating: Adding total_chapters column');
      await database.execAsync('ALTER TABLE books ADD COLUMN total_chapters INTEGER DEFAULT 0');
    }

    if (!columns.includes('last_position_cfi')) {
      console.log('[Database] Migrating: Adding last_position_cfi column');
      await database.execAsync('ALTER TABLE books ADD COLUMN last_position_cfi TEXT');
    }

  } catch (error) {
    console.error('[Database] Migration error:', error);
  }

  // Create Reading Sessions table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS reading_sessions (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_sessions_book_id ON reading_sessions(book_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_created ON reading_sessions(created_at DESC);
  `);

  // Create Bookmarks table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      cfi TEXT,
      page INTEGER,
      offset INTEGER,
      percentage REAL DEFAULT 0,
      preview_text TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_bookmarks_book_id ON bookmarks(book_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_created ON bookmarks(created_at DESC);
  `);

  // Create Notes table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      cfi TEXT NOT NULL,
      full_text TEXT,
      note TEXT,
      color TEXT,
      type TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id);
    CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);
  `);

  console.log('[Database] Initialized successfully');
  return database;
};

/**
 * Get the database instance
 */
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!database) {
    return await initDatabase();
  }
  return database;
};
