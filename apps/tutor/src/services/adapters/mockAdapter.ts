/**
 * Central mock data adapter for the frontend-only tutor SPA.
 *
 * FUTURE BACKEND: replace method bodies with `fetch` to the documented endpoints
 * (or swap this module for `httpAdapter.ts`). Service files should keep calling
 * through this adapter — pages/components must never call `/api/*` directly.
 */

import type { Question } from '../../data/competitiveQuestions'
import { generateContentFallbackQuestions } from '../../data/examContentFallbacks'
import { buildExamSlotPlan } from '../examSlotPlan'
import type { CachedLessonPayload, ContentStatus, TeachingStyle } from '../../types/contentPipeline'
import { TEACHING_STYLES, normalizeTeachingStyle } from '../../types/contentPipeline'
import type { AdminAnalyticsReport } from '../adminAnalyticsTypes'
import {
  getPublishedVideoById,
  languageLabelForTrack,
  listPublishedVideosForTopic,
  type CurriculumVideoAudioTrack,
  type CurriculumVideoResource,
  type VideoAudioTrackStatus,
} from '../../data/curriculumVideoResources'
import {
  coerceTtsLanguage,
  isEnglishTtsLanguage,
  type TtsLanguageCode,
} from '../../constants/ttsLanguages'

export type AnalyticsDatePreset =
  | 'today'
  | 'yesterday'
  | '7d'
  | '28d'
  | '30d'
  | '90d'
  | 'custom'

const DEMO_LAG_MS = 180

async function demoDelay(ms = DEMO_LAG_MS): Promise<void> {
  await new Promise((r) => setTimeout(r, ms))
}

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function buildDemoSeries(days: number, base: number): Array<{ date: string; value: number }> {
  return Array.from({ length: days }, (_, i) => ({
    date: isoDaysAgo(days - 1 - i),
    value: Math.max(1, Math.round(base + Math.sin(i / 2) * base * 0.25 + (i % 3))),
  }))
}

function extractUserSnippet(prompt: string): string {
  const markers = [
    /Student(?:'s)? (?:question|message|doubt):\s*([\s\S]+?)(?:\n\n|$)/i,
    /User:\s*([\s\S]+?)(?:\n\n|$)/i,
    /Question:\s*([\s\S]+?)(?:\n\n|$)/i,
  ]
  for (const re of markers) {
    const m = prompt.match(re)
    if (m?.[1]?.trim()) return m[1].trim().slice(0, 200)
  }
  const trimmed = prompt.trim()
  if (trimmed.length < 280) return trimmed
  return trimmed.slice(0, 200) + '…'
}

function demoTeachingReply(prompt: string): string {
  const snippet = extractUserSnippet(prompt)
  const topicHint =
    /mitochondria|photosynthesis|newton|algebra|calculus|organic|electric|gravity/i.exec(
      prompt,
    )?.[0] ?? 'this topic'

  return [
    `Here's a clear way to think about it.`,
    ``,
    `You asked about: **${snippet || topicHint}**.`,
    ``,
    `**What to remember**`,
    `- Break the idea into definition → why it matters → one worked example.`,
    `- Say the key term out loud once, then explain it in your own words.`,
    ``,
    `**Quick example**`,
    `Think of ${topicHint} as a building block: master the definition first, then apply it to a short practice question.`,
    ``,
    `**Question for You**`,
    `Can you restate the main idea of ${topicHint} in one sentence?`,
  ].join('\n')
}

function demoCounselorReply(message: string): string {
  return [
    `Thanks for reaching out! I'm AIra's learning counselor.`,
    ``,
    `You said: “${message.slice(0, 160)}${message.length > 160 ? '…' : ''}”`,
    ``,
    `For school learning, start with **Student mode → Curriculum**, pick your class/subject, then open a topic in the tutor. Competitive practice lives under **Competitive mode**.`,
    ``,
    `If you tell me your grade and goal (boards, JEE, NEET, or career skills), I can suggest a focused next step.`,
  ].join('\n')
}

export type MockGenerateExamParams = {
  examId: string
  examName: string
  subjectId: string
  subjectName: string
  count: number
  examYear: string
  mode?: 'mock' | 'pyq'
  topicIds?: string[]
}

export type MockGenerateExamResult = {
  questions: Question[]
  generationVersion: string
  sourcePolicy: string
  validationRejectedCount: number
}

export type MockContentStatusRow = {
  language: string
  teachingStyle: string
  contentVersion: number
  status: ContentStatus
  scriptStatus?: ContentStatus
  audioStatus?: ContentStatus
  overallStatus?: ContentStatus
  activeVersion?: boolean
  segmentCount?: number
  generatedAt?: string
  publishedAt?: string
  error?: { stage?: string; message?: string }
}

export type VideoLanguageDto = {
  code: TtsLanguageCode
  label: string
  status: VideoAudioTrackStatus
  audioUrl: string | null
  captionsUrl: string
}

export type VideoTranslateDto =
  | { status: 'ready'; language: VideoLanguageDto }
  | { status: 'queued'; language: VideoLanguageDto }

export const VIDEO_TRACK_STATUS_EVENT = 'aira-video-track-status'

const TRACK_OVERLAY_KEY = (videoId: string) => `aira:video-tracks:${videoId}`
const translateTimers = new Map<string, ReturnType<typeof setTimeout>>()
const MOCK_TRANSLATE_DELAY_MS = 1400

type TrackOverlay = Partial<Record<TtsLanguageCode, VideoAudioTrackStatus>>

function readTrackOverlay(videoId: string): TrackOverlay {
  try {
    const raw = localStorage.getItem(TRACK_OVERLAY_KEY(videoId))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as TrackOverlay
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function setTrackOverlay(videoId: string, language: TtsLanguageCode, status: VideoAudioTrackStatus): void {
  try {
    const next = { ...readTrackOverlay(videoId), [language]: status }
    localStorage.setItem(TRACK_OVERLAY_KEY(videoId), JSON.stringify(next))
  } catch {
    /* ignore quota / private mode */
  }
}

function emitVideoTrackStatus(
  videoId: string,
  language: TtsLanguageCode,
  status: VideoAudioTrackStatus,
): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(VIDEO_TRACK_STATUS_EVENT, { detail: { videoId, language, status } }),
  )
}

async function publicAssetExists(url: string | null | undefined): Promise<boolean> {
  if (!url) return false
  try {
    const head = await fetch(url, { method: 'HEAD' })
    if (head.ok) return true
    if (head.status === 405 || head.status === 501) {
      const ranged = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } })
      return ranged.ok
    }
    return false
  } catch {
    return false
  }
}

