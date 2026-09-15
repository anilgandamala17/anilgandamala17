/**
 * Landing mock adapter — all landing network/data stubs go through here.
 *
 * FUTURE BACKEND: swap method bodies for fetch() to the documented routes
 * (or replace this module with httpAdapter). Components must call service
 * functions, never fetch('/api/...') directly.
 */

const DEMO_LAG_MS = 180

async function demoDelay(ms = DEMO_LAG_MS): Promise<void> {
  await new Promise((r) => setTimeout(r, ms))
}

function pushLocal(key: string, entry: unknown, max = 100): void {
  try {
    const prev = JSON.parse(localStorage.getItem(key) || '[]') as unknown[]
    const list = Array.isArray(prev) ? prev : []
    list.push(entry)
    localStorage.setItem(key, JSON.stringify(list.slice(-max)))
  } catch {
    /* ignore quota / private mode */
  }
}

export const mockAdapter = {
  /**
   * FUTURE BACKEND:
   * POST /api/auth/login  { email, password, role? } → { token, user }
   * NOW: any credentials succeed; session via mock-auth-session (auth service)
   */
  async login(_input: {
    email: string
    password: string
    role?: 'student' | 'teacher' | 'admin'
  }): Promise<{ ok: true }> {
    await demoDelay(120)
    return { ok: true }
  },

  /**
   * FUTURE BACKEND:
   * POST /api/auth/signup  { name, email, password, role, dateOfBirth? } → { token, user }
   * NOW: demo success (auth service persists local session)
   */
  async signup(_input: {
    name: string
    email: string
    password: string
    role?: 'student' | 'teacher' | 'admin'
    dateOfBirth?: string
  }): Promise<{ ok: true }> {
    await demoDelay(120)
    return { ok: true }
  },

  /**
   * FUTURE BACKEND:
   * POST /api/chat  { messages, language? } → stream / { reply }
   * NOW: local counselor demo reply
   */
  async chat(userMessage: string): Promise<string> {
    await demoDelay(220)
    const clipped =
      userMessage.length > 160 ? `${userMessage.slice(0, 160)}…` : userMessage
    return [
      `Thanks for reaching out! I'm AIra's learning counselor.`,
      ``,
      `You said: “${clipped}”`,
      ``,
      `For school learning, sign in as a **Student**, pick a mode, then open Curriculum → a topic in the tutor. Teachers land on the teacher dashboard.`,
      ``,
      `Tell me your grade and goal and I can suggest a clear next step.`,
    ].join('\n')
  },

  /**
   * FUTURE BACKEND:
   * POST /api/tts  { text, language? } → audio/mpeg
   * NOW: signal browser SpeechSynthesis fallback
   */
  async tts(_opts: { text: string; language?: string }): Promise<Blob> {
    await demoDelay(40)
    throw new Error('MOCK_TTS_USE_BROWSER_FALLBACK')
  },

  /**
   * FUTURE BACKEND:
   * POST /api/waitlist  { email, courseId?, courseName? } → { ok: true }
   * NOW: localStorage demo list
   */
  async joinWaitlist(entry: {
    email: string
    courseId?: string
    courseName?: string
  }): Promise<{ ok: true }> {
    await demoDelay(200)
    pushLocal('aira:demo-waitlist', { ...entry, at: new Date().toISOString() })
    return { ok: true }
  },

  /**
   * FUTURE BACKEND:
   * POST /api/contact  { name, email, organization?, message } → { ok: true }
   * NOW: localStorage demo inbox
   */
  async saveContact(message: {
    name: string
    email: string
    organization?: string
    message: string
  }): Promise<{ ok: true }> {
    await demoDelay(200)
    pushLocal('aira:demo-contact', { ...message, at: new Date().toISOString() }, 50)
    return { ok: true }
  },
}

export type LandingMockAdapter = typeof mockAdapter
