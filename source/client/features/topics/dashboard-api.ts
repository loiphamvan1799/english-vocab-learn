import { fetchApi } from '@/lib/api-client';

import type { DashboardSummary } from './dashboard-types';

export function getDashboard(): Promise<DashboardSummary> {
  return fetchApi<DashboardSummary>('/api/dashboard');
}
