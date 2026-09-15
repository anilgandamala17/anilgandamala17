/**
 * FUTURE BACKEND:
 * GET /api/admin/analytics?preset&start&end → AdminAnalyticsReport
 * NOW: mockAdapter.fetchAdminAnalytics(...)
 */

import { mockAdapter, type AnalyticsDatePreset } from './adapters/mockAdapter'
import type { AdminAnalyticsReport } from './adminAnalyticsTypes'

export type { AdminAnalyticsReport } from './adminAnalyticsTypes'
export type { AnalyticsDatePreset }

export async function fetchAdminProductAnalytics(params: {
  preset: AnalyticsDatePreset
  start?: string
  end?: string
}): Promise<AdminAnalyticsReport> {
  return mockAdapter.fetchAdminAnalytics(params)
}
