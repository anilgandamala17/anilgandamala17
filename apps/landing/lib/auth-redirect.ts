/** Post-auth destinations shared by login, signup, and social sign-in. */

export type AppRole = 'student' | 'teacher' | 'admin'

export const ROLE_HOME: Record<AppRole, string> = {
  student: '/student/mode-selection',
  teacher: '/teacher/dashboard',
  admin: '/admin/dashboard',
}

/**
 * Destinations a student can be sent to instead of the mode picker, once they
 * have already chosen a mode. Kept as an allow-list so a tampered hint can
 * never redirect somewhere unguarded.
 */
export const STUDENT_HOMES = [
  '/student/curriculum',
  '/student/competitive',
  '/student/dashboard',
] as const

export function sanitizeStudentHome(raw: string | null | undefined): string | null {
  if (!raw) return null
  return (STUDENT_HOMES as readonly string[]).includes(raw) ? raw : null
}

export function normalizeAppRole(role: unknown): AppRole {
  if (role === 'teacher' || role === 'admin') return role
  return 'student'
}

/** Safe in-app redirect paths only (blocks open redirects). */
export function sanitizeAppRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null
  if (decoded.includes('://')) return null
  const allowed =
    decoded === '/student' ||
    decoded.startsWith('/student/') ||
    decoded === '/teacher' ||
    decoded.startsWith('/teacher/') ||
    decoded === '/admin' ||
    decoded.startsWith('/admin/')
  return allowed ? decoded : null
}

/**
 * `studentHome` is the mode a returning student already picked. Passing it
 * skips the mode picker on every subsequent login.
 */
export function homeForRole(role: AppRole, studentHome?: string | null): string {
  if (role === 'student') {
    const remembered = sanitizeStudentHome(studentHome)
    if (remembered) return remembered
  }
  return ROLE_HOME[role]
}

/** True when redirect path belongs to the user's role (avoids RoleGuard bounce). */
export function redirectMatchesRole(
  redirect: string | null | undefined,
  role: AppRole,
): boolean {
  const safe = sanitizeAppRedirect(redirect)
  if (!safe) return false
  if (role === 'student') return safe === '/student' || safe.startsWith('/student/')
  if (role === 'teacher') return safe === '/teacher' || safe.startsWith('/teacher/')
  if (role === 'admin') return safe === '/admin' || safe.startsWith('/admin/')
  return false
}

/** Landing page where password users wait until they click the verification link. */
export function getVerifyEmailPath(redirect?: string | null): string {
  const safe = sanitizeAppRedirect(redirect)
  if (!safe) return '/verify-email'
  return `/verify-email?redirect=${encodeURIComponent(safe)}`
}

/**
 * Canonical destination right after authentication completes.
 * Students always land on Mode Selection (ignore remembered mode hints).
 * Teachers/admins keep their role dashboards.
 */
export function getPostAuthDestination(role: AppRole): string {
  return ROLE_HOME[role]
}

/**
 * Prefer an explicit safe `redirect` only when it matches Firestore role
 * AND (for students) is not a deep-link that skips Mode Selection.
 * Spec: every successful student auth ends at Mode Selection.
 */
export function resolvePostAuthPath(options: {
  redirect?: string | null
  role: AppRole
  studentHome?: string | null
}): string {
  if (options.role === 'student') {
    return ROLE_HOME.student
  }
  if (redirectMatchesRole(options.redirect, options.role)) {
    return sanitizeAppRedirect(options.redirect)!
  }
  return ROLE_HOME[options.role]
}
