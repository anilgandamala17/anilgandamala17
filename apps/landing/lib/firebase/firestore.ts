/**
 * Legacy Firestore-shaped helpers — now route through services/mockAdapter.
 *
 * FUTURE BACKEND:
 * POST /api/contact   { name, email, organization?, message }
 * POST /api/waitlist  { email, courseId, courseName }
 * NOW: mockAdapter via contactService / waitlistService
 */

import { submitContactMessage, type ContactMessage } from '@/lib/services/contactService'
import { joinWaitlist } from '@/lib/services/waitlistService'

export type { ContactMessage }

export type WaitlistEntry = {
  email: string
  courseId: string
  courseName: string
}

export async function saveContactMessage(data: ContactMessage): Promise<void> {
  await submitContactMessage(data)
}

export async function saveWaitlistEntry(data: WaitlistEntry): Promise<void> {
  await joinWaitlist(data)
}
