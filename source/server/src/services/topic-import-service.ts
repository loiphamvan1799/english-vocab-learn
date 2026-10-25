import { randomUUID } from 'node:crypto';
import { existsSync, renameSync } from 'node:fs';
import { mkdir, readdir, rm, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { Express } from 'express';

import { getMediaAssetsByOwnerIds, deleteMediaAssetsByOwnerIds, insertMediaAsset, getUnreferencedStoragePaths } from '../db/repositories/media-assets.js';
import { createCopyTopicId, getTopicById, upsertImportedTopic } from '../db/repositories/topics.js';
import { syncImportedWords } from '../db/repositories/words.js';
import { db } from '../db/connection.js';
import { resolveTopicMedia, type StagedMedia } from '../import/media-resolver.js';
import { parseTopicHtml } from '../import/topic-parser.js';
import type { ParsedTopic } from '../import/schemas.js';
import { AppError } from '../shared/api-response.js';

const uploadsRoot = path.resolve(process.cwd(), 'uploads');
const stagingRoot = path.join(uploadsRoot, '.staging');
const PREVIEW_TTL_MS = 20 * 60 * 1000;
const MAX_ACTIVE_PREVIEWS = 24;
const previews = new Map<
  string,
  {
    parsed: ParsedTopic;
    assets: StagedMedia[];
    imageUrls: Map<string, string>;
    audioUrls: Map<string, string>;
    stageDirectory: string;
    expiresAt: number;
    conflict: boolean;
  }
>();
const completedPreviews = new Map<string, { result: Record<string, unknown>; expiresAt: number }>();

async function sweepExpiredStagingDirectories(): Promise<void> {
  await mkdir(stagingRoot, { recursive: true });
  const entries = await readdir(stagingRoot, { withFileTypes: true }).catch(() => []);
  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && !previews.has(entry.name))
      .map(async (entry) => {
        const directory = path.join(stagingRoot, entry.name);
        const info = await stat(directory).catch(() => null);
        if (info && Date.now() - info.mtimeMs > PREVIEW_TTL_MS) {
          await rm(directory, { recursive: true, force: true });
        }
      }),
  );
}

const stagingSweeper = setInterval(
  () => {
    void cleanExpiredPreviews()
      .then(sweepExpiredStagingDirectories)
      .catch((error: unknown) => console.warn('Import staging cleanup failed:', error));
  },
  60_000,
);
stagingSweeper.unref();
let confirmationQueue = Promise.resolve();

export type TopicImportPreview = {
  previewId: string;
  expiresAt: string;
  topic: ParsedTopic['topic'];
  itemCount: number;
  items: Array<{ sourceId: string; position: number; nameVi: string; chunk: string; meaningVi: string; imageUrl: string | null }>;
  warnings: ParsedTopic['warnings'];
  conflict: boolean;
  duplicateOptions: Array<'overwrite' | 'create-copy' | 'cancel'>;
};

async function cleanPreview(previewId: string, preview: { stageDirectory: string }): Promise<void> {
  previews.delete(previewId);
  await rm(preview.stageDirectory, { recursive: true, force: true });
}

async function cleanExpiredPreviews(): Promise<void> {
  const now = Date.now();
  await Promise.all(
    [...previews.entries()]
      .filter(([, preview]) => preview.expiresAt <= now)
      .map(([id, preview]) => cleanPreview(id, preview)),
  );
  for (const [id, completed] of completedPreviews) {
    if (completed.expiresAt <= now) completedPreviews.delete(id);
  }
}

