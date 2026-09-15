/**
 * FUTURE BACKEND:
 * POST /api/chat  { messages, language? } → stream or { reply: string }
 * NOW: mockAdapter.chat(...)
 */

import { mockAdapter } from './mockAdapter'

export async function sendCounselorMessage(userMessage: string): Promise<string> {
  return mockAdapter.chat(userMessage)
}
