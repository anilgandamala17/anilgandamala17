/**
 * Maintainable product facts for AIra Assistant.
 * Keep claims aligned with shipped landing + tutor capabilities.
 */

import { PRO_MONTHLY_INR } from '@/lib/pricing'

export const ASSISTANT_IDENTITY = {
  name: 'AIra Assistant',
  tagline: 'Your learning companion',
  readyLabel: 'AIra is ready',
} as const

export const ASSISTANT_ROUTES = {
  home: '/',
  signup: '/signup',
  login: '/login',
  contact: '/contact',
  pricing: '/pricing',
  about: '/about',
  modeSelection: '/student/mode-selection',
  curriculum: '/student/curriculum',
  competitive: '/student/competitive',
  competitiveExplain: '/student/competitive-explain',
  dashboard: '/student/dashboard',
  learn: '/student/learn',
  teacherDashboard: '/teacher/dashboard',
} as const

/** Exams present in tutor competitive catalog (mockData COMPETITIVE_EXAMS). */
export const SUPPORTED_EXAMS = [
  'JEE Main',
  'JEE Advanced',
  'NEET',
  'EAMCET',
  'POLYCET',
  'GATE',
  'NTSE',
  'NMMS',
  'RJC CET',
  'RGUKT IIIT',
  'Sainik School',
  'JNVST',
  'KV Admission',
  'EMRS',
  'Olympiads',
] as const

export type KnowledgeTopic = {
  id: string
  title: string
  /** Longer / more specific phrases score higher. Avoid ultra-short tokens alone. */
  keywords: string[]
  summary: string
  bullets?: string[]
  nextActions?: Array<{ label: string; query?: string; href?: string }>
}

