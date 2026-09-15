// FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md
/**
 * No-network analytics stub — same exports as the former Firebase Analytics service.
 * Console debug only; never calls Google / Firebase network APIs.
 */
import { useSettingsStore } from '../stores/settingsStore'
import {
  AnalyticsEvents,
  sanitizeAnalyticsParams,
  classifyApiDuration,
  classifyPageLoad,
  type AnalyticsEventName,
  type AnalyticsParams,
  type AuthMethod,
  type ContentSource,
  type CacheStatus,
  type ApiEndpointName,
  type UserPropertyMap,
  type ErrorSeverity,
} from './analyticsTypes'

let analyticsTopicId = 'unknown'
let analyticsSegmentIndex: number | undefined

export function setAnalyticsLessonContext(topicId: string, segmentIndex?: number): void {
  analyticsTopicId = topicId || 'unknown'
  analyticsSegmentIndex = segmentIndex
}

export function getAnalyticsLessonContext(): { topicId: string; segmentIndex?: number } {
  return { topicId: analyticsTopicId, segmentIndex: analyticsSegmentIndex }
}

let globalErrorHooksInstalled = false
let debugTestFired = false

function analyticsDebugEnabled(): boolean {
  return (
    import.meta.env.DEV === true ||
    String(import.meta.env.VITE_ANALYTICS_DEBUG || '').toLowerCase() === 'true'
  )
}

/** Explicit DebugView flag (required for temporary app_debug_test). */
export function analyticsDebugFlagExplicit(): boolean {
  return String(import.meta.env.VITE_ANALYTICS_DEBUG || '').toLowerCase() === 'true'
}

function isPrivacyAllowed(): boolean {
  try {
    return useSettingsStore.getState().settings.privacy?.analyticsEnabled !== false
  } catch {
    return true
  }
}

function schedule(fn: () => void): void {
  try {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => fn(), { timeout: 2000 })
    } else {
      setTimeout(fn, 0)
    }
  } catch {
    try {
      fn()
    } catch {
      /* never throw */
    }
  }
}

function debugLog(...args: unknown[]): void {
  if (analyticsDebugEnabled()) {
    console.info('[analytics]', ...args)
  }
}

/**
 * TEMPORARY — debug console only (no network).
 * Only fires when DEV + VITE_ANALYTICS_DEBUG=true.
 */
export function fireTemporaryAnalyticsDebugTest(): void {
  if (debugTestFired) return
  if (!(import.meta.env.DEV && analyticsDebugFlagExplicit())) return
  debugTestFired = true
  void track('app_debug_test', { source: 'tutor', debug_test: true })
}

export async function track(
  event: AnalyticsEventName | string,
  params?: AnalyticsParams,
): Promise<void> {
  schedule(() => {
    try {
      if (!isPrivacyAllowed()) {
        debugLog('event skipped (privacy):', event)
        return
      }
      const safe = sanitizeAnalyticsParams(params)
      debugLog('event (stub, no network):', event, safe)
    } catch {
      /* never throw */
    }
  })
}

export async function setAnalyticsUser(uid: string | null): Promise<void> {
  schedule(() => {
    debugLog('setUser (stub):', uid)
  })
}

export async function setAnalyticsUserProperties(props: UserPropertyMap): Promise<void> {
  schedule(() => {
    debugLog('setUserProperties (stub):', props)
  })
}

export async function clearAnalyticsUser(): Promise<void> {
  await setAnalyticsUser(null)
}

