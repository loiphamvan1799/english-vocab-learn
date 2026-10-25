import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isIP } from 'node:net';
import { Agent, fetch as undiciFetch } from 'undici';

import type { Express } from 'express';

import type { ImportWarning, TopicWordInput } from './schemas.js';

const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/ogg': '.ogg', 'audio/mp4': '.m4a',
};
const ALLOWED_MIMES = new Set(Object.keys(MIME_EXTENSIONS));

class UnsafeMediaError extends Error {}

export type StagedMedia = {
  sourceId: string;
  mediaKind: 'image' | 'audio';
  originalRef: string;
  stagedPath: string;
  storageName: string;
  mimeType: string;
  sha256: string;
};

export type ResolvedMedia = {
  media: StagedMedia[];
  imageUrls: Map<string, string>;
  audioUrls: Map<string, string>;
  warnings: ImportWarning[];
};

function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const [a, b] = address.split('.').map(Number);
    const [c] = address.split('.').slice(2).map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 2 || b === 168)) || (a === 198 && (b === 18 || b === 19 || b === 51 && c === 100)) || (a === 203 && b === 0 && c === 113) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (version === 6) {
    const normalized = address.toLowerCase();
    const mappedDotted = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    if (mappedDotted) return isPrivateAddress(mappedDotted);
    const mappedHex = normalized.match(/^::ffff:([\da-f]{1,4}):([\da-f]{1,4})$/);
    if (mappedHex) {
      const high = Number.parseInt(mappedHex[1], 16);
      const low = Number.parseInt(mappedHex[2], 16);
      return isPrivateAddress(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
    }
    return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb') || normalized.startsWith('::ffff:127.') || normalized.startsWith('::ffff:10.') || normalized.startsWith('::ffff:192.168.');
  }
  return true;
}

async function getPublicAddresses(hostname: string): Promise<Array<{ address: string; family: number }>> {
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) throw new UnsafeMediaError('private host');
  const records = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await lookup(hostname, { all: true, verbatim: true });
  if (records.length === 0 || records.some((record) => isPrivateAddress(record.address))) throw new UnsafeMediaError('private host');
  return records;
}

function detectMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) return 'image/gif';
  if (buffer.length >= 3 && buffer.toString('ascii', 0, 3) === 'ID3') return 'audio/mpeg';
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return 'audio/mpeg';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE') return 'audio/wav';
  if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'OggS') return 'audio/ogg';
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') return 'audio/mp4';
  return null;
}

function parseDataUri(ref: string): { buffer: Buffer; mimeType: string } {
  const match = /^data:(image\/(?:jpeg|png|webp|gif)|audio\/(?:mpeg|wav|ogg|mp4));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(ref);
  if (!match) throw new Error('unsafe data uri');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0 || buffer.length > MAX_MEDIA_BYTES || buffer.toString('base64').replace(/=+$/, '') !== match[2].replace(/=+$/, '')) throw new Error('invalid data uri');
  const mimeType = detectMime(buffer);
  if (!mimeType || mimeType !== match[1].toLowerCase()) throw new Error('mime mismatch');
  return { buffer, mimeType };
}

async function fetchExternal(ref: string): Promise<{ buffer: Buffer; mimeType: string }> {
  let url = new URL(ref);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new UnsafeMediaError('unsafe url');
    const publicAddresses = await getPublicAddresses(url.hostname);
    const pinnedLookup = (hostname: string, options: { all?: boolean }, callback: (error: NodeJS.ErrnoException | null, address: string | Array<{ address: string; family: number }>, family?: number) => void) => {
      if (hostname.toLowerCase() !== url.hostname.toLowerCase()) {
        callback(Object.assign(new Error('Unexpected hostname'), { code: 'ENOTFOUND' }), '', 0);
        return;
      }
      if (options.all) callback(null, publicAddresses);
      else callback(null, publicAddresses[0].address, publicAddresses[0].family);
    };
    const dispatcher = new Agent({ connect: { lookup: pinnedLookup } });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let response: Awaited<ReturnType<typeof undiciFetch>>;
    try {
      response = await undiciFetch(url, { redirect: 'manual', signal: controller.signal, headers: { accept: [...ALLOWED_MIMES].join(',') }, dispatcher });
    } catch (error) {
      clearTimeout(timeout);
      await dispatcher.close();
      throw error;
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel().catch(() => undefined);
      if (!location || redirects === 3) {
        clearTimeout(timeout);
        await dispatcher.close();
        throw new Error('redirect limit');
      }
      await dispatcher.close();
      url = new URL(location, url);
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      clearTimeout(timeout);
      await dispatcher.close();
      throw new Error('download failed');
    }
    const declaredMime = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!ALLOWED_MIMES.has(declaredMime)) {
      await response.body?.cancel().catch(() => undefined);
      clearTimeout(timeout);
      await dispatcher.close();
      throw new Error('unsupported mime');
    }
    const declaredLength = Number(response.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_MEDIA_BYTES) {
      await response.body?.cancel().catch(() => undefined);
      clearTimeout(timeout);
      await dispatcher.close();
      throw new Error('too large');
    }
    try {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('empty response');
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_MEDIA_BYTES) {
          await reader.cancel();
          throw new Error('too large');
        }
        chunks.push(value);
      }
      const buffer = Buffer.concat(chunks);
      const mimeType = detectMime(buffer);
      if (!mimeType || mimeType !== declaredMime) throw new Error('mime mismatch');
      return { buffer, mimeType };
    } finally {
      clearTimeout(timeout);
      await dispatcher.close();
    }
  }
  throw new Error('redirect limit');
}

