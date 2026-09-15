/**
 * Content pipeline status / regenerate — admin UI only.
 *
 * FUTURE BACKEND:
 * GET  /api/content/status?topicId → ContentStatusRow[]
 * POST /api/content/regenerate { topicId, scope, ... } → { ok, jobId? }
 * NOW: mockAdapter.fetchContentStatus / regenerateContent
 */

import { mockAdapter, type MockContentStatusRow } from './adapters/mockAdapter'

export type ContentStatusRow = MockContentStatusRow

export async function fetchContentStatus(topicId: string): Promise<ContentStatusRow[]> {
  return mockAdapter.fetchContentStatus(topicId)
}

export async function regenerateContent(input: {
  topicId: string
  scope: string
  extra?: Record<string, string>
}): Promise<{ ok: true; message: string }> {
  return mockAdapter.regenerateContent(input)
}