export const analytics = {
  track,
  setUser: setAnalyticsUser,
  setUserProperties: setAnalyticsUserProperties,
  clearUser: clearAnalyticsUser,

  pageView(pagePath: string) {
    void track('page_view' as AnalyticsEventName, { page_path: pagePath.slice(0, 100) })
  },

  signupStarted(method: AuthMethod) {
    void track(AnalyticsEvents.signup_started, { method })
  },
  signUp(method: AuthMethod) {
    void track(AnalyticsEvents.sign_up, { method })
  },
  signupFailed(method: AuthMethod, errorCode?: string) {
    void track(AnalyticsEvents.signup_failed, { method, error_code: errorCode || 'unknown' })
  },
  loginStarted(method: AuthMethod) {
    void track(AnalyticsEvents.login_started, { method })
  },
  login(method: AuthMethod) {
    void track(AnalyticsEvents.login, { method })
  },
  loginFailed(method: AuthMethod, errorCode?: string) {
    void track(AnalyticsEvents.login_failed, { method, error_code: errorCode || 'unknown' })
  },
  logout() {
    void track(AnalyticsEvents.logout)
    void clearAnalyticsUser()
  },

  modeSelected(mode: string) {
    void track(AnalyticsEvents.mode_selected, { selected_mode: mode })
    void setAnalyticsUserProperties({ selected_mode: mode })
  },

  dashboardView(dashboardType: string, role?: string) {
    void track(AnalyticsEvents.dashboard_view, {
      dashboard_type: dashboardType,
      user_role: role,
    })
  },
  dashboardFeatureUsed(dashboardType: string, feature: string) {
    void track(AnalyticsEvents.dashboard_feature_used, {
      dashboard_type: dashboardType,
      feature,
    })
  },

  curriculumView(classId?: string) {
    void track(AnalyticsEvents.curriculum_view, { class_id: classId })
  },
  classSelected(classId: string) {
    void track(AnalyticsEvents.class_selected, { class_id: classId })
  },
  subjectSelected(classId: string, subjectId: string) {
    void track(AnalyticsEvents.subject_selected, { class_id: classId, subject_id: subjectId })
  },
  topicSelected(params: {
    topicId: string
    classId?: string
    subjectId?: string
  }) {
    void track(AnalyticsEvents.topic_selected, {
      topic_id: params.topicId,
      class_id: params.classId,
      subject_id: params.subjectId,
    })
  },
  topicOpenSuccess(topicId: string) {
    void track(AnalyticsEvents.topic_open_success, { topic_id: topicId })
  },
  topicOpenFailed(topicId: string, errorType?: string) {
    void track(AnalyticsEvents.topic_open_failed, {
      topic_id: topicId,
      error_type: errorType || 'unknown',
    })
  },

  contentLoaded(params: {
    topicId: string
    contentSource: ContentSource
    cacheStatus?: CacheStatus
    language?: string
    teachingStyle?: string
    contentVersion?: number
  }) {
    void track(AnalyticsEvents.content_loaded, {
      topic_id: params.topicId,
      content_source: params.contentSource,
      cache_status: params.cacheStatus,
      preferred_language: params.language,
      teaching_style: params.teachingStyle,
      content_version: params.contentVersion,
    })
    void setAnalyticsUserProperties({
      content_source_last: params.contentSource,
      preferred_language: params.language,
      teaching_style: params.teachingStyle,
    })
  },
  cacheHit(topicId: string, cacheStatus?: CacheStatus) {
    void track(AnalyticsEvents.cache_hit, { topic_id: topicId, cache_status: cacheStatus })
  },
  cacheMiss(topicId: string, cacheStatus?: CacheStatus) {
    void track(AnalyticsEvents.cache_miss, { topic_id: topicId, cache_status: cacheStatus })
  },

  teachingPageView(topicId: string, contentSource?: ContentSource) {
    void track(AnalyticsEvents.teaching_page_view, {
      topic_id: topicId,
      content_source: contentSource,
    })
  },
  lessonStarted(params: {
    topicId: string
    contentSource?: ContentSource
    language?: string
    teachingStyle?: string
    contentVersion?: number
  }) {
    void track(AnalyticsEvents.lesson_started, {
      topic_id: params.topicId,
      content_source: params.contentSource,
      preferred_language: params.language,
      teaching_style: params.teachingStyle,
      content_version: params.contentVersion,
    })
  },
  lessonPaused(topicId: string, segmentIndex?: number) {
    void track(AnalyticsEvents.lesson_paused, {
      topic_id: topicId,
      segment_index: segmentIndex,
    })
  },
  lessonResumed(topicId: string, segmentIndex?: number) {
    void track(AnalyticsEvents.lesson_resumed, {
      topic_id: topicId,
      segment_index: segmentIndex,
    })
  },
  lessonProgress(topicId: string, progressPercent: number, segmentIndex?: number) {
    const bucket = progressPercent >= 75 ? 75 : progressPercent >= 50 ? 50 : 25
    void track(AnalyticsEvents.lesson_progress, {
      topic_id: topicId,
      progress_percent: bucket,
      segment_index: segmentIndex,
    })
  },
  lessonCompleted(topicId: string, contentSource?: ContentSource) {
    void track(AnalyticsEvents.lesson_completed, {
      topic_id: topicId,
      content_source: contentSource,
    })
  },
  lessonExit(topicId: string, progressPercent?: number) {
    void track(AnalyticsEvents.lesson_exit, {
      topic_id: topicId,
      progress_percent: progressPercent,
    })
  },

  audioLoadStarted(topicId: string, contentSource?: ContentSource, segmentIndex?: number) {
    void track(AnalyticsEvents.audio_load_started, {
      topic_id: topicId,
      content_source: contentSource,
      segment_index: segmentIndex,
    })
  },
  audioLoadSuccess(topicId: string, contentSource?: ContentSource, segmentIndex?: number) {
    void track(AnalyticsEvents.audio_load_success, {
      topic_id: topicId,
      content_source: contentSource,
      segment_index: segmentIndex,
    })
  },
  audioLoadFailed(
    topicId: string,
    errorCategory: string,
    contentSource?: ContentSource,
    segmentIndex?: number,
  ) {
    void track(AnalyticsEvents.audio_load_failed, {
      topic_id: topicId,
      error_category: errorCategory,
      content_source: contentSource,
      segment_index: segmentIndex,
    })
  },
  audioPlayStarted(topicId: string, contentSource?: ContentSource, segmentIndex?: number) {
    void track(AnalyticsEvents.audio_play_started, {
      topic_id: topicId,
      content_source: contentSource,
      segment_index: segmentIndex,
    })
  },
  audioPaused(topicId: string, segmentIndex?: number) {
    void track(AnalyticsEvents.audio_paused, { topic_id: topicId, segment_index: segmentIndex })
  },
  audioResumed(topicId: string, segmentIndex?: number) {
    void track(AnalyticsEvents.audio_resumed, { topic_id: topicId, segment_index: segmentIndex })
  },
  audioCompleted(topicId: string, contentSource?: ContentSource, segmentIndex?: number) {
    void track(AnalyticsEvents.audio_completed, {
      topic_id: topicId,
      content_source: contentSource,
      segment_index: segmentIndex,
    })
  },

  visualHighlight(topicId: string, segmentIndex?: number, syncStatus?: string) {
    void track(AnalyticsEvents.visual_highlight, {
      topic_id: topicId,
      segment_index: segmentIndex,
      sync_status: syncStatus || 'success',
    })
  },
  visualSyncError(topicId: string, syncStatus: string, segmentIndex?: number) {
    void track(AnalyticsEvents.visual_sync_error, {
      topic_id: topicId,
      sync_status: syncStatus,
      segment_index: segmentIndex,
      error_area: 'visual_sync',
    })
  },

  pagePerformance(params: {
    pagePath: string
    ttfbMs?: number
    domInteractiveMs?: number
    domContentLoadedMs?: number
    loadMs?: number
  }) {
    const load = params.loadMs ?? 0
    void track(AnalyticsEvents.page_performance, {
      page_path: params.pagePath,
      ttfb_ms: params.ttfbMs,
      dom_interactive_ms: params.domInteractiveMs,
      dom_content_loaded_ms: params.domContentLoadedMs,
      load_ms: params.loadMs,
      performance_category: classifyPageLoad(load),
    })
  },

  apiPerformance(params: {
    endpointName: ApiEndpointName
    durationMs: number
    statusCode: number
    success: boolean
  }) {
    void track(AnalyticsEvents.api_performance, {
      endpoint_name: params.endpointName,
      api_duration_ms: params.durationMs,
      status_code: params.statusCode,
      success: params.success,
      performance_category: classifyApiDuration(params.durationMs),
    })
  },

  error(params: {
    errorArea: string
    errorType: string
    severity?: ErrorSeverity
    route?: string
  }) {
    void track(AnalyticsEvents.app_error, {
      error_area: params.errorArea,
      error_type: params.errorType.slice(0, 80),
      severity: params.severity || 'error',
      route: params.route,
    })
  },

  adminAction(operation: string, topicId?: string, language?: string, style?: string) {
    void track(AnalyticsEvents.admin_action, {
      operation,
      topic_id: topicId,
      preferred_language: language,
      teaching_style: style,
    })
  },

  featureUsed(feature: string) {
    void track(AnalyticsEvents.feature_used, { feature })
  },

  modeSelectionViewed() {
    void track(AnalyticsEvents.mode_selection_viewed)
  },
  profileViewed() {
    void track(AnalyticsEvents.profile_viewed)
  },
  settingsViewed() {
    void track(AnalyticsEvents.settings_viewed)
  },
  chapterSelected(classId: string, subjectId: string, chapterId: string) {
    void track(AnalyticsEvents.chapter_selected, {
      class_id: classId,
      subject_id: subjectId,
      chapter_id: chapterId,
    })
  },
  searchStarted(searchType: string) {
    void track(AnalyticsEvents.search_started, { search_type: searchType })
  },
  searchCompleted(searchType: string, resultCount: number) {
    void track(AnalyticsEvents.search_completed, {
      search_type: searchType,
      result_count: resultCount,
    })
  },
  searchNoResults(searchType: string) {
    void track(AnalyticsEvents.search_no_results, { search_type: searchType })
  },

  aiQuestionAsked(topicId?: string) {
    void track(AnalyticsEvents.ai_question_asked, { topic_id: topicId })
  },
  aiAnswerReceived(topicId?: string, success = true) {
    void track(AnalyticsEvents.ai_answer_received, {
      topic_id: topicId,
      success,
    })
  },
  aiTeacherError(errorType: string, topicId?: string) {
    void track(AnalyticsEvents.ai_teacher_error, {
      error_type: errorType.slice(0, 80),
      topic_id: topicId,
      error_area: 'ai_teacher',
    })
  },

  competitiveModeOpened() {
    void track(AnalyticsEvents.competitive_mode_opened)
  },
  competitiveSectionViewed(section: string) {
    void track(AnalyticsEvents.competitive_section_viewed, {
      section: section.slice(0, 40),
    })
  },
  examSelected(examId: string, examName?: string) {
    void track(AnalyticsEvents.exam_selected, {
      exam_id: examId,
      exam_name: examName,
    })
  },
  examGenerationStarted(params: {
    exam_id: string
    subject_id: string
    question_count: number
    source_policy?: string
    generation_version?: string
  }) {
    void track(AnalyticsEvents.exam_generation_started, params)
  },
  examGenerationCompleted(params: {
    exam_id: string
    subject_id: string
    question_count: number
    source_policy?: string
    generation_version?: string
    validation_rejected_count?: number
  }) {
    void track(AnalyticsEvents.exam_generation_completed, params)
  },
  examGenerationFailed(params: {
    exam_id: string
    subject_id: string
    error_type: string
    generation_version?: string
    validation_rejected_count?: number
  }) {
    void track(AnalyticsEvents.exam_generation_failed, params)
  },
  testStarted(params: {
    examId: string
    subjectId?: string
    topicId?: string
    testId?: string
    totalQuestions?: number
    flowType?: string
  }) {
    void track(AnalyticsEvents.test_started, {
      exam_id: params.examId,
      subject_id: params.subjectId,
      topic_id: params.topicId,
      test_id: params.testId,
      total_questions: params.totalQuestions,
      flow_type: params.flowType,
    })
  },
  questionViewed(params: {
    examId: string
    questionNumber: number
    questionId?: string
    flowType?: string
  }) {
    void track(AnalyticsEvents.question_viewed, {
      exam_id: params.examId,
      question_number: params.questionNumber,
      question_id: params.questionId,
      flow_type: params.flowType,
    })
  },
  questionAttempted(params: {
    examId: string
    questionNumber: number
    questionId?: string
    flowType?: string
  }) {
    void track(AnalyticsEvents.question_attempted, {
      exam_id: params.examId,
      question_number: params.questionNumber,
      question_id: params.questionId,
      flow_type: params.flowType,
    })
  },
  answerCorrect(params: { examId: string; questionNumber: number; flowType?: string }) {
    void track(AnalyticsEvents.answer_correct, {
      exam_id: params.examId,
      question_number: params.questionNumber,
      flow_type: params.flowType,
    })
  },
  answerIncorrect(params: { examId: string; questionNumber: number; flowType?: string }) {
    void track(AnalyticsEvents.answer_incorrect, {
      exam_id: params.examId,
      question_number: params.questionNumber,
      flow_type: params.flowType,
    })
  },
  testCompleted(params: {
    examId: string
    subjectId?: string
    topicId?: string
    score: number
    totalQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    skippedQuestions: number
    timeSpentSeconds?: number
    flowType?: string
  }) {
    const completion =
      params.totalQuestions > 0
        ? Math.round(
            ((params.correctAnswers + params.incorrectAnswers) / params.totalQuestions) * 100,
          )
        : 0
    void track(AnalyticsEvents.test_completed, {
      exam_id: params.examId,
      subject_id: params.subjectId,
      topic_id: params.topicId,
      score: params.score,
      total_questions: params.totalQuestions,
      correct_answers: params.correctAnswers,
      incorrect_answers: params.incorrectAnswers,
      skipped_questions: params.skippedQuestions,
      time_spent_seconds: params.timeSpentSeconds,
      completion_percentage: completion,
      flow_type: params.flowType,
    })
  },
  testAbandoned(params: {
    examId: string
    questionNumber?: number
    flowType?: string
    subjectId?: string
    topicId?: string
  }) {
    void track(AnalyticsEvents.test_abandoned, {
      exam_id: params.examId,
      question_number: params.questionNumber,
      flow_type: params.flowType,
      subject_id: params.subjectId,
      topic_id: params.topicId,
    })
  },
  explanationStarted(params: { source: string; subjectId?: string }) {
    void track(AnalyticsEvents.explanation_started, {
      source: params.source.slice(0, 40),
      subject_id: params.subjectId,
    })
  },
  explanationCompleted(params: { source: string; subjectId?: string; stepCount?: number }) {
    void track(AnalyticsEvents.explanation_completed, {
      source: params.source.slice(0, 40),
      subject_id: params.subjectId,
      step_count: params.stepCount,
    })
  },
  explanationExit(params: { source: string; subjectId?: string; stepIndex?: number }) {
    void track(AnalyticsEvents.explanation_exit, {
      source: params.source.slice(0, 40),
      subject_id: params.subjectId,
      step_index: params.stepIndex,
    })
  },
  explanationQuestionSubmitted(params: { hasImage: boolean; hasOptions: boolean }) {
    void track(AnalyticsEvents.explanation_question_submitted, {
      has_image: params.hasImage,
      has_options: params.hasOptions,
    })
  },
  performanceAnalyticsViewed(modeFilter?: string) {
    void track(AnalyticsEvents.performance_analytics_viewed, {
      mode_filter: modeFilter?.slice(0, 40),
    })
  },
  passwordResetRequested() {
    void track(AnalyticsEvents.password_reset_requested)
  },
}

export function installGlobalAnalyticsErrorHooks(): void {
  if (typeof window === 'undefined' || globalErrorHooksInstalled) return
  globalErrorHooksInstalled = true
  window.addEventListener('error', (ev) => {
    analytics.error({
      errorArea: 'runtime',
      errorType: (ev.message || 'window_error').slice(0, 80),
      severity: 'error',
      route: window.location.pathname,
    })
  })
  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason
    const msg =
      reason instanceof Error
        ? reason.name || 'unhandled_rejection'
        : typeof reason === 'string'
          ? reason.slice(0, 40)
          : 'unhandled_rejection'
    analytics.error({
      errorArea: 'runtime',
      errorType: msg,
      severity: 'warning',
      route: window.location.pathname,
    })
  })
}

export function reportNavigationTiming(pagePath: string): void {
  schedule(() => {
    try {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      const nav = entries[0]
      if (!nav) return
      analytics.pagePerformance({
        pagePath,
        ttfbMs: Math.round(nav.responseStart - nav.requestStart),
        domInteractiveMs: Math.round(nav.domInteractive),
        domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
        loadMs: Math.round(nav.loadEventEnd || nav.duration),
      })
    } catch {
      /* ignore */
    }
  })
}
