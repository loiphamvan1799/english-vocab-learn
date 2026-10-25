import path from 'node:path';

import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { errorHandler } from './middleware/error-handler.js';
import { dashboardRouter } from './routes/dashboard.js';
import { importsRouter } from './routes/imports.js';
import { topicsRouter } from './routes/topics.js';
import { wordsRouter } from './routes/words.js';
import { sendError, sendSuccess } from './shared/api-response.js';

// ─── Khởi tạo Express app ────────────────────────────────────────────────────

const app = express();
const uploadsRoot = path.resolve(process.cwd(), 'uploads');

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    name: 'english-vocab-api',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/topics', topicsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/words', wordsRouter);
app.use('/api/imports', importsRouter);

app.use(
  '/uploads',
  express.static(uploadsRoot, {
    index: false,
    redirect: false,
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  }),
);

app.get('/', (_req, res) => {
  sendSuccess(res, {
    ok: true,
    message: 'English Vocabulary API is running.',
  });
});

app.use((req, res) => {
  sendError(res, 404, 'NOT_FOUND', 'Resource not found.', { path: req.originalUrl });
});

app.use(errorHandler);

// ─── Khởi động server sau khi migration hoàn tất (async) ────────────────────

runMigrations()
  .then(() => {
    const server = app.listen(env.SERVER_PORT, () => {
      console.log(`API listening on http://localhost:${env.SERVER_PORT}`);
      console.log(`Database: ${process.env.TURSO_DATABASE_URL ? 'Turso Cloud (production)' : 'SQLite local file'}`);
    });

    const shutdown = () => {
      server.close(() => {
        console.log('Server shutdown complete');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch((error: unknown) => {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  });
