import { Router, type Request } from 'express';
import { z } from 'zod';

import { env } from '../config/env.js';
import { topicImportFields } from '../middleware/upload.js';
import { AppError, sendSuccess } from '../shared/api-response.js';
import { confirmTopicImport, previewTopicImport } from '../services/topic-import-service.js';

const importsRouter = Router();
const confirmSchema = z.object({
  previewId: z.string().uuid(),
  duplicateMode: z.enum(['overwrite', 'create-copy', 'cancel']),
}).strict();

function uploadFiles(req: Request) {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  return { html: files?.html?.[0], assets: files?.['assets[]'] ?? [] };
}

importsRouter.post('/topics/preview', topicImportFields, async (req, res, next) => {
  try {
    const { html, assets } = uploadFiles(req);
    if (!html) throw new AppError(400, 'HTML_REQUIRED', 'Vui lòng chọn một tệp HTML hợp lệ.');
    if (html.size > env.IMPORT_HTML_MAX_BYTES) throw new AppError(413, 'UPLOAD_TOO_LARGE', 'Tệp vượt quá dung lượng cho phép. Hãy chọn tệp nhỏ hơn.');
    const total = html.size + assets.reduce((sum, asset) => sum + asset.size, 0);
    if (total > env.IMPORT_TOTAL_MAX_BYTES) throw new AppError(413, 'UPLOAD_TOO_LARGE', 'Tổng dung lượng tệp vượt quá giới hạn cho phép.');
    let htmlText: string;
    try {
      htmlText = new TextDecoder('utf-8', { fatal: true }).decode(html.buffer);
    } catch {
      throw new AppError(422, 'HTML_PARSE_FAILED', 'Không đọc được cấu trúc HTML. Hãy kiểm tra tệp theo template.');
    }
    const preview = await previewTopicImport(htmlText, assets);
    sendSuccess(res, preview);
  } catch (error) {
    next(error);
  }
});

importsRouter.post('/topics/confirm', async (req, res, next) => {
  try {
    const parsed = confirmSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'REQUEST_INVALID', 'Thông tin xác nhận import không hợp lệ.');
    const result = await confirmTopicImport(parsed.data.previewId, parsed.data.duplicateMode);
    if ('cancelled' in result) {
      sendSuccess(res, result);
      return;
    }
    sendSuccess(res, result, result.overwritten ? 200 : 201);
  } catch (error) {
    next(error);
  }
});

export { importsRouter };
