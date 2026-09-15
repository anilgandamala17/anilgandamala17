/**
 * FUTURE BACKEND:
 * POST /api/contact  { name, email, organization?, message } → { ok: true }
 * NOW: mockAdapter.saveContact(...)
 */

import { mockAdapter } from './mockAdapter'

export type ContactMessage = {
  name: string
  email: string
  organization?: string
  message: string
}

export async function submitContactMessage(data: ContactMessage): Promise<{ ok: true }> {
  return mockAdapter.saveContact(data)
}
