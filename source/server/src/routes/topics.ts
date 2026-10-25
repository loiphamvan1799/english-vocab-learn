import { Router } from 'express';
import { z } from 'zod';

import { getTopicById, getTopicSummaries } from '../db/repositories/topics.js';
import { getWordsByTopicId } from '../db/repositories/words.js';
import { deleteTopic } from '../services/topics-service.js';
import { AppError, sendSuccess } from '../shared/api-response.js';

const topicsRouter = Router();
const querySchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
});

const normalizeStatus = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  return value.trim().toLowerCase();
};

topicsRouter.get('/', async (req, res, next) => {
  try {
    const parsed = querySchema.parse(req.query);
    const keyword = (parsed.q ?? '').trim().toLowerCase();
    const requestedStatus = normalizeStatus(parsed.status);

    let topics = await getTopicSummaries();

    if (keyword) {
      topics = topics.filter((topic) => {
        const haystack = `${topic.title} ${topic.category ?? ''} ${topic.description ?? ''}`.toLowerCase();
        return haystack.includes(keyword);
      });
    }

    if (requestedStatus) {
      topics = topics.filter((topic) => topic.status === requestedStatus);
    }

    sendSuccess(res, topics);
  } catch (error) {
    next(error);
  }
});

topicsRouter.get('/:topicId', async (req, res, next) => {
  try {
    const topic = await getTopicById(req.params.topicId);

    if (!topic) {
      throw new AppError(404, 'TOPIC_NOT_FOUND', 'Topic not found.');
    }

    const words = await getWordsByTopicId(topic.id);

    sendSuccess(res, {
      ...topic,
      words,
      word_count: words.length,
    });
  } catch (error) {
    next(error);
  }
});

topicsRouter.delete('/:topicId', async (req, res, next) => {
  try {
    await deleteTopic(req.params.topicId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { topicsRouter };
