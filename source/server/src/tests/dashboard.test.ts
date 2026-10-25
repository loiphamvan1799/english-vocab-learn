import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveTopicProgress } from '../db/repositories/progress.js';
import { getCurrentStreak, getDashboardSummary } from '../services/dashboard-service.js';

test('topic progress derives empty, not started, in progress, and completed states', () => {
  assert.deepEqual(deriveTopicProgress(0, 0, 0), { status: 'not_started', progress: 0 });
  assert.deepEqual(deriveTopicProgress(10, 0, 0), { status: 'not_started', progress: 0 });
  assert.deepEqual(deriveTopicProgress(10, 4, 2), { status: 'in_progress', progress: 20 });
  assert.deepEqual(deriveTopicProgress(10, 10, 10), { status: 'completed', progress: 100 });
});

test('streak counts consecutive local calendar dates and allows today to be not studied yet', () => {
  assert.equal(getCurrentStreak([], '2026-10-21'), 0);
  assert.equal(getCurrentStreak(['2026-10-21', '2026-10-20', '2026-10-19'], '2026-10-21'), 3);
  assert.equal(getCurrentStreak(['2026-10-20', '2026-10-19'], '2026-10-21'), 2);
  assert.equal(getCurrentStreak(['2026-10-21', '2026-10-19'], '2026-10-21'), 1);
});

test('getDashboardSummary returns valid schema without throwing 500', async () => {
  const summary = await getDashboardSummary();
  assert.ok(summary);
  assert.ok(summary.overview);
  assert.equal(typeof summary.overview.studiedTotal, 'number');
  assert.equal(typeof summary.overview.masteredTotal, 'number');
  assert.equal(typeof summary.overview.studiedToday, 'number');
  assert.equal(typeof summary.overview.dailyWordGoal, 'number');
  assert.equal(typeof summary.overview.currentStreak, 'number');
  assert.equal(typeof summary.overview.completedTopics, 'number');
  assert.ok(Array.isArray(summary.topics));
  if (summary.resume) {
    assert.equal(typeof summary.resume.topicId, 'string');
    assert.equal(typeof summary.resume.position, 'number');
    assert.equal(typeof summary.resume.hasProgress, 'boolean');
  }
});
