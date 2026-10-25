import { db } from '../connection.js';
import { MAX_SEARCH_LIMIT } from '../../shared/constants.js';
import type { WordRow } from '../../shared/types.js';
import { randomUUID } from 'node:crypto';

export type ImportedWordRecord = {
  sourceId: string;
  position: number;
  nameVi: string;
  chunk: string;
  ipa: string | null;
  meaningVi: string;
  imageUrl: string | null;
  audioUrl: string | null;
  exampleEn: string;
  exampleVi: string;
};

export async function getWordsByTopicId(topicId: string): Promise<WordRow[]> {
  return db.query<WordRow>(
    `SELECT * FROM words WHERE topic_id = ? ORDER BY position ASC, created_at ASC`,
    [topicId],
  );
}

export async function searchWords(query: string, limit = MAX_SEARCH_LIMIT): Promise<WordRow[]> {
  const search = `%${query.trim()}%`;
  return db.query<WordRow>(
    `SELECT * FROM words
     WHERE name_vi LIKE ? OR chunk LIKE ? OR meaning_vi LIKE ?
     ORDER BY topic_id ASC, position ASC
     LIMIT ?`,
    [search, search, search, limit],
  );
}

export async function getWordById(wordId: string): Promise<WordRow | null> {
  return db.queryOne<WordRow>(`SELECT * FROM words WHERE id = ?`, [wordId]);
}

/**
 * Sync imported words: thêm mới, cập nhật, xoá từ không còn trong nguồn.
 * Trả về Map<sourceId, wordId> để gán media assets.
 *
 * Lưu ý: libSQL/Turso không hỗ trợ `db.transaction()` synchronous. Thay thế bằng
 * một batch lớn, kết hợp DELETE + INSERT/UPDATE theo thứ tự an toàn.
 */
export async function syncImportedWords(
  topicId: string,
  words: ImportedWordRecord[],
  now: string,
): Promise<Map<string, string>> {
  // 1. Lấy danh sách từ hiện tại trong topic
  const current = await db.query<{ id: string; source_id: string }>(
    'SELECT id, source_id FROM words WHERE topic_id = ?',
    [topicId],
  );
  const currentBySource = new Map(current.map((w) => [w.source_id, w.id]));
  const sourceIds = new Set(words.map((w) => w.sourceId));

  // 2. Xoá các từ không còn trong nguồn
  const removed = current.filter((w) => !sourceIds.has(w.source_id));
  if (removed.length > 0) {
    const marks = removed.map(() => '?').join(',');
    await db.execute(
      `DELETE FROM words WHERE id IN (${marks})`,
      removed.map((w) => w.id),
    );
  }

  // 3. Tạm thời dịch position sang âm để tránh unique constraint khi reorder
  await db.execute('UPDATE words SET position = -position WHERE topic_id = ?', [topicId]);

  // 4. Build batch statements cho update / insert
  const ids = new Map<string, string>();
  const stmts: Array<{ sql: string; args: unknown[] }> = [];

  for (const word of words) {
    const existingId = currentBySource.get(word.sourceId);
    const id = existingId ?? randomUUID();
    ids.set(word.sourceId, id);

    if (existingId) {
      stmts.push({
        sql: `UPDATE words SET
          position = ?, name_vi = ?, chunk = ?, part_of_speech = NULL,
          ipa = ?, ipa_uk = NULL, ipa_us = NULL,
          meaning_vi = ?, image_url = ?, audio_url = ?,
          audio_uk_url = NULL, audio_us_url = NULL,
          example_en = ?, example_vi = ?, updated_at = ?
          WHERE id = ?`,
        args: [
          word.position, word.nameVi, word.chunk,
          word.ipa, word.meaningVi, word.imageUrl, word.audioUrl,
          word.exampleEn, word.exampleVi, now, existingId,
        ],
      });
    } else {
      stmts.push({
        sql: `INSERT INTO words
          (id, topic_id, source_id, position, name_vi, chunk, ipa, meaning_vi, image_url, audio_url, example_en, example_vi, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, topicId, word.sourceId, word.position, word.nameVi, word.chunk,
          word.ipa, word.meaningVi, word.imageUrl, word.audioUrl,
          word.exampleEn, word.exampleVi, now, now,
        ],
      });
    }
  }

  if (stmts.length > 0) {
    await db.batch(stmts);
  }

  return ids;
}
