/**
 * Centralized cross-app navigation for the tutor SPA.
 * All localhost/origin resolution lives here — do not scatter hardcoded URLs.
 */
import { writeStudentHomeHint } from './sessionHints'
import { studentRoutes, teacherRoutes, adminRoutes } from '@/utils/routes'
import { getLandingLoginUrl, getLandingOrigin, TUTOR_STANDALONE_PORTS } from './authSession'

export type StudentMode = 'curriculum' | 'competitive' | 'dashboard'

const STUDENT_MODE_PATH: Record<StudentMode, string> = {
  curriculum: studentRoutes.curriculum,
  competitive: studentRoutes.competitive,
  dashboard: studentRoutes.dashboard,
}

function isTutorStandaloneHost(): boolean {
  if (typeof window === 'undefined') return false
  const { hostname, port } = window.location
  return hostname.includes('ai-ra-app') || (TUTOR_STANDALONE_PORTS as readonly string[]).includes(port)
}

export { getLandingOrigin }

/** Same-origin API base — empty string on unified origin (landing proxy). */
export function resolveApiOrigin(): string {
  if (typeof window === 'undefined') return ''
  if (isTutorStandaloneHost() || (import.meta.env.VITE_LANDING_ORIGIN as string | undefined)?.trim()) {
    return getLandingOrigin()
  }
  return ''
}

/** Navigate to a tutor-owned path (same origin). Preserves browser history. */
export function navigateInApp(path: string): void {
  if (typeof window === 'undefined') return
  const normalized = path.startsWith('/') ? path : `/${path}`
  window.location.assign(normalized)
}

/** Navigate to a landing-owned path (login, signup, marketing). */
export function navigateToLanding(path: string): void {
  if (typeof window === 'undefined') return
  const normalized = path.startsWith('/') ? path : `/${path}`
  const origin = getLandingOrigin()
  if (!isTutorStandaloneHost() && origin === window.location.origin) {
    window.location.assign(normalized)
    return
  }
  window.location.assign(`${origin}${normalized}`)
}

/** Enter a student mode: persist home hint + navigate in-app (SPA when navigate is passed). */
export function enterStudentMode(mode: StudentMode, navigate?: (path: string) => void): void {
  const path = STUDENT_MODE_PATH[mode]
  writeStudentHomeHint(path)
  if (navigate) {
    navigate(path)
    return
  }
  navigateInApp(path)
}

/** Landing login URL with optional return path. */
export function landingLoginUrl(returnPath?: string): string {
  return getLandingLoginUrl(returnPath || studentRoutes.modeSelection)
}

export { studentRoutes, teacherRoutes, adminRoutes }
