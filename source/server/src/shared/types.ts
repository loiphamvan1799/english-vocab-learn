export type TopicStatus = 'not_started' | 'in_progress' | 'completed';

export interface TopicRow {
  id: string;
  title: string;
  category: string | null;
  level: string | null;
  lang: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WordRow {
  id: string;
  topic_id: string;
  source_id: string;
  position: number;
  name_vi: string;
  chunk: string;
  part_of_speech: string | null;
  ipa: string | null;
  ipa_uk: string | null;
  ipa_us: string | null;
  meaning_vi: string;
  image_url: string | null;
  audio_url: string | null;
  audio_uk_url: string | null;
  audio_us_url: string | null;
  example_en: string;
  example_vi: string;
  created_at: string;
  updated_at: string;
}

export interface TopicSummary extends TopicRow {
  word_count: number;
  status: TopicStatus;
  progress: number;
}
