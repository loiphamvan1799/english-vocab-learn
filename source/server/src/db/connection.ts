/**
 * Database connection — Switchable: local SQLite file (dev) hoặc Turso cloud (production).
 *
 * Quy tắc cấu hình:
 *   - Local / Offline: Không cần đặt biến môi trường nào. DB tự động dùng file:./data/vocabulary.db
 *   - Production (Render): Đặt TURSO_DATABASE_URL và TURSO_AUTH_TOKEN trong Environment Variables.
 *
 * File cần chỉnh sửa để điền token của bạn: source/server/.env (local) hoặc Render Environment.
 */

import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@libsql/client';
import type { Client, ResultSet, InArgs } from '@libsql/client';

// ─── Cấu hình URL ────────────────────────────────────────────────────────────

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let dbUrl: string;

if (tursoUrl) {
  // Production: dùng Turso Cloud SQLite
  dbUrl = tursoUrl;
} else {
  // Local: dùng file SQLite cục bộ
  const dataDir = path.resolve(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  dbUrl = `file:${path.join(dataDir, 'vocabulary.db')}`;
}

// ─── Khởi tạo libSQL client ──────────────────────────────────────────────────

const client: Client = createClient({
  url: dbUrl,
  authToken: tursoToken,
});

// ─── Thin wrapper — Giữ API gần giống better-sqlite3 nhưng async ─────────────

/**
 * db.execute — Chạy một câu SQL đơn (INSERT/UPDATE/DELETE/CREATE TABLE).
 * Tương đương `db.prepare(sql).run(...args)` trong better-sqlite3.
 */
async function execute(sql: string, args: unknown[] = []): Promise<ResultSet> {
  return client.execute({ sql, args: args as InArgs });
}

/**
 * db.query — Chạy một câu SELECT, trả về mảng rows dạng object.
 * Tương đương `db.prepare(sql).all(...args)` trong better-sqlite3.
 */
async function query<T = Record<string, unknown>>(sql: string, args: unknown[] = []): Promise<T[]> {
  const result = await client.execute({ sql, args: args as InArgs });
  return result.rows as unknown as T[];
}

/**
 * db.queryOne — Chạy SELECT và trả về row đầu tiên hoặc null.
 * Tương đương `db.prepare(sql).get(...args)` trong better-sqlite3.
 */
async function queryOne<T = Record<string, unknown>>(sql: string, args: unknown[] = []): Promise<T | null> {
  const result = await client.execute({ sql, args: args as InArgs });
  return (result.rows[0] as unknown as T) ?? null;
}

/**
 * db.batch — Chạy nhiều câu SQL trong một transaction (atomic).
 * Tương đương `db.transaction(() => { ... })()` trong better-sqlite3.
 */
async function batch(statements: Array<{ sql: string; args?: unknown[] }>): Promise<ResultSet[]> {
  return client.batch(
    statements.map((stmt) => ({
      sql: stmt.sql,
      args: (stmt.args ?? []) as InArgs,
    })),
    'write',
  );
}

export const db = {
  execute,
  query,
  queryOne,
  batch,
  /** Expose raw client cho trường hợp cần dùng trực tiếp */
  client,
};

export type { ResultSet };
