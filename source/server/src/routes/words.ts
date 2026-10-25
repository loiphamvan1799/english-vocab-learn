import { Router } from 'express';
import { z } from 'zod';

import { getWordById, searchWords } from '../db/repositories/words.js';
import { AppError, sendSuccess } from '../shared/api-response.js';

const wordsRouter = Router();

const searchSchema = z.object({
  q: z.string().trim().min(1).default(''),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const progressSchema = z.object({
  isMastered: z.boolean(),
});

wordsRouter.get('/search', async (req, res, next) => {
  try {
    const parsed = searchSchema.parse(req.query);

    if (!parsed.q) {
      sendSuccess(res, []);
      return;
    }

    const results = await searchWords(parsed.q, parsed.limit);
    sendSuccess(res, results);
  } catch (error) {
    next(error);
  }
});

wordsRouter.patch('/:wordId/progress', async (req, res, next) => {
  try {
    const wordId = req.params.wordId;
    const parsed = progressSchema.parse(req.body);
    const word = await getWordById(wordId);

    if (!word) {
      throw new AppError(404, 'WORD_NOT_FOUND', 'Word not found.');
    }

    sendSuccess(res, {
      wordId: word.id,
      isMastered: parsed.isMastered,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export { wordsRouter };
