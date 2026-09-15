/**
 * FUTURE BACKEND:
 * POST /api/waitlist  { email, courseId?, courseName? } → { ok: true }
 * NOW: mockAdapter.joinWaitlist(...)
 */

import { mockAdapter } from './mockAdapter'

export async function joinWaitlist(entry: {
  email: string
  courseId?: string
  courseName?: string
}): Promise<{ ok: true }> {
  return mockAdapter.joinWaitlist(entry)
}
