import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_PORT: z.coerce.number().optional(),
  PORT: z.coerce.number().optional(),
  SERVER_PORT: z.coerce.number().optional(),
  CLIENT_ORIGIN: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  API_BASE_URL: z.string().default('http://localhost:4000'),
  NEXT_PUBLIC_API_BASE_URL: z.string().default('http://localhost:4000'),
  IMPORT_HTML_MAX_BYTES: z.coerce.number().int().positive().default(2 * 1024 * 1024),
  IMPORT_MEDIA_MAX_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  IMPORT_TOTAL_MAX_BYTES: z.coerce.number().int().positive().default(50 * 1024 * 1024),
  IMPORT_MAX_FILES: z.coerce.number().int().positive().default(32),
});

const parsed = envSchema.parse(process.env);

const defaultAllowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const parsedAllowedOrigins = (parsed.ALLOWED_ORIGINS ?? parsed.CLIENT_ORIGIN ?? defaultAllowedOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  ...parsed,
  SERVER_PORT: parsed.PORT ?? parsed.SERVER_PORT ?? 4000,
  ALLOWED_ORIGINS: parsedAllowedOrigins.length > 0 ? parsedAllowedOrigins : defaultAllowedOrigins,
};
