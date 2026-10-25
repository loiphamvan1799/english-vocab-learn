export type TopicStatus = 'not_started' | 'in_progress' | 'completed';

export interface TopicSummary {
  id: string;
  title: string;
  category: string | null;
  level: string | null;
  lang: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  word_count: number;
  status: TopicStatus;
  progress: number;
}

export interface WordItem {
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

export interface TopicDetail extends TopicSummary {
  words: WordItem[];
}

export interface TopicImportPreview {
  previewId: string;
  expiresAt: string;
  topic: Pick<TopicSummary, 'id' | 'title' | 'category' | 'level' | 'lang' | 'description'>;
  itemCount: number;
  items: Array<{
    sourceId: string;
    position: number;
    nameVi: string;
    chunk: string;
    meaningVi: string;
    imageUrl: string | null;
  }>;
  warnings: Array<{ code: string; message: string }>;
  conflict: boolean;
  duplicateOptions: Array<'overwrite' | 'create-copy' | 'cancel'>;
}

export interface TopicImportResult {
  topicId?: string;
  itemCount?: number;
  overwritten?: boolean;
  cancelled?: boolean;
}
