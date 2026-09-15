/**
 * Shared AIra analytics event names and safe param types.
 * Keep in sync with Landing `lib/analytics/types.ts` and docs/ANALYTICS.md.
 */

export type AuthMethod = 'email' | 'google' | 'apple' | 'microsoft' | 'unknown'

export type ContentSource = 'cached' | 'curated' | 'ai' | 'default'

export type CacheStatus = 'READY' | 'PENDING' | 'FAILED' | 'UNKNOWN'

export type PerformanceCategory = 'fast' | 'acceptable' | 'slow' | 'critical'

export type ErrorSeverity = 'warning' | 'error' | 'critical'

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

/** Compact event taxonomy (~24 names). */
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
  curriculum_view: 'curriculum_view',
  class_selected: 'class_selected',
  subject_selected: 'subject_selected',
  topic_selected: 'topic_selected',
  topic_open_success: 'topic_open_success',
  topic_open_failed: 'topic_open_failed',
  content_loaded: 'content_loaded',
  cache_hit: 'cache_hit',
  cache_miss: 'cache_miss',
  teaching_page_view: 'teaching_page_view',
  lesson_started: 'lesson_started',
  lesson_paused: 'lesson_paused',
  lesson_resumed: 'lesson_resumed',
  lesson_progress: 'lesson_progress',
  lesson_completed: 'lesson_completed',
  lesson_exit: 'lesson_exit',
  audio_load_started: 'audio_load_started',
  audio_load_success: 'audio_load_success',
  audio_load_failed: 'audio_load_failed',
  audio_play_started: 'audio_play_started',
  audio_paused: 'audio_paused',
  audio_resumed: 'audio_resumed',
  audio_completed: 'audio_completed',
  visual_highlight: 'visual_highlight',
  visual_sync_error: 'visual_sync_error',
  page_performance: 'page_performance',
  api_performance: 'api_performance',
  app_error: 'app_error',
  admin_action: 'admin_action',
  feature_used: 'feature_used',

  // Navigation (admin dashboard)
  mode_selection_viewed: 'mode_selection_viewed',
  profile_viewed: 'profile_viewed',
  settings_viewed: 'settings_viewed',

  // Curriculum extras
  chapter_selected: 'chapter_selected',
  search_started: 'search_started',
  search_completed: 'search_completed',
  search_no_results: 'search_no_results',

  // AI Teacher extras (no chat text)
  ai_question_asked: 'ai_question_asked',
  ai_answer_received: 'ai_answer_received',
  ai_teacher_error: 'ai_teacher_error',

  // Competitive mode (IDs/scores only — never question/answer text)
  competitive_mode_opened: 'competitive_mode_opened',
  competitive_section_viewed: 'competitive_section_viewed',
  exam_selected: 'exam_selected',
  exam_generation_started: 'exam_generation_started',
  exam_generation_completed: 'exam_generation_completed',
  exam_generation_failed: 'exam_generation_failed',
  test_started: 'test_started',
  question_viewed: 'question_viewed',
  question_attempted: 'question_attempted',
  answer_submitted: 'answer_submitted',
  answer_correct: 'answer_correct',
  answer_incorrect: 'answer_incorrect',
  question_skipped: 'question_skipped',
  test_paused: 'test_paused',
  test_resumed: 'test_resumed',
  test_completed: 'test_completed',
  test_abandoned: 'test_abandoned',
  explanation_started: 'explanation_started',
  explanation_completed: 'explanation_completed',
  explanation_exit: 'explanation_exit',
  explanation_question_submitted: 'explanation_question_submitted',
  performance_analytics_viewed: 'performance_analytics_viewed',

  // Auth extras
  password_reset_requested: 'password_reset_requested',
} as const

/** Competitive hub sidebar / URL section ids */
export type CompetitiveSectionId =
  | 'exams'
  | 'weekly'
  | 'quizzes'
  | 'questionary'
  | 'pyqs'
  | 'mock'
  | 'performance'

export type CompetitiveFlowType = 'standard' | 'pyq' | 'mock' | 'weekly' | 'quiz'

export type ExplanationSource = 'questionary' | 'exam_review'

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]

export type UserPropertyMap = {
  user_role?: string
  selected_mode?: string
  teaching_style?: string
  preferred_language?: string
  content_source_last?: string
}

export function classifyApiDuration(ms: number): PerformanceCategory {
  if (ms < 500) return 'fast'
  if (ms < 1500) return 'acceptable'
  if (ms < 3000) return 'slow'
  return 'critical'
}

export function classifyPageLoad(ms: number): PerformanceCategory {
  if (ms < 2000) return 'fast'
  if (ms < 4000) return 'acceptable'
  if (ms < 8000) return 'slow'
  return 'critical'
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
const URL_RE = /https?:\/\/[^\s]+/gi
const TOKENISH_RE = /(bearer\s+)?[a-z0-9_-]{24,}/gi

/** Strip PII, URLs, and oversized values before sending to GA. */
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