async function resolveLiveTracks(video: CurriculumVideoResource): Promise<CurriculumVideoAudioTrack[]> {
  const overlay = readTrackOverlay(video.id)
  const resolved = await Promise.all(
    video.video_audio_tracks.map(async (track) => {
      if (isEnglishTtsLanguage(track.language)) {
        return { ...track, status: 'ready' as const }
      }
      const overlayStatus = overlay[track.language]
      const fileReady = await publicAssetExists(track.audio_url)
      let status: VideoAudioTrackStatus = track.status
      // Real MP3 wins. Never treat overlay "ready" as ready without a public file
      // (mock must not invent binaries).
      if (fileReady) status = 'ready'
      else if (overlayStatus === 'queued') status = 'queued'
      else if (overlayStatus === 'pending' || overlayStatus === 'ready') status = 'pending'
      else if (overlayStatus) status = overlayStatus
      return { ...track, status }
    }),
  )
  return resolved
}

async function withLiveAudioTracks(video: CurriculumVideoResource): Promise<CurriculumVideoResource> {
  const tracks = await resolveLiveTracks(video)
  return { ...video, video_audio_tracks: tracks }
}

function emptyLanguageDto(language: TtsLanguageCode): VideoLanguageDto {
  return {
    code: language,
    label: languageLabelForTrack(language),
    status: 'pending',
    audioUrl: null,
    captionsUrl: '',
  }
}

function trackToLanguageDto(
  track: CurriculumVideoAudioTrack | undefined,
  language: TtsLanguageCode,
): VideoLanguageDto {
  if (!track) return emptyLanguageDto(language)
  return {
    code: track.language,
    label: languageLabelForTrack(track.language),
    status: track.status,
    audioUrl: track.audio_url,
    captionsUrl: track.captions,
  }
}

function queueMockTranslateReady(videoId: string, language: TtsLanguageCode): void {
  const key = `${videoId}:${language}`
  const existing = translateTimers.get(key)
  if (existing) return
  const timer = setTimeout(() => {
    translateTimers.delete(key)
    void (async () => {
      const video = getPublishedVideoById(videoId)
      const track = video?.video_audio_tracks.find((t) => t.language === language)
      const fileReady = await publicAssetExists(track?.audio_url)
      // Flip to ready only when the dub MP3 exists under /public. Otherwise stay pending
      // so the player keeps English + “Preparing…” (do not invent binaries).
      if (fileReady) {
        setTrackOverlay(videoId, language, 'ready')
        emitVideoTrackStatus(videoId, language, 'ready')
      } else {
        setTrackOverlay(videoId, language, 'pending')
        emitVideoTrackStatus(videoId, language, 'pending')
      }
    })()
  }, MOCK_TRANSLATE_DELAY_MS)
  translateTimers.set(key, timer)
}

