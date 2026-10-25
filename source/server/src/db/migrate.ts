import { db } from './connection.js';
import { DEFAULT_COLLECTION_NAME, DEFAULT_DAILY_WORD_GOAL, USER_ID_LOCAL } from '../shared/constants.js';

const MIGRATION_VERSION = '2026-10-18-phase-02-t01';

async function ensureSchemaVersion(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const existing = await db.queryOne<{ ver: number }>(
    'SELECT 1 AS ver FROM schema_migrations WHERE version = ?',
    [MIGRATION_VERSION],
  );

  if (existing) return;

  // Turso/libSQL hỗ trợ batch transactions qua client.batch()
  const timestamp = new Date().toISOString();

  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT,
        level TEXT,
        lang TEXT,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS words (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL,
        source_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        name_vi TEXT NOT NULL,
        chunk TEXT NOT NULL,
        part_of_speech TEXT,
        ipa TEXT,
        ipa_uk TEXT,
        ipa_us TEXT,
        meaning_vi TEXT NOT NULL,
        image_url TEXT,
        audio_url TEXT,
        audio_uk_url TEXT,
        audio_us_url TEXT,
        example_en TEXT NOT NULL,
        example_vi TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(topic_id, source_id),
        UNIQUE(topic_id, position),
        FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        owner_type TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        media_kind TEXT NOT NULL,
        original_ref TEXT,
        resolved_url TEXT,
        storage_path TEXT,
        mime_type TEXT,
        sha256 TEXT,
        created_at TEXT NOT NULL
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        topic_id TEXT,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT,
        lang TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE SET NULL
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS quiz_questions (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        source_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        question_type TEXT NOT NULL,
        image_url TEXT,
        name_vi TEXT NOT NULL,
        meaning_vi TEXT NOT NULL,
        chunk TEXT NOT NULL,
        example_en TEXT NOT NULL,
        example_vi TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(quiz_id, source_id),
        UNIQUE(quiz_id, position),
        FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS user_profile (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        avatar TEXT NOT NULL,
        daily_word_goal INTEGER NOT NULL CHECK(daily_word_goal > 0),
        updated_at TEXT NOT NULL
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS word_progress (
        user_id TEXT NOT NULL,
        word_id TEXT NOT NULL,
        is_mastered INTEGER NOT NULL DEFAULT 0,
        first_studied_at TEXT,
        last_studied_at TEXT,
        updated_at TEXT NOT NULL,
        PRIMARY KEY(user_id, word_id),
        FOREIGN KEY(word_id) REFERENCES words(id) ON DELETE CASCADE
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS topic_progress (
        user_id TEXT NOT NULL,
        topic_id TEXT NOT NULL,
        current_word_position INTEGER NOT NULL DEFAULT 1,
        last_studied_at TEXT,
        updated_at TEXT NOT NULL,
        PRIMARY KEY(user_id, topic_id),
        FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, name)
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS collection_words (
        collection_id TEXT NOT NULL,
        word_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY(collection_id, word_id),
        FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        FOREIGN KEY(word_id) REFERENCES words(id) ON DELETE CASCADE
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS study_log (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        word_id TEXT NOT NULL,
        studied_at TEXT NOT NULL,
        event_type TEXT NOT NULL,
        FOREIGN KEY(word_id) REFERENCES words(id) ON DELETE CASCADE
      )`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS quiz_attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        quiz_id TEXT,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        percentage REAL NOT NULL,
        answers_json TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL
      )`,
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_words_topic_position ON words(topic_id, position)` },
    { sql: `CREATE INDEX IF NOT EXISTS idx_study_log_user_date ON study_log(user_id, studied_at)` },
    { sql: `CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_date ON quiz_attempts(user_id, completed_at)` },
    {
      sql: `INSERT INTO user_profile (user_id, name, avatar, daily_word_goal, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO NOTHING`,
      args: [USER_ID_LOCAL, 'Local User', '🙂', DEFAULT_DAILY_WORD_GOAL, timestamp],
    },
    {
      sql: `INSERT INTO collections (id, user_id, name, is_default, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, name) DO NOTHING`,
      args: [`collection-${USER_ID_LOCAL}-default`, USER_ID_LOCAL, DEFAULT_COLLECTION_NAME, 1, timestamp, timestamp],
    },
    {
      sql: `INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)`,
      args: [MIGRATION_VERSION, timestamp],
    },
  ]);
}

export async function runMigrations(): Promise<void> {
  await ensureSchemaVersion();
}
