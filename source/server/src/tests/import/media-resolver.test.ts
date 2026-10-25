import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { resolveTopicMedia } from '../../import/media-resolver.js';
import type { TopicWordInput } from '../../import/schemas.js';

const baseWord: TopicWordInput = {
  id: 'mango', imageUrl: null, nameVi: 'Xoài', chunk: 'a ripe mango', ipa: null,
  meaningVi: 'Một quả xoài chín', exampleEn: 'A [[ripe mango]].', exampleVi: 'Xoài chín.',
};

test('rejects relative media traversal instead of resolving outside the upload package', async () => {
  const stage = await mkdtemp(path.join(os.tmpdir(), 'topic-media-'));
  try {
    await assert.rejects(
      resolveTopicMedia([{ ...baseWord, imageUrl: '../secret.png' }], [], stage),
      (error: unknown) => error instanceof Error && error.message === 'MEDIA_UNSAFE',
    );
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
});

test('validates a data image by allowlisted MIME and file signature', async () => {
  const stage = await mkdtemp(path.join(os.tmpdir(), 'topic-media-'));
  try {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
    const ref = `data:image/png;base64,${png.toString('base64')}`;
    const result = await resolveTopicMedia([{ ...baseWord, imageUrl: ref }], [], stage);
    assert.equal(result.media.length, 1);
    assert.equal(result.media[0].mimeType, 'image/png');
    assert.equal(result.imageUrls.get('mango')?.startsWith('/uploads/'), true);
    assert.deepEqual(result.warnings, []);
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
});

test('rejects data images with a MIME/signature mismatch', async () => {
  const stage = await mkdtemp(path.join(os.tmpdir(), 'topic-media-'));
  try {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    const ref = `data:image/png;base64,${jpeg.toString('base64')}`;
    await assert.rejects(
      resolveTopicMedia([{ ...baseWord, imageUrl: ref }], [], stage),
      (error: unknown) => error instanceof Error && error.message === 'MEDIA_UNSAFE',
    );
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
});

test('rejects external media URLs resolving to private or loopback addresses', async () => {
  const stage = await mkdtemp(path.join(os.tmpdir(), 'topic-media-'));
  try {
    for (const url of ['http://127.0.0.1/private.png', 'http://169.254.169.254/latest/meta-data/']) {
      await assert.rejects(
        resolveTopicMedia([{ ...baseWord, imageUrl: url }], [], stage),
        (error: unknown) => error instanceof Error && error.message === 'MEDIA_UNSAFE',
      );
    }
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
});