export const ASSISTANT_KNOWLEDGE: KnowledgeTopic[] = [
  {
    id: 'what-is-aira',
    title: 'What is AIra?',
    keywords: [
      'what is aira',
      'about aira',
      'who are you',
      'tell me about aira',
      'what does aira',
      'aira platform',
      'aira product',
      'ai tutor platform',
      'learning platform',
    ],
    summary:
      'AIra (Aɪra) is an AI tutoring platform for Indian students — school curriculum (Grades 6–12), competitive exam prep, and adaptive practice with visual lessons and voice teaching.',
    bullets: [
      'Curriculum Mode — board-aligned learning for Classes 6–12',
      'Competitive Mode — JEE, NEET, EAMCET, GATE, and more',
      'AI Tutor — step-by-step teaching with visuals, voice, quizzes, and doubts',
      'Student, Teacher, and Admin experiences after you sign in',
      'Free to start — create an account and pick a learning mode',
    ],
    nextActions: [
      { label: 'Start free trial', href: ASSISTANT_ROUTES.signup },
      { label: 'How AI Tutor works', query: 'How does AIra Tutor work?' },
      { label: 'Explore modes', query: 'What learning modes does AIra have?' },
    ],
  },
  {
    id: 'modes',
    title: 'Learning modes',
    keywords: [
      'learning mode',
      'learning modes',
      'curriculum or competitive',
      'mode selection',
      'which mode',
      'two modes',
      'choose a mode',
      'board mastery',
      'entrance prep',
    ],
    summary:
      'After signup, students land on Mode Selection and choose one of two paths:',
    bullets: [
      'Curriculum Mode — Grades 6–12, subjects, chapters, topics → AI Tutor lessons',
      'Competitive Mode — exams, mocks, year-pattern practice, weekly tests, AI Explanation',
      'You can switch later from the student dashboard',
    ],
    nextActions: [
      { label: 'Open mode selection', href: ASSISTANT_ROUTES.modeSelection },
      { label: 'Curriculum Mode', query: 'Explain Curriculum Mode' },
      { label: 'Competitive Mode', query: 'Explain Competitive Mode' },
    ],
  },
  {
    id: 'curriculum',
    title: 'Curriculum Mode',
    keywords: [
      'curriculum mode',
      'curriculum',
      'school learning',
      'board exam',
      'boards',
      'cbse',
      'icse',
      'state board',
      'chapter',
      'chapters',
      'topics',
      'ncert',
    ],
    summary:
      'Curriculum Mode is for school board mastery. Browse Grade → Subject → Chapter → Topic, then open the AI Tutor to learn.',
    bullets: [
      'Grades 6–10: English, Hindi, Maths, Science, Social Science, and Computer / IT',
      'Class 11–12 Science: pick MPC or BiPC first, then subjects',
      'Progress syncs as you study topics in the AI Tutor',
      'Boards referenced on the landing catalog: CBSE, ICSE, State Board',
    ],
    nextActions: [
      { label: 'Open Curriculum', href: ASSISTANT_ROUTES.curriculum },
      { label: 'Class 11 & 12', query: 'Show me Class 11 and 12 options' },
      { label: 'Subjects by grade', query: 'What subjects are available?' },
    ],
  },
  {
    id: 'grades-subjects',
    title: 'Grades & subjects',
    keywords: [
      'what subjects',
      'which subjects',
      'subjects available',
      'grade 6',
      'grade 7',
      'grade 8',
      'grade 9',
      'grade 10',
      'class 6',
      'class 7',
      'class 8',
      'class 9',
      'class 10',
      'middle school',
      'secondary',
    ],
    summary:
      'Curriculum covers Grades 6–12. Subject sets differ slightly by band:',
    bullets: [
      'Classes 6–8: English, Hindi, Mathematics, Science, Social Science, Computer Science',
      'Classes 9–10: English, Hindi, Mathematics, Science, Social Science, Information Technology',
      'Classes 11–12: stream-based (MPC or BiPC) — see Class 11 & 12 options',
    ],
    nextActions: [
      { label: 'Open Curriculum', href: ASSISTANT_ROUTES.curriculum },
      { label: 'Class 11 & 12 streams', query: 'Tell me about MPC and BiPC' },
    ],
  },
  {
    id: 'streams',
    title: 'Class 11 & 12 streams',
    keywords: [
      'class 11',
      'class 12',
      'mpc',
      'bipc',
      'stream',
      'streams',
      'senior secondary',
      'maths physics chemistry',
      'biology physics chemistry',
    ],
    summary:
      'For Class 11 and 12 Science, AIra asks you to pick a stream before subjects:',
    bullets: [
      'MPC — Mathematics, Physics, Chemistry (+ English)',
      'BiPC — Biology, Physics, Chemistry (+ English)',
      'Then open a subject → chapter → topic in the AI Tutor',
      'Use Competitive Mode alongside for JEE (MPC) or NEET (BiPC) practice',
    ],
    nextActions: [
      { label: 'Explore Curriculum', href: ASSISTANT_ROUTES.curriculum },
      { label: 'JEE path', query: 'How can AIra help with JEE Main?' },
      { label: 'NEET path', query: 'How can AIra help with NEET?' },
    ],
  },
  {
    id: 'competitive',
    title: 'Competitive Mode',
    keywords: [
      'competitive mode',
      'competitive',
      'entrance exam',
      'entrance prep',
      'exam prep',
      'competitive hub',
    ],
    summary:
      'Competitive Mode is AIra’s entrance-exam hub. Pick an exam, review the pattern and rules, complete system checks, then attempt a focused full-screen CBT paper.',
    bullets: [
      'Available Exams — full multi-subject timed papers',
      'Year Practice — year-tagged pattern drills (not official archived PYQs)',
      'Mock Tests — full-length mocks',
      'Weekly Tests — scheduled practice windows',
      'AI Explanation — text walkthrough of any question (type or upload)',
      'Flow: Exam card → Instructions → System checks → Full-screen exam → Review & Submit',
      'Analytics live on the student dashboard (Competitive view)',
    ],
    nextActions: [
      { label: 'Open Competitive', href: ASSISTANT_ROUTES.competitive },
      { label: 'Supported exams', query: 'Which competitive exams does AIra support?' },
      { label: 'How mocks work', query: 'How do mock tests work in AIra?' },
    ],
  },
  {
    id: 'exams',
    title: 'Supported competitive exams',
    keywords: [
      'which exam',
      'which exams',
      'exams supported',
      'supported exams',
      'exam list',
      'exam catalog',
      'what exams',
    ],
    summary: `Competitive Mode’s exam catalog currently includes: ${SUPPORTED_EXAMS.join(', ')}.`,
    bullets: [
      'Engineering focus: JEE Main, JEE Advanced, EAMCET, GATE, POLYCET, RGUKT IIIT',
      'Medical: NEET',
      'Scholarship / school entry: NTSE, NMMS, JNVST, KV, EMRS, Sainik School',
      'Also: RJC CET and Olympiads-style practice',
      'Each exam has its own subjects and timers inside the live CBT panel',
    ],
    nextActions: [
      { label: 'Open Competitive hub', href: ASSISTANT_ROUTES.competitive },
      { label: 'JEE Main', query: 'How can AIra help with JEE Main?' },
      { label: 'NEET', query: 'How can AIra help with NEET?' },
    ],
  },
  {
    id: 'jee',
    title: 'JEE prep on AIra',
    keywords: ['jee main', 'jee advanced', 'jee', 'iit'],
    summary:
      'For JEE, use Competitive Mode (JEE Main / JEE Advanced papers, mocks, year-pattern practice) and Curriculum Mode Class 11–12 MPC for concept teaching in the AI Tutor.',
    bullets: [
      'Open Competitive → Available Exams → JEE Main or JEE Advanced',
      'Review exam pattern & complete system checks before the full-screen CBT',
      'Practice year-pattern sets and full mocks under timed conditions',
      'Strengthen Physics, Chemistry, Maths topics via Curriculum → MPC → AI Tutor',
      'Use AI Explanation when a question needs a step-by-step walkthrough',
    ],
    nextActions: [
      { label: 'Open Competitive', href: ASSISTANT_ROUTES.competitive },
      { label: 'MPC subjects', query: 'Tell me about MPC stream' },
    ],
  },
  {
    id: 'neet',
    title: 'NEET prep on AIra',
    keywords: ['neet', 'medical entrance', 'mbbs'],
    summary:
      'For NEET, practice in Competitive Mode and build Biology / Physics / Chemistry concepts with Curriculum Mode Class 11–12 BiPC + AI Tutor.',
    bullets: [
      'Open Competitive → Available Exams → NEET',
      'Use mocks, year-pattern practice, and weekly tests',
      'Learn chapters via Curriculum → BiPC → AI Tutor',
      'Ask AI Explanation for tough MCQs',
    ],
    nextActions: [
      { label: 'Open Competitive', href: ASSISTANT_ROUTES.competitive },
      { label: 'BiPC subjects', query: 'Tell me about BiPC stream' },
    ],
  },
  {
    id: 'tutor',
    title: 'AI Tutor',
    keywords: [
      'ai tutor',
      'aira tutor',
      'teaching session',
      'teaching studio',
      'how does tutor',
      'how teaching works',
      'personal tutor',
      'lesson',
      'lessons',
    ],
    summary:
      'The AI Tutor is AIra’s teaching studio. Open any curriculum topic (or an explanation flow) and learn with structured steps, synced visuals, and voice narration.',
    bullets: [
      'Three-panel studio: Chat · Teaching board · Study tools',
      'Step-by-step lessons with diagrams / video synced to narration',
      'Voice or text doubts during the lesson',
      'In-session quizzes to check understanding',
      'Studio tools: Notes, Mind Map, Flashcards, Quiz, Summary (export where supported)',
      'Attach study files (PDF, DOCX, TXT, images) when you need context',
    ],
    nextActions: [
      { label: 'Start learning', href: ASSISTANT_ROUTES.modeSelection },
      { label: 'Open Curriculum', href: ASSISTANT_ROUTES.curriculum },
    ],
  },
  {
    id: 'voice-visual',
    title: 'Voice & visual learning',
    keywords: [
      'voice learning',
      'voice teaching',
      'visual learning',
      'visual lesson',
      'diagram',
      'narration',
      'tts',
      'speech',
      'microphone',
      'mute',
    ],
    summary:
      'AIra teaches with both voice and visuals — not text-only chat.',
    bullets: [
      'AI Tutor narrates steps aloud (browser TTS; mute anytime)',
      'Teaching board shows diagrams / visuals synced to the current step',
      'Speak doubts with the mic in Tutor and in Competitive AI Explanation',
      'Landing Assistant also supports optional voice input after you tap the mic',
    ],
    nextActions: [
      { label: 'How AI Tutor works', query: 'How does AIra Tutor work?' },
      { label: 'Start learning', href: ASSISTANT_ROUTES.modeSelection },
    ],
  },
  {
    id: 'pyq-mock-quiz',
    title: 'Practice papers & mocks',
    keywords: [
      'pyq',
      'pyqs',
      'previous year',
      'previous years',
      'mock test',
      'mock tests',
      'mocks',
      'weekly test',
      'weekly tests',
      'full paper',
      'cbt',
      'exam instructions',
      'system check',
    ],
    summary:
      'Competitive Mode gives several practice formats so you can prep like the real exam:',
    bullets: [
      'Available Exams / Mocks — full multi-subject timed CBT papers',
      'Year Practice — year-tagged pattern drills (practice-generated; not official archived PYQs)',
      'Weekly Tests — scheduled weekend-style windows',
      'Before you start: exam pattern & rules → system checks → full-screen exam',
      'Live panel: timer, question palette, mark-for-review, Next / Save, Review & Submit',
      'Stuck on a question? Open AI Explanation for a teaching walkthrough',
    ],
    nextActions: [
      { label: 'Open Competitive', href: ASSISTANT_ROUTES.competitive },
      { label: 'AI explanations', query: 'How do AI explanations work?' },
    ],
  },
  {
    id: 'exam-integrity',
    title: 'Exam environment & integrity',
    keywords: [
      'cheating',
      'tab switch',
      'fullscreen',
      'proctor',
      'camera check',
      'auto submit',
      'exam warning',
      'integrity',
      'leave exam',
    ],
    summary:
      'AIra Competitive exams run in a focused full-screen environment with browser-level monitoring. Leaving the exam repeatedly can auto-submit your attempt.',
    bullets: [
      'System checks confirm browser, network, and fullscreen readiness before start',
      'Camera or microphone is only required when that exam’s policy enables it',
      'Leaving the tab, losing focus, or exiting fullscreen can count as a warning',
      'Repeated confirmed exits can automatically submit your recorded answers',
      'This is realistic browser monitoring — not absolute device-level proctoring',
    ],
    nextActions: [
      { label: 'Open Competitive', href: ASSISTANT_ROUTES.competitive },
      { label: 'How Competitive works', query: 'How does Competitive Mode work?' },
    ],
  },
  {
    id: 'ai-explanation',
    title: 'AI Explanation',
    keywords: [
      'ai explanation',
      'explanation',
      'explain question',
      'questionary',
      'walkthrough',
      'doubt clearing',
      'clear my doubt',
    ],
    summary:
      'AI Explanation turns a tough exam question into a short text teaching session — type it or upload a photo, then get a structured walkthrough.',
    bullets: [
      'Available from Competitive Mode → AI Explanation',
      'Supports typed questions and image upload',
      'Three focused cards: Concept Introduction, Option Analysis, Solution & tips',
      'Complements full mocks and year-pattern practice — explain after you attempt',
    ],
    nextActions: [
      { label: 'Open AI Explanation', href: ASSISTANT_ROUTES.competitiveExplain },
      { label: 'Open Competitive', href: ASSISTANT_ROUTES.competitive },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard & progress',
    keywords: [
      'dashboard',
      'progress',
      'analytics',
      'performance',
      'track progress',
      'my progress',
    ],
    summary:
      'The student dashboard shows learning progress for Curriculum and Competitive in one place. Switch mode with the dashboard mode switcher.',
    bullets: [
      'Curriculum view — recent topics, grade/subject progress',
      'Competitive view — exam practice analytics',
      'Continue learning from last-accessed topics',
    ],
    nextActions: [
      { label: 'Open dashboard', href: ASSISTANT_ROUTES.dashboard },
      { label: 'Mode selection', href: ASSISTANT_ROUTES.modeSelection },
    ],
  },
  {
    id: 'getting-started',
    title: 'Getting started',
    keywords: [
      'get started',
      'getting started',
      'how to start',
      'how do i start',
      'how to begin',
      'onboarding',
      'first time',
      'new to aira',
    ],
    summary: 'Here’s the fastest path to start learning on AIra:',
    bullets: [
      '1. Create a free student account on Sign up',
      '2. Students land on Mode Selection — pick Curriculum or Competitive',
      '3. Curriculum: Grade → Subject → Topic → AI Tutor',
      '4. Competitive: choose an exam → mock / year practice / quiz / AI Explanation',
      '5. Schools & institutions: Book a Demo via Contact',
    ],
    nextActions: [
      { label: 'Start free trial', href: ASSISTANT_ROUTES.signup },
      { label: 'Book a demo', href: ASSISTANT_ROUTES.contact },
      { label: 'View pricing', href: ASSISTANT_ROUTES.pricing },
    ],
  },
  {
    id: 'signup-login',
    title: 'Sign up & login',
    keywords: [
      'sign up',
      'signup',
      'sign in',
      'login',
      'log in',
      'create account',
      'register',
      'free trial',
      'account',
      'student',
    ],
    summary:
      'Use Sign up to create a student account. Login supports email/password (and social UI). After auth, students go to Mode Selection. Teacher/admin access is provisioned separately — not self-serve on Sign up.',
    bullets: [
      'Student path → Mode Selection → Curriculum or Competitive',
      'Teacher/admin accounts are provisioned by AIra — not created via public Sign up',
      'For Schools entry: Login with school intent, then role-based home',
      'Forgot password / email verify screens exist; delivery is demo-oriented in this build',
    ],
    nextActions: [
      { label: 'Sign up', href: ASSISTANT_ROUTES.signup },
      { label: 'Log in', href: ASSISTANT_ROUTES.login },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing',
    keywords: [
      'pricing',
      'price',
      'cost',
      'fees',
      'subscription',
      'plans',
      'pro plan',
      'free plan',
      'how much',
      '₹',
      'rupees',
    ],
    summary:
      'AIra’s pricing page lists three plans. Start free; upgrade when you need more practice depth.',
    bullets: [
      'Simple — Free forever (core AI learning starters)',
      `Pro — ₹${PRO_MONTHLY_INR} / month (fuller JEE & NEET practice; placeholder pricing on the site)`,
      'Enterprise — Custom for schools (multi-seat, analytics, onboarding)',
      'Payments / checkout are not live yet — use Sign up to explore, or Contact for schools',
    ],
    nextActions: [
      { label: 'View pricing', href: ASSISTANT_ROUTES.pricing },
      { label: 'Start free', href: ASSISTANT_ROUTES.signup },
      { label: 'Contact sales', href: ASSISTANT_ROUTES.contact },
    ],
  },
  {
    id: 'roles',
    title: 'Students, teachers & schools',
    keywords: [
      'teacher',
      'teachers',
      'for schools',
      'school',
      'schools',
      'admin',
      'institution',
      'student role',
      'teacher role',
    ],
    summary:
      'AIra supports students learning, teachers managing their space, and school-oriented entry.',
    bullets: [
      'Students — Sign up → Mode Selection → Curriculum, Competitive, AI Tutor, dashboard',
      'Teachers — Teacher dashboard after provisioned login (not self-serve Sign up)',
      'Schools — use For Schools / Book a Demo / Contact; Enterprise plan for institutions',
      'Admin tooling exists in the product for curriculum & weekly exams (internal)',
    ],
    nextActions: [
      { label: 'Book a demo', href: ASSISTANT_ROUTES.contact },
      { label: 'Student sign up', href: ASSISTANT_ROUTES.signup },
      { label: 'School login', href: '/login?intent=school' },
    ],
  },
  {
    id: 'professionals',
    title: 'Professional learning',
    keywords: [
      'professional',
      'professionals',
      'career',
      'career skills',
      'web development',
      'data science',
      'coming soon',
      'waitlist',
    ],
    summary:
      'Professional / career skill tracks appear on the landing catalog as coming soon — you can join the waitlist (Notify Me). They are not a live learning mode yet.',
    bullets: [
      'Not the same as Curriculum or Competitive Mode',
      'Use Notify Me on the home catalog for updates',
      'Students should start with Curriculum or Competitive today',
    ],
    nextActions: [
      { label: 'Explore student modes', query: 'What learning modes does AIra have?' },
      { label: 'Start free trial', href: ASSISTANT_ROUTES.signup },
    ],
  },
  {
    id: 'contact-demo',
    title: 'Contact & demos',
    keywords: [
      'book a demo',
      'contact',
      'demo',
      'partnership',
      'support email',
      'get in touch',
    ],
    summary:
      'Use Contact / Book a Demo for schools, partnerships, or product questions. You can also reach the team via the site contact channels.',
    nextActions: [
      { label: 'Contact us', href: ASSISTANT_ROUTES.contact },
      { label: 'About AIra', href: ASSISTANT_ROUTES.about },
    ],
  },
]

function scoreKeyword(query: string, kw: string): number {
  const k = kw.toLowerCase()
  if (!k || !query.includes(k)) return 0
  // Prefer longer, more specific phrases
  let score = k.length * 2
  // Bonus when keyword aligns to word boundaries (reduces false hits)
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (new RegExp(`(?:^|\\b)${escaped}(?:\\b|$)`).test(query)) score += 8
  // Extra weight for multi-word phrases
  if (k.includes(' ')) score += 12
  return score
}

export function matchKnowledge(query: string): KnowledgeTopic | null {
  const q = query.toLowerCase().trim()
  if (!q) return null

  let best: KnowledgeTopic | null = null
  let bestScore = 0

  for (const topic of ASSISTANT_KNOWLEDGE) {
    let score = 0
    for (const kw of topic.keywords) {
      score += scoreKeyword(q, kw)
    }
    // Light title / id boosts for direct asks
    if (q.includes(topic.id.replace(/-/g, ' '))) score += 10
    if (q.includes(topic.title.toLowerCase())) score += 14

    if (score > bestScore) {
      bestScore = score
      best = topic
    }
  }

  // Require a meaningful hit so vague short words don't misroute
  return bestScore >= 10 ? best : null
}

/** Ranked topic hits for composing richer answers. */
export function matchKnowledgeAll(
  query: string,
  limit = 3,
): Array<{ topic: KnowledgeTopic; score: number }> {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const scored = ASSISTANT_KNOWLEDGE.map((topic) => {
    let score = 0
    for (const kw of topic.keywords) score += scoreKeyword(q, kw)
    if (q.includes(topic.title.toLowerCase())) score += 14
    return { topic, score }
  })
    .filter((x) => x.score >= 10)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit)
}

export function formatTopicReply(topic: KnowledgeTopic): string {
  const lines = [topic.summary]
  if (topic.bullets?.length) {
    lines.push('')
    for (const b of topic.bullets) lines.push(`• ${b}`)
  }
  return lines.join('\n')
}

/**
 * Build a precise answer from knowledge for application questions.
 * Returns null only when the query is clearly outside product scope.
 */
export function answerFromKnowledge(query: string): {
  content: string
  topic: KnowledgeTopic | null
} | null {
  const q = query.toLowerCase().trim()
  if (!q) return null

  // Direct exam-name questions → exam-specific or catalog
  const examDirect = matchExamIntent(q)
  if (examDirect) return examDirect

  const hits = matchKnowledgeAll(q, 2)
  if (hits.length === 0) {
    if (looksLikeProductQuestion(q)) {
      return {
        topic: null,
        content: fallbackProductGuide(query),
      }
    }
    return null
  }

  const primary = hits[0]!.topic
  let content = formatTopicReply(primary)

  // If a second strong hit adds complementary facts, append a short bridge
  if (hits[1] && hits[1].score >= hits[0]!.score * 0.7 && hits[1].topic.id !== primary.id) {
    const secondary = hits[1].topic
    content += `\n\nAlso useful — **${secondary.title}**: ${secondary.summary}`
  }

  return { content, topic: primary }
}

function matchExamIntent(q: string): { content: string; topic: KnowledgeTopic } | null {
  const examMap: Array<{ re: RegExp; topicId: string }> = [
    { re: /\bjee\s*advanced\b|\biit\b/, topicId: 'jee' },
    { re: /\bjee\b/, topicId: 'jee' },
    { re: /\bneet\b/, topicId: 'neet' },
  ]
  for (const { re, topicId } of examMap) {
    if (re.test(q)) {
      const topic = ASSISTANT_KNOWLEDGE.find((t) => t.id === topicId)
      if (topic) return { content: formatTopicReply(topic), topic }
    }
  }
  if (/which exam|exams? (do you|does aira)|supported exam|exam list|exam catalog/.test(q)) {
    const topic = ASSISTANT_KNOWLEDGE.find((t) => t.id === 'exams')
    if (topic) return { content: formatTopicReply(topic), topic }
  }
  return null
}

function looksLikeProductQuestion(q: string): boolean {
  return (
    /\b(aira|curriculum|competitive|tutor|exam|jee|neet|mock|pyq|quiz|signup|sign up|login|pricing|dashboard|grade|class|subject|stream|mpc|bipc|school|teacher|student|learn|lesson|voice|visual|demo|trial|mode)\b/.test(
      q,
    ) ||
    /how (do|does|can|to)|what (is|are|does)|where (do|can)|which|explain|tell me|help me/.test(q)
  )
}

function fallbackProductGuide(raw: string): string {
  const clipped = raw.trim().length > 100 ? `${raw.trim().slice(0, 100)}…` : raw.trim()
  return [
    `Here’s how AIra can help with “${clipped}”:`,
    '',
    'AIra has two student paths after you sign in:',
    '• **Curriculum Mode** — Classes 6–12, subjects, chapters, AI Tutor lessons',
    '• **Competitive Mode** — JEE, NEET, and other exams with mocks, year-pattern practice, and AI Explanation',
    '',
    'Tell me your class (or exam goal) — for example “Class 10 Science” or “JEE Main mocks” — and I’ll point you to the exact next step.',
  ].join('\n')
}