export const mockAdapter = {
  /**
   * FUTURE BACKEND:
   * POST /api/chat  { messages, language? } → stream or { reply: string }
   * POST /api/ai/completion  { prompt, temperature? } → { text: string }
   * NOW: local demo teaching reply
   */
  async chatCompletion(prompt: string): Promise<string> {
    await demoDelay()
    return demoTeachingReply(prompt)
  },

  /**
   * FUTURE BACKEND: same as chatCompletion (streaming SSE)
   * NOW: progressive-friendly full string (caller may chunk)
   */
  async chatCompletionForLanding(userMessage: string): Promise<string> {
    await demoDelay(220)
    return demoCounselorReply(userMessage)
  },

  /**
   * FUTURE BACKEND:
   * POST /api/tts  { text, language?, speaker?, pace? } → audio/mpeg body
   * NOW: signal callers to use browser SpeechSynthesis
   */
  async fetchTtsAudio(_opts: {
    text: string
    language?: string
    speaker?: string
    pace?: number
  }): Promise<Blob> {
    await demoDelay(40)
    throw new Error('MOCK_TTS_USE_BROWSER_FALLBACK')
  },

  /**
   * FUTURE BACKEND:
   * GET /api/content/lesson?topicId&language&style&version → CachedLessonPayload
   * NOW: cache miss so curated local scripts in courseRegistry are used
   */
  async fetchCachedLesson(
    _topicId: string,
    _language: string,
    _style: TeachingStyle,
    _version?: number,
  ): Promise<{ lesson: CachedLessonPayload | null; failureReason: 'cache-miss' }> {
    await demoDelay(60)
    return { lesson: null, failureReason: 'cache-miss' }
  },

  /**
   * FUTURE BACKEND:
   * POST /api/content/greeting-tts  { firstName, language, style } → { text, audioUrl }
   * NOW: demo greeting text, no remote audio
   */
  async fetchGreetingAudio(
    firstName: string,
    _language: string,
    _style: TeachingStyle,
  ): Promise<{ text: string; audioUrl: string | null }> {
    await demoDelay(80)
    const name = firstName?.trim() || 'there'
    return {
      text: `Hi ${name}! Welcome to your AIra lesson. Let's get started.`,
      audioUrl: null,
    }
  },

  /**
   * FUTURE BACKEND:
   * POST /api/competitive/generate-exam
   *   { examId, examName, subjectId, subjectName, count, examYear, mode?, topicIds? }
   *   → { questions, generationVersion, sourcePolicy, validationRejectedCount }
   * NOW: local content-fallback bank
   */
  async generateExam(params: MockGenerateExamParams): Promise<MockGenerateExamResult> {
    await demoDelay(320)
    const slots = buildExamSlotPlan(params.examId, params.subjectId, params.count, Date.now())
    const difficulties = slots.map((s) => s.difficulty)
    const questions = generateContentFallbackQuestions({
      examId: params.examId,
      examName: params.examName,
      subjectId: params.subjectId,
      subjectName: params.subjectName,
      count: params.count,
      year: params.examYear,
      difficulties,
      seed: Date.now(),
    })
    return {
      questions,
      generationVersion: 'mock-adapter-1',
      sourcePolicy: 'frontend_mock_bank',
      validationRejectedCount: 0,
    }
  },

  /**
   * FUTURE BACKEND:
   * GET /api/admin/analytics?preset&start&end → AdminAnalyticsReport
   * NOW: deterministic demo KPIs for UI polish
   */
  async fetchAdminAnalytics(params: {
    preset: AnalyticsDatePreset
    start?: string
    end?: string
  }): Promise<AdminAnalyticsReport> {
    await demoDelay(250)
    const end = params.end || isoDaysAgo(0)
    const start =
      params.start ||
      (params.preset === 'today' || params.preset === 'yesterday'
        ? end
        : isoDaysAgo(params.preset === '7d' ? 6 : params.preset === '90d' ? 89 : 27))
    const users = buildDemoSeries(7, 42)
    const sessions = buildDemoSeries(7, 68)
    const newUsers = buildDemoSeries(7, 9)

    return {
      configured: true,
      source: 'none',
      message: 'Product analytics overview for the selected range.',
      range: {
        preset: params.preset,
        startDate: start,
        endDate: end,
        previousStartDate: isoDaysAgo(14),
        previousEndDate: isoDaysAgo(7),
      },
      kpis: {
        activeUsers: { value: 128, previous: 110, changePercent: 16.4 },
        sessions: { value: 410, previous: 380, changePercent: 7.9 },
        engagementRate: { value: 62, previous: 58, changePercent: 6.9 },
        lessonCompletions: { value: 74, previous: 61, changePercent: 21.3 },
      },
      timeseries: { users, sessions, newUsers },
      topPages: [
        { page: '/student/curriculum', views: 520, users: 180 },
        { page: '/student/learn', views: 410, users: 150 },
        { page: '/student/mode-selection', views: 300, users: 200 },
        { page: '/teacher/dashboard', views: 90, users: 40 },
      ],
      events: [
        { event: 'lesson_started', count: 210, users: 95, eventsPerUser: 2.2 },
        { event: 'lesson_completed', count: 74, users: 52, eventsPerUser: 1.4 },
        { event: 'exam_started', count: 48, users: 36, eventsPerUser: 1.3 },
      ],
      modeUsage: [
        { name: 'curriculum', count: 260, users: 140 },
        { name: 'competitive', count: 95, users: 60 },
      ],
      curriculum: {
        classes: [
          { name: 'Class 10', count: 80 },
          { name: 'Class 11', count: 70 },
          { name: 'Class 12', count: 55 },
        ],
        subjects: [
          { name: 'Biology', count: 90 },
          { name: 'Physics', count: 70 },
          { name: 'Math', count: 65 },
        ],
        topics: [
          { name: 'Mitochondria', count: 40 },
          { name: 'Newton Laws', count: 28 },
        ],
        lessonStarted: 210,
        lessonCompleted: 74,
        lessonExit: 30,
      },
      competitive: {
        testsStarted: 48,
        testsCompleted: 31,
        testsAbandoned: 8,
        questionsAttempted: 620,
        answersCorrect: 410,
        answersIncorrect: 210,
        modeOpened: 95,
        examSelected: 60,
      },
      aiTeacher: {
        teachingPageViews: 410,
        lessonsStarted: 210,
        lessonsCompleted: 74,
        questionsAsked: 155,
        answersReceived: 155,
        errors: 0,
      },
      auth: {
        signUps: 22,
        logins: 140,
        loginFailed: 3,
        logouts: 40,
      },
      cache: {
        contentLoaded: 180,
        cacheHits: 0,
        cacheMisses: 180,
      },
      performance: {
        pagePerformanceEvents: 50,
        apiPerformanceEvents: 0,
      },
      funnel: [
        { stage: 'Landing', event: 'page_view', users: 400, dropOffPercent: null },
        { stage: 'Sign in', event: 'login', users: 140, dropOffPercent: 65 },
        { stage: 'Mode select', event: 'mode_select', users: 120, dropOffPercent: 14 },
        { stage: 'Lesson', event: 'lesson_started', users: 95, dropOffPercent: 21 },
      ],
      devices: [
        { name: 'desktop', count: 90 },
        { name: 'mobile', count: 70 },
      ],
      browsers: [
        { name: 'Chrome', count: 110 },
        { name: 'Edge', count: 30 },
      ],
      os: [
        { name: 'Windows', count: 100 },
        { name: 'Android', count: 40 },
      ],
      countries: [
        { name: 'India', count: 150 },
        { name: 'Other', count: 10 },
      ],
      errors: [],
      realtime: { activeUsers: 6, label: 'Active users' },
      firestore: { registeredUsers: 220 },
      propertyId: null,
    }
  },

  /**
   * FUTURE BACKEND:
   * GET /api/content/status?topicId → ContentStatusRow[]
   * NOW: demo READY rows for each language × teaching style
   */
  async fetchContentStatus(topicId: string): Promise<MockContentStatusRow[]> {
    await demoDelay(150)
    const now = new Date().toISOString()
    const languages = ['en-IN', 'hi-IN', 'te-IN']
    const rows: MockContentStatusRow[] = []
    for (const language of languages) {
      for (const teachingStyle of TEACHING_STYLES) {
        rows.push({
          language,
          teachingStyle: normalizeTeachingStyle(teachingStyle),
          contentVersion: 1,
          status: 'READY',
          scriptStatus: 'READY',
          audioStatus: 'PENDING',
          overallStatus: 'READY',
          activeVersion: language === 'en-IN',
          segmentCount: 8,
          generatedAt: now,
          publishedAt: now,
          error: undefined,
        })
      }
    }
    void topicId
    return rows
  },

  /**
   * FUTURE BACKEND:
   * POST /api/content/regenerate  { topicId, scope, ... } → { ok: true, jobId? }
   * NOW: acknowledge success for UI
   */
  async regenerateContent(_input: {
    topicId: string
    scope: string
    extra?: Record<string, string>
  }): Promise<{ ok: true; message: string }> {
    await demoDelay(400)
    return {
      ok: true,
      message: 'Regenerate request accepted. Content status will refresh shortly.',
    }
  },

  /**
   * FUTURE BACKEND:
   * POST /api/waitlist  { email, courseId?, courseName? } → { ok: true }
   * NOW: persist in localStorage
   */
  async joinWaitlist(entry: {
    email: string
    courseId?: string
    courseName?: string
  }): Promise<{ ok: true }> {
    await demoDelay(200)
    const key = 'aira:demo-waitlist'
    try {
      const prev = JSON.parse(localStorage.getItem(key) || '[]') as unknown[]
      const list = Array.isArray(prev) ? prev : []
      list.push({ ...entry, at: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify(list.slice(-100)))
    } catch {
      /* ignore quota / private mode */
    }
    return { ok: true }
  },

  /**
   * FUTURE BACKEND:
   * POST /api/contact  { name, email, organization?, message } → { ok: true }
   * NOW: persist in localStorage
   */
  async saveContact(message: {
    name: string
    email: string
    organization?: string
    message: string
  }): Promise<{ ok: true }> {
    await demoDelay(200)
    const key = 'aira:demo-contact'
    try {
      const prev = JSON.parse(localStorage.getItem(key) || '[]') as unknown[]
      const list = Array.isArray(prev) ? prev : []
      list.push({ ...message, at: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify(list.slice(-50)))
    } catch {
      /* ignore */
    }
    return { ok: true }
  },

  /**
   * FUTURE BACKEND:
   * GET  /api/curriculum/topics/:topicId/resources?type=video → CurriculumVideoResource[]
   * POST /api/v1/curriculum/grade12/biology/ch1-reproduction/topic2-fertilization/resources
   * NOW: published local catalog (public MP4 under /tutor-media/curriculum/...)
   */
  async listTopicVideoResources(topicId: string): Promise<CurriculumVideoResource[]> {
    await demoDelay(80)
    const published = listPublishedVideosForTopic(topicId)
    return Promise.all(published.map((v) => withLiveAudioTracks(v)))
  },

  /**
   * FUTURE BACKEND: GET /api/videos/:videoId
   * NOW: published local catalog
   */
  async getVideo(videoId: string): Promise<CurriculumVideoResource | null> {
    await demoDelay(60)
    const video = getPublishedVideoById(videoId)
    if (!video) return null
    return withLiveAudioTracks(video)
  },

  /**
   * FUTURE BACKEND: GET /api/videos/:videoId/languages
   * NOW: catalog tracks + localStorage overlay; HEAD-probe public dub files.
   */
  async getVideoLanguages(videoId: string): Promise<{ languages: VideoLanguageDto[] }> {
    await demoDelay(60)
    const video = getPublishedVideoById(videoId)
    if (!video) return { languages: [] }
    const tracks = await resolveLiveTracks(video)
    return {
      languages: tracks.map((t) => ({
        code: t.language,
        label: languageLabelForTrack(t.language),
        status: t.status,
        audioUrl: t.audio_url,
        captionsUrl: t.captions,
      })),
    }
  },

  /**
   * FUTURE BACKEND: POST /api/videos/:videoId/translate { target_language }
   * NOW: ready if dub files exist; else { status: "queued" } then flip to ready
   * only after a short delay AND the public MP3 is present. Missing binaries stay pending.
   * Does not generate MP3/VTT binaries.
   */
  async translateVideo(
    videoId: string,
    body: { target_language: string },
  ): Promise<VideoTranslateDto> {
    await demoDelay(80)
    const language = coerceTtsLanguage(body.target_language)
    const video = getPublishedVideoById(videoId)
    if (!video) {
      return { status: 'queued', language: emptyLanguageDto(language) }
    }

    const tracks = await resolveLiveTracks(video)
    const current = tracks.find((t) => t.language === language)
    const dto = trackToLanguageDto(current, language)

    if (isEnglishTtsLanguage(language) || dto.status === 'ready') {
      return { status: 'ready', language: dto }
    }

    setTrackOverlay(videoId, language, 'queued')
    emitVideoTrackStatus(videoId, language, 'queued')
    queueMockTranslateReady(videoId, language)

    return { status: 'queued', language: { ...dto, status: 'queued' } }
  },
}

export type MockAdapter = typeof mockAdapter
