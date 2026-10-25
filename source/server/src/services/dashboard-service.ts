import {
  getDashboardTopics,
  getDashboardTotals,
  getResumeTopic,
  getStudyDatesSince,
} from '../db/repositories/progress.js';

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentStreak(studyDates: string[], today: string): number {
  const dates = new Set(studyDates);
  const cursor = new Date(`${today}T00:00:00.000Z`);
  if (!dates.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);

  let streak = 0;
  while (dates.has(localDateKeyUtc(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function localDateKeyUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export async function getDashboardSummary(now = new Date()) {
  const today = localDateKey(now);
  const cutoff = new Date(`${today}T00:00:00.000Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 400);

  const [totals, studyDates, topics, resume] = await Promise.all([
    getDashboardTotals(today),
    getStudyDatesSince(localDateKeyUtc(cutoff)),
    getDashboardTopics(),
    getResumeTopic(),
  ]);

  const resumeTopic = resume
    ? topics.find((topic) => topic.id === resume.topic_id) ?? null
    : topics.find((topic) => topic.word_count > 0) ?? null;

  const resumePosition =
    resume && resumeTopic?.id === resume.topic_id
      ? Math.min(Math.max(resume.current_word_position, 1), Math.max(resume.word_count, 1))
      : 1;

  return {
    overview: {
      studiedTotal: totals.studied_total,
      masteredTotal: totals.mastered_total,
      studiedToday: totals.studied_today,
      dailyWordGoal: totals.daily_word_goal,
      currentStreak: getCurrentStreak(studyDates, today),
      completedTopics: topics.filter((topic) => topic.status === 'completed').length,
    },
    resume: resumeTopic
      ? {
          topicId: resumeTopic.id,
          title: resumeTopic.title,
          position: resumePosition,
          wordCount: resumeTopic.word_count,
          imageUrl: resumeTopic.image_url,
          hasProgress: Boolean(resume),
        }
      : null,
    topics,
  };
}
