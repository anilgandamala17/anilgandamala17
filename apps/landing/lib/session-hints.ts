/**
 * Cross-app session hints stored in localStorage.
 *
 * The landing app and the tutor SPA share a browser origin (Next rewrites in
 * production, the dev proxy locally), so both can read and write these keys.
 *
 * Everything here is a *hint*: the role is still verified against Firestore and
 * the tutor's RoleGuard, and the student home is validated against an
 * allow-list. A missing or stale hint only costs a slower redirect, never
 * access to something the user should not see.
 */

import {
  normalizeAppRole,
  sanitizeStudentHome,
  type AppRole,
} from '@/lib/auth-redirect'

const ROLE_KEY = 'aira:role'
const STUDENT_HOME_KEY = 'aira:student-home'

function read(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* private mode / quota — hints are optional */
  }
}

function remove(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* no-op */
  }
}

/** Last verified role, or null on first login / after sign-out. */
export function readRoleHint(): AppRole | null {
  const raw = read(ROLE_KEY)
  if (raw !== 'student' && raw !== 'teacher' && raw !== 'admin') return null
  return normalizeAppRole(raw)
}

export function writeRoleHint(role: AppRole): void {
  write(ROLE_KEY, role)
}

/** The mode a returning student already chose, or null if they never have. */
export function readStudentHomeHint(): string | null {
  return sanitizeStudentHome(read(STUDENT_HOME_KEY))
}

export function writeStudentHomeHint(path: string): void {
  const safe = sanitizeStudentHome(path)
  if (safe) write(STUDENT_HOME_KEY, safe)
}

/**
 * Called on sign-out. Drop role and mode hints so the next person on this
 * device is not routed as the previous user.
 */
export function clearRoleHint(): void {
  remove(ROLE_KEY)
  remove(STUDENT_HOME_KEY)
}
