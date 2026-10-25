import { db } from '../connection.js';
import { DEFAULT_DAILY_WORD_GOAL, TOPIC_STATUS, USER_ID_LOCAL } from '../../shared/constants.js';
import type { TopicRow, TopicStatus } from '../../shared/types.js';

export type DashboardTopicRow = TopicRow & {
  word_count: number;
  studied_count: number;
  mastered_count: number;
  image_url: string | null;
  status: TopicStatus;
  progress: number;
};

export type DashboardResumeRow = {
  topic_id: string;
  topic_title: string;
  current_word_position: number;
  word_count: number;
  last_studied_at: string | null;
};

export function deriveTopicProgress(
  wordCount: number,
  studiedCount: number,
  masteredCount: number,
): { status: TopicStatus; progress: number } {
  const status: TopicStatus =
    wordCount === 0 || studiedCount === 0
      ? TOPIC_STATUS.NOT_STARTED
      : masteredCount >= wordCount
        ? TOPIC_STATUS.COMPLETED
        : TOPIC_STATUS.IN_PROGRESS;
  return {
    status,
    progress: wordCount === 0 ? 0 : Math.round((masteredCount / wordCount) * 100),
  };
}

export async function getDashboardTopics(): Promise<DashboardTopicRow[]> {
  const rows = await db.query<
    TopicRow & {
      word_count: number;
      studied_count: number;
      mastered_count: number;
      image_url: string | null;
    }
  >(
    `SELECT
      t.*,
      COUNT(DISTINCT w.id) AS word_count,
      COUNT(DISTINCT CASE
        WHEN wp.first_studied_at IS NOT NULL OR sl.id IS NOT NULL THEN w.id
      END) AS studied_count,
      COUNT(DISTINCT CASE WHEN wp.is_mastered = 1 THEN w.id END) AS mastered_count,
      (
        SELECT first_word.image_url
        FROM words AS first_word
        WHERE first_word.topic_id = t.id
        ORDER BY first_word.position ASC
        LIMIT 1
      ) AS image_url
    FROM topics AS t
    LEFT JOIN words AS w ON w.topic_id = t.id
    LEFT JOIN word_progress AS wp ON wp.word_id = w.id AND wp.user_id = ?
    LEFT JOIN study_log AS sl ON sl.word_id = w.id AND sl.user_id = ?
    GROUP BY t.id
    ORDER BY t.title ASC`,
    [USER_ID_LOCAL, USER_ID_LOCAL],
  );

  return rows.map((row) => ({
    ...row,
    word_count: Number(row.word_count),
    studied_count: Number(row.studied_count),
    mastered_count: Number(row.mastered_count),
    ...deriveTopicProgress(Number(row.word_count), Number(row.studied_count), Number(row.mastered_count)),
  }));
}

export async function getDashboardTotals(localDate: string): Promise<{
  studied_total: number;
  mastered_total: number;
  studied_today: number;
  daily_word_goal: number;
}> {
  const totals = await db.queryOne<{
    studied_total: number;
    mastered_total: number;
    studied_today: number;
  }>(
    `SELECT
      COUNT(DISTINCT CASE WHEN wp.first_studied_at IS NOT NULL THEN wp.word_id END) AS studied_total,
      COUNT(DISTINCT CASE WHEN wp.is_mastered = 1 THEN wp.word_id END) AS mastered_total,
      (
        SELECT COUNT(DISTINCT sl.word_id)
        FROM study_log AS sl
        WHERE sl.user_id = ? AND date(sl.studied_at, 'localtime') = ?
      ) AS studied_today
    FROM word_progress AS wp
    WHERE wp.user_id = ?`,
    [USER_ID_LOCAL, localDate, USER_ID_LOCAL],
  );

  const profile = await db.queryOne<{ daily_word_goal: number }>(
    'SELECT daily_word_goal FROM user_profile WHERE user_id = ?',
    [USER_ID_LOCAL],
  );

  return {
    studied_total: Number(totals?.studied_total ?? 0),
    mastered_total: Number(totals?.mastered_total ?? 0),
    studied_today: Number(totals?.studied_today ?? 0),
    daily_word_goal: Number(profile?.daily_word_goal ?? DEFAULT_DAILY_WORD_GOAL),
  };
}

export async function getStudyDatesSince(cutoffDate: string): Promise<string[]> {
  const rows = await db.query<{ study_date: string }>(
    `SELECT DISTINCT date(studied_at, 'localtime') AS study_date
     FROM study_log
     WHERE user_id = ? AND date(studied_at, 'localtime') >= ?
     ORDER BY study_date DESC`,
    [USER_ID_LOCAL, cutoffDate],
  );
  return rows.map((row) => row.study_date);
}

export async function getResumeTopic(): Promise<DashboardResumeRow | null> {
  return db.queryOne<DashboardResumeRow>(
    `SELECT
      t.id AS topic_id,
      t.title AS topic_title,
      COALESCE(
        tp.current_word_position,
        (
          SELECT w.position
          FROM study_log AS sl
          INNER JOIN words AS w ON w.id = sl.word_id
          WHERE w.topic_id = t.id AND sl.user_id = ?
          ORDER BY sl.studied_at DESC
          LIMIT 1
        ),
        1
      ) AS current_word_position,
      (SELECT COUNT(*) FROM words AS count_word WHERE count_word.topic_id = t.id) AS word_count,
      COALESCE(
        tp.last_studied_at,
        (SELECT MAX(sl.studied_at) FROM study_log AS sl
         INNER JOIN words AS w ON w.id = sl.word_id
         WHERE w.topic_id = t.id AND sl.user_id = ?)
      ) AS last_studied_at
    FROM topics AS t
    LEFT JOIN topic_progress AS tp ON tp.topic_id = t.id AND tp.user_id = ?
    WHERE tp.last_studied_at IS NOT NULL
       OR EXISTS (
         SELECT 1 FROM study_log AS sl
         INNER JOIN words AS w ON w.id = sl.word_id
         WHERE w.topic_id = t.id AND sl.user_id = ?
       )
    ORDER BY last_studied_at DESC
    LIMIT 1`,
    [USER_ID_LOCAL, USER_ID_LOCAL, USER_ID_LOCAL, USER_ID_LOCAL],
  );
}
