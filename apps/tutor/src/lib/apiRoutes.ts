/**
 * FUTURE BACKEND endpoint map (canonical relative paths).
 * Services call mockAdapter today; swap adapter bodies to hit these routes later.
 * Pages/components must never fetch these paths directly.
 */
export const API_ROUTES = {
  /** POST { text, language?, speaker?, pace? } → audio */
  tts: '/api/tts',
  /** GET → { ok } */
  ttsHealth: '/api/tts/health',
  /** POST streaming counselor / teaching chat */
  chat: '/api/chat',
  /** POST { email, courseId?, courseName? } */
  waitlist: '/api/waitlist',
  /** GET lesson cache */
  contentLesson: '/api/content/lesson',
  /** GET content pipeline status */
  contentStatus: '/api/content/status',
  /** POST regenerate job */
  contentRegenerate: '/api/content/regenerate',
  /** POST greeting TTS */
  contentGreetingTts: '/api/content/greeting-tts',
  /** POST register topic for pipeline */
  contentRegisterTopic: '/api/content/register-topic',
  /** POST competitive exam generation */
  competitiveGenerateExam: '/api/competitive/generate-exam',
  /** GET admin analytics */
  adminAnalytics: '/api/admin/analytics',
  /** POST contact form */
  contact: '/api/contact',
  /** POST auth login */
  authLogin: '/api/auth/login',
  /** POST auth signup */
  authSignup: '/api/auth/signup',
  /** GET topic teaching resources (video, etc.) */
  curriculumTopicResources: '/api/curriculum/topics/:topicId/resources',
  /** GET curriculum video by id (original MP4 + audio tracks) */
  videoById: '/api/videos/:videoId',
  /** GET available soundtracks/captions for a video */
  videoLanguages: '/api/videos/:videoId/languages',
  /** POST { target_language } queue a dubbed soundtrack */
  videoTranslate: '/api/videos/:videoId/translate',
} as const;
