import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { AppError, sendError } from '../shared/api-response.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.status, err.code, err.message, err.details);
    return;
  }

  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FIELD_VALUE';
    sendError(res, tooLarge ? 413 : 400, tooLarge ? 'UPLOAD_TOO_LARGE' : 'UPLOAD_INVALID', tooLarge ? 'Tệp vượt quá dung lượng cho phép. Hãy chọn tệp nhỏ hơn.' : 'Tệp tải lên không hợp lệ hoặc vượt quá số lượng cho phép.');
    return;
  }

  if (err instanceof Error && ['HTML_REQUIRED', 'MEDIA_UNSAFE', 'UPLOAD_TOO_LARGE'].includes(err.message)) {
    const status = err.message === 'UPLOAD_TOO_LARGE' ? 413 : 422;
    const message = err.message === 'HTML_REQUIRED' ? 'Vui lòng chọn một tệp HTML hợp lệ.' : err.message === 'UPLOAD_TOO_LARGE' ? 'Tổng dung lượng tệp vượt quá giới hạn cho phép.' : 'Đường dẫn hoặc loại tệp media không an toàn.';
    sendError(res, status, err.message, message);
    return;
  }

  if (err instanceof Error) {
    console.error('Unhandled API error:', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.', {
      message: 'Unexpected server error.',
    });
    return;
  }

  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
}
