import type { TopicStatus } from './topic-types';

export interface DashboardTopic {
  id: string;
  title: string;
  category: string | null;
  level: string | null;
  lang: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  word_count: number;
  studied_count: number;
  mastered_count: number;
  image_url: string | null;
  status: TopicStatus;
  progress: number;
}

export interface DashboardSummary {
  overview: {
    studiedTotal: number;
    masteredTotal: number;
    studiedToday: number;
    dailyWordGoal: number;
    currentStreak: number;
    completedTopics: number;
  };
  resume: {
    topicId: string;
    title: string;
    position: number;
    wordCount: number;
    imageUrl: string | null;
    hasProgress: boolean;
  } | null;
  topics: DashboardTopic[];
}
