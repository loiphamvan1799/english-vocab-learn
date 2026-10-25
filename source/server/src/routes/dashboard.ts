import { Router } from 'express';

import { getDashboardSummary } from '../services/dashboard-service.js';
import { sendSuccess } from '../shared/api-response.js';

const dashboardRouter = Router();

dashboardRouter.get('/', async (_req, res, next) => {
  try {
    sendSuccess(res, await getDashboardSummary());
  } catch (error) {
    next(error);
  }
});

export { dashboardRouter };
