// FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md
/**
 * Shared demo session (localStorage). Landing + Tutor share origin via
 * Next rewrites in production / the local proxy, so both apps can read this key.
 */

import { normalizeAppRole, type AppRole } from '@/lib/auth-redirect'
import { writeRoleHint, clearRoleHint } from '@/lib/session-hints'

export const DEMO_SESSION_KEY = 'aira:demo-session'
export const DEMO_SESSION_EVENT = 'aira:demo-session-changed'

export type DemoSession = {
  uid: string
  email: string
  displayName: string
  role: AppRole
  emailVerified: true
  photoURL: string | null
  /** Firebase-compatible provider id string for UI mapping. */
  providerId: string
  createdAt: string
}

export type MockUser = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  providerData: Array<{ providerId: string }>
  metadata: { creationTime?: string }
  reload: () => Promise<void>
}

export type MockUserCredential = {
  user: MockUser
}

function safeParse(raw: string | null): DemoSession | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<DemoSession>
    if (!data || typeof data.uid !== 'string' || typeof data.email !== 'string') return null
    return {
      uid: data.uid,
      email: data.email,
      displayName: typeof data.displayName === 'string' ? data.displayName : data.email.split('@')[0],
      role: normalizeAppRole(data.role),
      emailVerified: true,
      photoURL: data.photoURL ?? null,
      providerId: typeof data.providerId === 'string' ? data.providerId : 'password',
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

function emitChange(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new Event(DEMO_SESSION_EVENT))
  } catch {
    /* ignore */
  }
}

export function readDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null
  try {
    return safeParse(window.localStorage.getItem(DEMO_SESSION_KEY))
  } catch {
    return null
  }
}

export function writeDemoSession(session: DemoSession): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session))
    writeRoleHint(session.role)
  } catch {
    /* private mode / quota */
  }
  emitChange()
}

export function clearDemoSession(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(DEMO_SESSION_KEY)
  } catch {
    /* ignore */
  }
  clearRoleHint()
  emitChange()
}

export function sessionToMockUser(session: DemoSession): MockUser {
  return {
    uid: session.uid,
    email: session.email,
    displayName: session.displayName,
    photoURL: session.photoURL,
    emailVerified: true,
    providerData: [{ providerId: session.providerId }],
    metadata: { creationTime: session.createdAt },
    reload: async () => {
      /* FRONTEND-ONLY: no Firebase reload */
    },
  }
}

export function createDemoSession(input: {
  email: string
  displayName?: string
  role?: AppRole
  providerId?: string
  photoURL?: string | null
}): DemoSession {
  const email = input.email.trim().toLowerCase()
  const role =
    normalizeAppRole(input.role) === 'admin' ? 'student' : normalizeAppRole(input.role)
  const displayName =
    input.displayName?.trim() || email.split('@')[0] || 'Demo Student'
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = (Math.imul(31, hash) + email.charCodeAt(i)) | 0
  }
  return {
    uid: `demo_${Math.abs(hash).toString(36)}_${email.length}`,
    email,
    displayName,
    role,
    emailVerified: true,
    photoURL: input.photoURL ?? null,
    providerId: input.providerId ?? 'password',
    createdAt: new Date().toISOString(),
  }
}

/** Subscribe to session changes (same tab + storage events from other tabs). */
export function subscribeDemoSession(listener: (session: DemoSession | null) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const notify = () => listener(readDemoSession())
  const onStorage = (e: StorageEvent) => {
    if (e.key === DEMO_SESSION_KEY || e.key === null) notify()
  }

  window.addEventListener(DEMO_SESSION_EVENT, notify)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(DEMO_SESSION_EVENT, notify)
    window.removeEventListener('storage', onStorage)
  }
}
