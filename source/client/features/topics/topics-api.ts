import { fetchApi } from '@/lib/api-client';

import type { TopicDetail, TopicImportPreview, TopicImportResult, TopicSummary, WordItem } from './topic-types';

export async function getTopics(): Promise<TopicSummary[]> {
  return fetchApi<TopicSummary[]>('/api/topics');
}

export async function searchWords(query: string, limit = 8): Promise<WordItem[]> {
  if (!query.trim()) {
    return [];
  }

  return fetchApi<WordItem[]>(`/api/words/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

export async function getTopic(topicId: string): Promise<TopicDetail> {
  return fetchApi<TopicDetail>(`/api/topics/${encodeURIComponent(topicId)}`);
}

export async function deleteTopic(topicId: string): Promise<void> {
  await fetchApi<void>(`/api/topics/${encodeURIComponent(topicId)}`, { method: 'DELETE' });
}

export async function previewTopicImport(html: File, assets: File[] = []): Promise<TopicImportPreview> {
  const form = new FormData();
  form.append('html', html);
  assets.forEach((asset) => form.append('assets[]', asset));
  return fetchApi<TopicImportPreview>('/api/imports/topics/preview', { method: 'POST', body: form });
}

export async function confirmTopicImport(previewId: string, duplicateMode: 'overwrite' | 'create-copy' | 'cancel'): Promise<TopicImportResult> {
  return fetchApi<TopicImportResult>('/api/imports/topics/confirm', {
    method: 'POST',
    body: JSON.stringify({ previewId, duplicateMode }),
  });
}
