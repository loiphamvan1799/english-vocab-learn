import { unlink } from 'node:fs/promises';
import path from 'node:path';

import { getMediaAssetsByOwnerIds, deleteMediaAssetsByOwnerIds, getUnreferencedStoragePaths } from '../db/repositories/media-assets.js';
import { deleteTopicRow, getTopicById } from '../db/repositories/topics.js';
import { db } from '../db/connection.js';
import { AppError } from '../shared/api-response.js';

const uploadsRoot = path.resolve(process.cwd(), 'uploads');

export async function deleteTopic(topicId: string): Promise<void> {
  const topic = await getTopicById(topicId);
  if (!topic) throw new AppError(404, 'TOPIC_NOT_FOUND', 'Không tìm thấy chủ đề cần xóa.');

  const wordRows = await db.query<{ id: string }>('SELECT id FROM words WHERE topic_id = ?', [topicId]);
  const wordIds = wordRows.map((row) => row.id);

  const media = await getMediaAssetsByOwnerIds(wordIds);

  // Xoá media assets và topic trong batch (CASCADE sẽ xoá words, topic_progress, word_progress, study_log)
  await deleteMediaAssetsByOwnerIds(wordIds);
  await deleteTopicRow(topicId);

  const paths = media.map((asset) => asset.storage_path).filter((value): value is string => Boolean(value));
  for (const storagePath of await getUnreferencedStoragePaths(paths)) {
    await unlink(path.join(uploadsRoot, path.basename(storagePath))).catch((error: unknown) => {
      console.warn('Unable to remove unused topic media:', error);
    });
  }
}
