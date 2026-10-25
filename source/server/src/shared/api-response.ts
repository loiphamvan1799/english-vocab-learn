export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiEnvelope<T> = {
  data: T | null;
  error: ApiErrorPayload | null;
};

export function sendSuccess<T>(res: any, data: T, status = 200): any {
  return res.status(status).json({
    data,
    error: null,
  } satisfies ApiEnvelope<T>);
}

export function sendError(
  res: any,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): any {
  return res.status(status).json({
    data: null,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  } satisfies ApiEnvelope<null>);
}

export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