function resolveCompanion(ref: string, assets: Express.Multer.File[]): Express.Multer.File {
  const normalized = ref.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized) || normalized.split('/').some((part) => part === '..' || part === '.')) throw new Error('unsafe path');
  const file = assets.find((asset) => asset.originalname.replace(/\\/g, '/') === normalized);
  if (!file) throw new Error('not found');
  if (file.size > MAX_MEDIA_BYTES) throw new Error('too large');
  const mimeType = detectMime(file.buffer);
  if (!mimeType || !ALLOWED_MIMES.has(mimeType)) throw new Error('unsupported mime');
  return file;
}

export async function resolveTopicMedia(words: TopicWordInput[], assets: Express.Multer.File[], stageDirectory: string): Promise<ResolvedMedia> {
  await mkdir(stageDirectory, { recursive: true });
  const media: StagedMedia[] = [];
  const imageUrls = new Map<string, string>();
  const audioUrls = new Map<string, string>();
  const warnings: ImportWarning[] = [];
  const deduplicated = new Map<string, StagedMedia>();

  const resolveAsset = async (word: TopicWordInput, refValue: string | null | undefined, mediaKind: 'image' | 'audio'): Promise<void> => {
    const ref = refValue?.trim();
    if (!ref) return;
    try {
      let buffer: Buffer;
      let mimeType: string;
      if (ref.startsWith('data:')) {
        ({ buffer, mimeType } = parseDataUri(ref));
      } else if (/^https?:\/\//i.test(ref)) {
        ({ buffer, mimeType } = await fetchExternal(ref));
      } else {
        const companion = resolveCompanion(ref, assets);
        buffer = companion.buffer;
        mimeType = detectMime(buffer)!;
      }
      if (mediaKind === 'image' && !mimeType.startsWith('image/')) throw new UnsafeMediaError('image field contains non-image media');
      if (mediaKind === 'audio' && !mimeType.startsWith('audio/')) throw new UnsafeMediaError('audio field contains non-audio media');
      const sha256 = createHash('sha256').update(buffer).digest('hex');
      const extension = MIME_EXTENSIONS[mimeType];
      const storageName = `${sha256.slice(0, 32)}${extension}`;
      let staged = deduplicated.get(storageName);
      if (!staged) {
        const stagedPath = path.join(stageDirectory, storageName);
        await writeFile(stagedPath, buffer, { flag: 'wx' }).catch(async (error: NodeJS.ErrnoException) => {
          if (error.code !== 'EEXIST') throw error;
        });
        staged = { sourceId: word.id, mediaKind, originalRef: ref, stagedPath, storageName, mimeType, sha256 };
        deduplicated.set(storageName, staged);
      }
      media.push({ ...staged, sourceId: word.id, mediaKind, originalRef: ref });
      (mediaKind === 'image' ? imageUrls : audioUrls).set(word.id, `/uploads/${storageName}`);
    } catch (error) {
      if (error instanceof UnsafeMediaError || error instanceof Error && ['unsafe path', 'unsupported mime', 'mime mismatch', 'unsafe data uri', 'invalid data uri'].includes(error.message)) {
        throw new Error('MEDIA_UNSAFE');
      }
      if (/^https?:\/\//i.test(ref)) {
        warnings.push({ code: 'MEDIA_DOWNLOAD_FAILED', message: `Không tải được media từ liên kết: ${ref}. Liên kết gốc sẽ được giữ lại.` });
        (mediaKind === 'image' ? imageUrls : audioUrls).set(word.id, ref);
      } else if (mediaKind === 'image') {
        warnings.push({ code: 'MEDIA_NOT_FOUND', message: `Không tìm thấy tệp ảnh đi kèm: ${ref}.` });
      } else {
        warnings.push({ code: 'MEDIA_NOT_FOUND', message: `Không tìm thấy tệp âm thanh đi kèm: ${ref}.` });
      }
    }
  };
  const resolveWord = async (word: TopicWordInput): Promise<void> => {
    if (!word.imageUrl) warnings.push({ code: 'MEDIA_NOT_FOUND', message: `Không tìm thấy ảnh cho mục từ “${word.chunk}”; giao diện sẽ dùng ảnh thay thế.` });
    await resolveAsset(word, word.imageUrl, 'image');
    await resolveAsset(word, word.audioUrl, 'audio');
  };
  for (let start = 0; start < words.length; start += 6) {
    const results = await Promise.allSettled(words.slice(start, start + 6).map(resolveWord));
    const rejected = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
    if (rejected) throw rejected.reason;
  }
  return { media, imageUrls, audioUrls, warnings };
}
