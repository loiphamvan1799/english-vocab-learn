import multer from 'multer';
import path from 'node:path';
import type { Request } from 'express';
import type { StorageEngine } from 'multer';

import { env } from '../config/env.js';

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const audioExtensions = new Set(['.mp3', '.wav', '.ogg', '.m4a']);

const aggregateMemoryStorage: StorageEngine = {
  _handleFile: (req: Request, file, callback) => {
    const chunks: Buffer[] = [];
    let fileBytes = 0;
    let requestBytes = Number((req as Request & { importRequestBytes?: number }).importRequestBytes ?? 0);
    let completed = false;
    const finish = (error: NodeJS.ErrnoException | null, info?: { buffer: Buffer; size: number }) => {
      if (completed) return;
      completed = true;
      callback(error, info);
    };
    file.stream.on('data', (chunk: Buffer) => {
      if (completed) return;
      fileBytes += chunk.length;
      requestBytes += chunk.length;
      (req as Request & { importRequestBytes?: number }).importRequestBytes = requestBytes;
      const fileLimit = file.fieldname === 'html' ? env.IMPORT_HTML_MAX_BYTES : env.IMPORT_MEDIA_MAX_BYTES;
      if (requestBytes > env.IMPORT_TOTAL_MAX_BYTES || fileBytes > fileLimit) {
        file.stream.destroy(Object.assign(new Error('UPLOAD_TOO_LARGE'), { code: 'UPLOAD_TOO_LARGE' }));
        return;
      }
      chunks.push(chunk);
    });
    file.stream.once('error', (error) => finish(error as NodeJS.ErrnoException));
    file.stream.once('end', () => finish(null, { buffer: Buffer.concat(chunks), size: fileBytes }));
  },
  _removeFile: (_req: Request, _file: Express.Multer.File, callback) => {
    callback(null);
  },
};

export const topicImportUpload = multer({
  storage: aggregateMemoryStorage,
  limits: {
    fileSize: env.IMPORT_MEDIA_MAX_BYTES,
    files: env.IMPORT_MAX_FILES,
    fields: 8,
    parts: env.IMPORT_MAX_FILES + 8,
  },
  fileFilter: (_req, file, callback) => {
    if (file.fieldname === 'html') {
      const extension = path.extname(file.originalname).toLowerCase();
      if (extension !== '.html' && extension !== '.htm') {
        callback(new Error('HTML_REQUIRED'));
        return;
      }
      callback(null, true);
      return;
    }
    const extension = path.extname(file.originalname).toLowerCase();
    if (file.fieldname !== 'assets[]' || (!imageExtensions.has(extension) && !audioExtensions.has(extension))) {
      callback(new Error('MEDIA_UNSAFE'));
      return;
    }
    callback(null, true);
  },
});

export const topicImportFields = topicImportUpload.fields([
  { name: 'html', maxCount: 1 },
  { name: 'assets[]', maxCount: env.IMPORT_MAX_FILES - 1 },
]);