export async function previewTopicImport(html: string, assets: Express.Multer.File[]): Promise<TopicImportPreview> {
  await cleanExpiredPreviews();
  await sweepExpiredStagingDirectories();
  if (previews.size >= MAX_ACTIVE_PREVIEWS) {
    throw new AppError(429, 'IMPORT_BUSY', 'Đang có nhiều phiên import hoạt động. Vui lòng thử lại sau ít phút.');
  }
  const parsed = parseTopicHtml(html);
  const totalBytes = Buffer.byteLength(html, 'utf8') + assets.reduce((sum, asset) => sum + asset.size, 0);
  if (totalBytes > 50 * 1024 * 1024) {
    throw new AppError(413, 'UPLOAD_TOO_LARGE', 'Tổng dung lượng tệp vượt quá giới hạn cho phép.');
  }
  const previewId = randomUUID();
  const stageDirectory = path.join(stagingRoot, previewId);
  try {
    const resolved = await resolveTopicMedia(parsed.words, assets, stageDirectory);
    const warnings = [...parsed.warnings.filter((w) => w.code !== 'MEDIA_NOT_FOUND'), ...resolved.warnings];
    const conflict = Boolean(await getTopicById(parsed.topic.id));
    const preview = {
      parsed: { ...parsed, warnings },
      assets: resolved.media,
      imageUrls: resolved.imageUrls,
      audioUrls: resolved.audioUrls,
      stageDirectory,
      expiresAt: Date.now() + PREVIEW_TTL_MS,
      conflict,
    };
    previews.set(previewId, preview);
    return {
      previewId,
      expiresAt: new Date(preview.expiresAt).toISOString(),
      topic: preview.parsed.topic,
      itemCount: parsed.words.length,
      items: parsed.words.map((word, index) => ({
        sourceId: word.id,
        position: index + 1,
        nameVi: word.nameVi,
        chunk: word.chunk,
        meaningVi: word.meaningVi,
        imageUrl: resolved.imageUrls.get(word.id) ?? (/^https?:\/\//i.test(word.imageUrl ?? '') ? word.imageUrl ?? null : null),
      })),
      warnings,
      conflict,
      duplicateOptions: conflict ? ['overwrite', 'create-copy', 'cancel'] : ['cancel'],
    };
  } catch (error) {
    await rm(stageDirectory, { recursive: true, force: true });
    if (error instanceof Error && error.message === 'MEDIA_UNSAFE') {
      throw new AppError(422, 'MEDIA_UNSAFE', 'Đường dẫn hoặc loại tệp media không an toàn.');
    }
    throw error;
  }
}

function publishStagedMedia(assets: StagedMedia[], created: string[]): void {
  for (const asset of assets) {
    const destination = path.join(uploadsRoot, asset.storageName);
    if (existsSync(destination)) continue;
    renameSync(asset.stagedPath, destination);
    created.push(destination);
  }
}

export async function confirmTopicImport(previewId: string, duplicateMode: 'overwrite' | 'create-copy' | 'cancel') {
  const operation = confirmationQueue.then(() => confirmTopicImportLocked(previewId, duplicateMode));
  confirmationQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

async function confirmTopicImportLocked(previewId: string, duplicateMode: 'overwrite' | 'create-copy' | 'cancel') {
  await cleanExpiredPreviews();
  const completed = completedPreviews.get(previewId);
  if (completed) return completed.result;
  const preview = previews.get(previewId);
  if (!preview) throw new AppError(404, 'PREVIEW_EXPIRED', 'Phiên xem trước đã hết hạn. Vui lòng tải tệp lên lại.');

  if (duplicateMode === 'cancel') {
    await cleanPreview(previewId, preview);
    const result = { cancelled: true as const };
    completedPreviews.set(previewId, { result, expiresAt: Date.now() + PREVIEW_TTL_MS });
    return result;
  }

  const exists = Boolean(await getTopicById(preview.parsed.topic.id));
  if (exists !== preview.conflict) {
    throw new AppError(409, 'DUPLICATE_ENTITY', 'Chủ đề đã thay đổi kể từ lúc xem trước. Vui lòng tải tệp lên lại.');
  }
  if (exists && duplicateMode !== 'overwrite' && duplicateMode !== 'create-copy') {
    throw new AppError(409, 'DUPLICATE_ENTITY', 'Chủ đề đã tồn tại. Hãy chọn ghi đè, tạo bản mới hoặc hủy.');
  }
  if (!exists && duplicateMode === 'overwrite') {
    throw new AppError(409, 'DUPLICATE_ENTITY', 'Chủ đề không còn tồn tại để ghi đè. Vui lòng tạo bản mới.');
  }

  await mkdir(uploadsRoot, { recursive: true });
  const newlyPublished: string[] = [];
  const timestamp = new Date().toISOString();

  let topicId = preview.parsed.topic.id;
  let previousWordIds: string[] = [];
  let previousMedia: Awaited<ReturnType<typeof getMediaAssetsByOwnerIds>> = [];

  try {
    publishStagedMedia(preview.assets, newlyPublished);

    // Kiểm tra lại state (double-check race condition)
    const currentExists = Boolean(await getTopicById(preview.parsed.topic.id));
    if (currentExists !== exists) {
      throw new AppError(409, 'DUPLICATE_ENTITY', 'Chủ đề đã thay đổi kể từ lúc xem trước. Vui lòng tải tệp lên lại.');
    }

    topicId = currentExists && duplicateMode === 'create-copy'
      ? await createCopyTopicId(preview.parsed.topic.id)
      : preview.parsed.topic.id;

    const existingWords = await db.query<{ id: string }>('SELECT id FROM words WHERE topic_id = ?', [topicId]);
    previousWordIds = existingWords.map((row) => row.id);
    previousMedia = await getMediaAssetsByOwnerIds(previousWordIds);

    await upsertImportedTopic(
      {
        id: topicId,
        title: preview.parsed.topic.title,
        category: preview.parsed.topic.category ?? null,
        level: preview.parsed.topic.level ?? null,
        lang: preview.parsed.topic.lang ?? null,
        description: preview.parsed.topic.description ?? null,
      },
      timestamp,
    );

    const words = preview.parsed.words.map((word, index) => ({
      sourceId: word.id,
      position: index + 1,
      nameVi: word.nameVi,
      chunk: word.chunk,
      ipa: word.ipa ?? null,
      meaningVi: word.meaningVi,
      imageUrl: preview.imageUrls.get(word.id) ?? (/^https?:\/\//i.test(word.imageUrl ?? '') ? word.imageUrl ?? null : null),
      audioUrl: preview.audioUrls.get(word.id) ?? (/^https?:\/\//i.test(word.audioUrl ?? '') ? word.audioUrl ?? null : null),
      exampleEn: word.exampleEn,
      exampleVi: word.exampleVi,
    }));

    await deleteMediaAssetsByOwnerIds(previousWordIds);
    const wordIds = await syncImportedWords(topicId, words, timestamp);

    // Insert media assets cho staged files
    for (const staged of preview.assets) {
      const wordId = wordIds.get(staged.sourceId);
      if (!wordId) continue;
      await insertMediaAsset({
        id: randomUUID(),
        owner_type: 'word',
        owner_id: wordId,
        media_kind: staged.mediaKind,
        original_ref: staged.originalRef,
        resolved_url: /^https?:\/\//i.test(staged.originalRef) ? staged.originalRef : null,
        storage_path: staged.storageName,
        mime_type: staged.mimeType,
        sha256: staged.sha256,
      });
    }

    // Insert media assets cho external URLs (Unsplash, etc.)
    for (const word of preview.parsed.words) {
      const wordId = wordIds.get(word.id);
      if (!wordId) continue;
      if (word.imageUrl && !preview.assets.some((a) => a.sourceId === word.id && a.mediaKind === 'image')) {
        await insertMediaAsset({
          id: randomUUID(),
          owner_type: 'word',
          owner_id: wordId,
          media_kind: 'image',
          original_ref: word.imageUrl,
          resolved_url: /^https?:\/\//i.test(word.imageUrl) ? (preview.imageUrls.get(word.id) ?? word.imageUrl) : null,
          storage_path: null,
          mime_type: null,
          sha256: null,
        });
      }
      if (word.audioUrl && !preview.assets.some((a) => a.sourceId === word.id && a.mediaKind === 'audio')) {
        await insertMediaAsset({
          id: randomUUID(),
          owner_type: 'word',
          owner_id: wordId,
          media_kind: 'audio',
          original_ref: word.audioUrl,
          resolved_url: /^https?:\/\//i.test(word.audioUrl) ? (preview.audioUrls.get(word.id) ?? word.audioUrl) : null,
          storage_path: null,
          mime_type: null,
          sha256: null,
        });
      }
    }
  } catch (error) {
    await Promise.all(newlyPublished.map((filePath) => unlink(filePath).catch(() => undefined)));
    await cleanPreview(previewId, preview);
    if (error instanceof AppError) throw error;
    if (error instanceof Error && /UNIQUE constraint/.test(error.message)) {
      throw new AppError(409, 'DUPLICATE_ENTITY', 'Chủ đề đã được thay đổi trong lúc import. Hãy tải lại tệp và thử lại.');
    }
    throw new AppError(500, 'IMPORT_FAILED', 'Không thể lưu chủ đề. Dữ liệu chưa được thay đổi.');
  }

  const stalePaths = previousMedia.map((row) => row.storage_path).filter((value): value is string => Boolean(value));
  await cleanPreview(previewId, preview);
  for (const storagePath of await getUnreferencedStoragePaths(stalePaths)) {
    await unlink(path.join(uploadsRoot, path.basename(storagePath))).catch((error: unknown) =>
      console.warn('Unable to remove unused topic media:', error),
    );
  }

  const result = {
    topicId,
    topic: await getTopicById(topicId),
    itemCount: preview.parsed.words.length,
    overwritten: exists && duplicateMode === 'overwrite',
  };
  completedPreviews.set(previewId, { result, expiresAt: Date.now() + PREVIEW_TTL_MS });
  return result;
}
