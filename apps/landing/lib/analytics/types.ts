/**
 * Shared AIra analytics event names — keep in sync with Tutor analyticsTypes.ts
 */

export type AuthMethod = 'email' | 'google' | 'apple' | 'microsoft' | 'unknown'

export type ApiEndpointName =
  | 'lesson_content'
  | 'lesson_status'
  | 'greeting_tts'
  | 'tts'
  | 'regenerate'
  | 'weekly_exams'
  | 'welcome'
  | 'send_verification'
  | 'waitlist'
  | 'tutor_health'
  | 'health'
  | 'other'

export type AnalyticsParams = Record<string, string | number | boolean | undefined | null>

export const AnalyticsEvents = {
  signup_started: 'signup_started',
  sign_up: 'sign_up',
  signup_failed: 'signup_failed',
  login_started: 'login_started',
  login: 'login',
  login_failed: 'login_failed',
  logout: 'logout',
  mode_selected: 'mode_selected',
  dashboard_view: 'dashboard_view',
  dashboard_feature_used: 'dashboard_feature_used',
  page_performance: 'page_performance',
  api_performance: 'api_performance',
  app_error: 'app_error',
  feature_used: 'feature_used',
} as const

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]

export type UserPropertyMap = {
  user_role?: string
  selected_mode?: string
  teaching_style?: string
  preferred_language?: string
  content_source_last?: string
}

export function classifyApiDuration(ms: number): 'fast' | 'acceptable' | 'slow' | 'critical' {
  if (ms < 500) return 'fast'
  if (ms < 1500) return 'acceptable'
  if (ms < 3000) return 'slow'
  return 'critical'
}

export function classifyPageLoad(ms: number): 'fast' | 'acceptable' | 'slow' | 'critical' {
  if (ms < 2000) return 'fast'
  if (ms < 4000) return 'acceptable'
  if (ms < 8000) return 'slow'
  return 'critical'
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
const URL_RE = /https?:\/\/[^\s]+/gi
const TOKENISH_RE = /(bearer\s+)?[a-z0-9_-]{24,}/gi

export function sanitizeAnalyticsParams(params?: AnalyticsParams): Record<string, string | number | boolean> {
  if (!params) return {}
  const out: Record<string, string | number | boolean> = {}
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue
    const safeKey = key.slice(0, 40)
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      out[safeKey] = Math.round(raw)
      continue
    }
    if (typeof raw === 'boolean') {
      out[safeKey] = raw
      continue
    }
    let s = String(raw)
    s = s.replace(EMAIL_RE, '[email]')
    s = s.replace(URL_RE, '[url]')
    s = s.replace(TOKENISH_RE, '[redacted]')
    if (s.length > 100) s = s.slice(0, 100)
    if (!s) continue
    out[safeKey] = s
  }
  return out
}
