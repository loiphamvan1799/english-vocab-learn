import { db } from '../connection.js';

export type MediaAssetRow = {
  id: string;
  owner_type: string;
  owner_id: string;
  media_kind: string;
  original_ref: string | null;
  resolved_url: string | null;
  storage_path: string | null;
  mime_type: string | null;
  sha256: string | null;
  created_at: string;
};

export async function getMediaAssetsByOwnerIds(ownerIds: string[]): Promise<MediaAssetRow[]> {
  if (ownerIds.length === 0) return [];
  const placeholders = ownerIds.map(() => '?').join(',');
  return db.query<MediaAssetRow>(
    `SELECT * FROM media_assets WHERE owner_type = 'word' AND owner_id IN (${placeholders})`,
    ownerIds,
  );
}

export async function insertMediaAsset(
  asset: Omit<MediaAssetRow, 'created_at'> & { created_at?: string },
): Promise<void> {
  await db.execute(
    `INSERT INTO media_assets (id, owner_type, owner_id, media_kind, original_ref, resolved_url, storage_path, mime_type, sha256, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      asset.id, asset.owner_type, asset.owner_id, asset.media_kind,
      asset.original_ref, asset.resolved_url, asset.storage_path,
      asset.mime_type, asset.sha256, asset.created_at ?? new Date().toISOString(),
    ],
  );
}

export async function deleteMediaAssetsByOwnerIds(ownerIds: string[]): Promise<void> {
  if (ownerIds.length === 0) return;
  const placeholders = ownerIds.map(() => '?').join(',');
  await db.execute(
    `DELETE FROM media_assets WHERE owner_type = 'word' AND owner_id IN (${placeholders})`,
    ownerIds,
  );
}

export async function deleteMediaAssetsByTopicId(topicId: string): Promise<void> {
  await db.execute(
    `DELETE FROM media_assets
     WHERE owner_type = 'word'
       AND owner_id IN (SELECT id FROM words WHERE topic_id = ?)`,
    [topicId],
  );
}

export async function getUnreferencedStoragePaths(paths: string[]): Promise<string[]> {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  const result: string[] = [];
  for (const storagePath of uniquePaths) {
    const row = await db.queryOne<{ x: number }>(
      'SELECT 1 AS x FROM media_assets WHERE storage_path = ? LIMIT 1',
      [storagePath],
    );
    if (!row) result.push(storagePath);
  }
  return result;
}
