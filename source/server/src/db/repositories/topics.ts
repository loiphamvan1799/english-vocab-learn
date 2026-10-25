import { db } from '../connection.js';
import { TOPIC_STATUS, USER_ID_LOCAL } from '../../shared/constants.js';
import type { TopicRow, TopicSummary } from '../../shared/types.js';
import { randomUUID } from 'node:crypto';

export async function getTopicSummaries(): Promise<TopicSummary[]> {
  const rows = await db.query<TopicRow & { word_count: number; studied_count: number; mastered_count: number }>(`
    SELECT
      t.id, t.title, t.category, t.level, t.lang, t.description, t.created_at, t.updated_at,
      COUNT(DISTINCT w.id) AS word_count,
      COUNT(DISTINCT CASE
        WHEN wp.first_studied_at IS NOT NULL OR EXISTS (
          SELECT 1 FROM study_log AS sl
          WHERE sl.word_id = w.id AND sl.user_id = ?
        ) THEN w.id
      END) AS studied_count,
      COUNT(DISTINCT CASE WHEN wp.is_mastered = 1 THEN w.id END) AS mastered_count
    FROM topics t
    LEFT JOIN words w ON w.topic_id = t.id
    LEFT JOIN word_progress wp ON wp.word_id = w.id AND wp.user_id = ?
    GROUP BY t.id
    ORDER BY t.title ASC
  `, [USER_ID_LOCAL, USER_ID_LOCAL]);

  return rows.map((row) => ({
    ...row,
    word_count: Number(row.word_count),
    studied_count: Number(row.studied_count),
    mastered_count: Number(row.mastered_count),
    status: row.word_count === 0 || Number(row.studied_count) === 0
      ? TOPIC_STATUS.NOT_STARTED
      : Number(row.mastered_count) >= Number(row.word_count)
        ? TOPIC_STATUS.COMPLETED
        : TOPIC_STATUS.IN_PROGRESS,
    progress: Number(row.word_count) === 0 ? 0 : Math.round((Number(row.mastered_count) / Number(row.word_count)) * 100),
  }));
}

export async function getTopicById(topicId: string): Promise<TopicRow | null> {
  return db.queryOne<TopicRow>(
    `SELECT * FROM topics WHERE id = ?`,
    [topicId],
  );
}

export async function countWordsByTopic(topicId: string): Promise<number> {
  const result = await db.queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM words WHERE topic_id = ?`,
    [topicId],
  );
  return Number(result?.total ?? 0);
}

export async function upsertImportedTopic(topic: Omit<TopicRow, 'created_at' | 'updated_at'>, now: string): Promise<void> {
  await db.execute(
    `INSERT INTO topics (id, title, category, level, lang, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       category = excluded.category,
       level = excluded.level,
       lang = excluded.lang,
       description = excluded.description,
       updated_at = excluded.updated_at`,
    [topic.id, topic.title, topic.category, topic.level, topic.lang, topic.description, now, now],
  );
}

export async function deleteTopicRow(topicId: string): Promise<void> {
  await db.execute('DELETE FROM topics WHERE id = ?', [topicId]);
}

export async function createCopyTopicId(sourceId: string): Promise<string> {
  let candidate = `${sourceId}-copy`;
  let suffix = 2;
  while (await getTopicById(candidate)) {
    candidate = `${sourceId}-copy-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function newTopicRowId(): string {
  return randomUUID();
}
