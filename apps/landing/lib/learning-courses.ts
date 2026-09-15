import type { LucideIcon } from 'lucide-react'
import {
  Calculator,
  Microscope,
  BookOpen,
  Globe2,
  Atom,
  FlaskConical,
  Dna,
  Layout,
  Terminal,
  Briefcase,
  Cpu,
  Database,
  Shield,
} from 'lucide-react'

/** Decorative SVG pattern keys rendered inside LearningCourseCard. */
export type PatternKind =
  | 'grid'
  | 'molecule'
  | 'dna'
  | 'globe'
  | 'book'
  | 'atom'
  | 'circuit'
  | 'code'
  | 'frames'
  | 'bars'
  | 'shield'

export type MetricKind = 'target' | 'zap' | 'trophy' | 'flame' | 'users'

export type HighlightVariant = 'popular' | 'top-rated' | 'industry'

export interface CourseMetric {
  kind: MetricKind
  label: string
}

export interface CourseAccent {
  /** Soft card wash (from → to white-ish) */
  washFrom: string
  iconFrom: string
  iconTo: string
  pattern: string
  cta: string
}

export interface LearningCourse {
  id: string
  name: string
  subtitle?: string
  icon: LucideIcon
  rating: number
  /** Outcome / proof line — omit if unavailable (never show TBD) */
  proofStat?: string
  topics: string[]
  primaryTag: string
  secondaryTag: string
  highlight?: { label: string; variant: HighlightVariant }
  /** Light social momentum, e.g. "Trending this week" */
  momentum?: string
  metrics: CourseMetric[]
  pattern: PatternKind
  accent: CourseAccent
  tone: 'school' | 'professional'
  /** When false, CTA shows "Available Soon" instead of Explore */
  available?: boolean
}

// ——— School filters ———

export type GradeBand = '6-8' | '9-10' | '11-12'
export type BoardFilter = 'all' | 'cbse' | 'icse' | 'state'
export type CourseBoard = 'all' | 'cbse' | 'icse' | 'state'

export const GRADE_FILTERS: { id: 'all' | GradeBand; label: string }[] = [
  { id: 'all', label: 'All Grades' },
  { id: '6-8', label: '6–8 (Middle)' },
  { id: '9-10', label: '9–10 (Secondary)' },
  { id: '11-12', label: '11–12 (Senior)' },
]

export const BOARD_FILTERS: { id: BoardFilter; label: string }[] = [
  { id: 'all', label: 'All Boards' },
  { id: 'cbse', label: 'CBSE' },
  { id: 'icse', label: 'ICSE' },
  { id: 'state', label: 'State Board' },
]

export interface SchoolCourse extends LearningCourse {
  gradeBand: GradeBand
  board: CourseBoard
}

const STEM_TEAL: CourseAccent = {
  washFrom: '#f0fdfa',
  iconFrom: '#14b8a6',
  iconTo: '#0f766e',
  pattern: '#0f766e',
  cta: '#0f766e',
}

const STEM_BLUE: CourseAccent = {
  washFrom: '#eff6ff',
  iconFrom: '#3b82f6',
  iconTo: '#1d4ed8',
  pattern: '#1d4ed8',
  cta: '#1d4ed8',
}

const STEM_CYAN: CourseAccent = {
  washFrom: '#ecfeff',
  iconFrom: '#22d3ee',
  iconTo: '#0891b2',
  pattern: '#0e7490',
  cta: '#0e7490',
}

const STEM_EMERALD: CourseAccent = {
  washFrom: '#ecfdf5',
  iconFrom: '#34d399',
  iconTo: '#059669',
  pattern: '#047857',
  cta: '#047857',
}

const STEM_GREEN: CourseAccent = {
  washFrom: '#f0fdf4',
  iconFrom: '#4ade80',
  iconTo: '#16a34a',
  pattern: '#15803d',
  cta: '#15803d',
}

const HUM_AMBER: CourseAccent = {
  washFrom: '#fffbeb',
  iconFrom: '#fbbf24',
  iconTo: '#d97706',
  pattern: '#b45309',
  cta: '#b45309',
}

const HUM_ORANGE: CourseAccent = {
  washFrom: '#fff7ed',
  iconFrom: '#fb923c',
  iconTo: '#ea580c',
  pattern: '#c2410c',
  cta: '#c2410c',
}

/**
 * All proofStat / momentum / metrics values below are SAMPLE PLACEHOLDERS
 * for design — replace with verified analytics before marketing claims.
 */
export const schoolCourses: SchoolCourse[] = [
  {
    id: 'math-6-8',
    name: 'Mathematics',
    subtitle: 'Middle school foundations',
    gradeBand: '6-8',
    primaryTag: 'Grades 6–8',
    board: 'all',
    secondaryTag: 'All Boards',
    icon: Calculator,
    rating: 4.9,
    proofStat: 'Avg. 18% grade improvement',
    topics: ['Integers & Fractions', 'Algebra Basics', 'Geometry', 'Data Handling'],
    highlight: { label: 'Most Popular in Class 8', variant: 'popular' },
    momentum: '500+ started this week',
    metrics: [
      { kind: 'target', label: '96 lessons' },
      { kind: 'zap', label: '32 quizzes' },
    ],
    pattern: 'grid',
    accent: STEM_BLUE,
    tone: 'school',
  },
  {
    id: 'science-6-8',
    name: 'Science',
    subtitle: 'Integrated natural sciences',
    gradeBand: '6-8',
    primaryTag: 'Grades 6–8',
    board: 'all',
    secondaryTag: 'All Boards',
    icon: Microscope,
    rating: 4.8,
    proofStat: '91% finish weekly lab challenges',
    topics: ['Living World', 'Matter & Materials', 'Motion & Force', 'Environment'],
    metrics: [
      { kind: 'target', label: '84 lessons' },
      { kind: 'trophy', label: '18 labs' },
    ],
    pattern: 'molecule',
    accent: STEM_TEAL,
    tone: 'school',
  },
  {
    id: 'english-6-8',
    name: 'English',
    subtitle: 'Reading, writing & grammar',
    gradeBand: '6-8',
    primaryTag: 'Grades 6–8',
    board: 'all',
    secondaryTag: 'All Boards',
    icon: BookOpen,
    rating: 4.7,
    proofStat: 'Avg. 2 grade levels of reading growth',
    topics: ['Comprehension', 'Grammar Essentials', 'Creative Writing', 'Vocabulary'],
    metrics: [
      { kind: 'target', label: '72 lessons' },
      { kind: 'zap', label: '24 writing drills' },
    ],
    pattern: 'book',
    accent: HUM_AMBER,
    tone: 'school',
  },
  {
    id: 'sst-6-8',
    name: 'Social Science',
    subtitle: 'History, civics & geography',
    gradeBand: '6-8',
    primaryTag: 'Grades 6–8',
    board: 'all',
    secondaryTag: 'All Boards',
    icon: Globe2,
    rating: 4.8,
    proofStat: '88% improved retention in mock tests',
    topics: ['Ancient History', 'Our Earth', 'Local Government', 'Maps & Globes'],
    metrics: [
      { kind: 'target', label: '68 lessons' },
      { kind: 'zap', label: '20 quizzes' },
    ],
    pattern: 'globe',
    accent: HUM_ORANGE,
    tone: 'school',
  },
  {
    id: 'math-9-10',
    name: 'Mathematics',
    subtitle: 'Board exam readiness',
    gradeBand: '9-10',
    primaryTag: 'Grades 9–10',
    board: 'all',
    secondaryTag: 'All Boards',
    icon: Calculator,
    rating: 4.9,
    proofStat: 'Avg. 22% higher board mock scores',
    topics: ['Polynomials', 'Coordinate Geometry', 'Trigonometry', 'Statistics'],
    highlight: { label: 'Most Popular in Class 10', variant: 'popular' },
    momentum: 'Trending among Class 10',
    metrics: [
      { kind: 'target', label: '120 lessons' },
      { kind: 'zap', label: '45 quizzes' },
    ],
    pattern: 'grid',
    accent: STEM_BLUE,
    tone: 'school',
  },
  {
    id: 'science-9-10',
    name: 'Science',
    subtitle: 'Physics · Chemistry · Biology',
    gradeBand: '9-10',
    primaryTag: 'Grades 9–10',
    board: 'all',
    secondaryTag: 'All Boards',
    icon: Microscope,
    rating: 4.8,
    proofStat: '92% report stronger exam confidence',
    topics: ['Light & Electricity', 'Chemical Reactions', 'Life Processes', 'Natural Resources'],
    metrics: [
      { kind: 'target', label: '110 lessons' },
      { kind: 'trophy', label: '28 practice tests' },
    ],
    pattern: 'molecule',
    accent: STEM_TEAL,
    tone: 'school',
  },
  {
    id: 'english-9-10',
    name: 'English',
    subtitle: 'Literature & language skills',
    gradeBand: '9-10',
    primaryTag: 'Grades 9–10',
    board: 'all',
    secondaryTag: 'All Boards',
    icon: BookOpen,
    rating: 4.7,
    proofStat: 'Avg. +1.4 bands on writing rubrics',
    topics: ['Prose & Poetry', 'Writing Skills', 'Grammar Mastery', 'Unseen Passages'],
    metrics: [
      { kind: 'target', label: '90 lessons' },
      { kind: 'zap', label: '36 writing tasks' },
    ],
    pattern: 'book',
    accent: HUM_AMBER,
    tone: 'school',
  },
  {
    id: 'sst-9-10',
    name: 'Social Science',
    subtitle: 'History, geography, civics & economics',
    gradeBand: '9-10',
    primaryTag: 'Grades 9–10',
    board: 'all',
    secondaryTag: 'All Boards',
    icon: Globe2,
    rating: 4.8,
    proofStat: '85% score higher on map & source skills',
    topics: ['Nationalism', 'Resources', 'Democracy', 'Development'],
    metrics: [
      { kind: 'target', label: '98 lessons' },
      { kind: 'zap', label: '30 quizzes' },
    ],
    pattern: 'globe',
    accent: HUM_ORANGE,
    tone: 'school',
  },
  {
    id: 'math-11-12',
    name: 'Mathematics',
    subtitle: 'Senior secondary & entrance prep',
    gradeBand: '11-12',
    primaryTag: 'Grades 11–12',
    board: 'all',
    secondaryTag: 'All Boards',
    icon: Calculator,
    rating: 4.9,
    proofStat: 'Avg. 15% lift on entrance mock ranks',
    topics: ['Calculus', 'Vectors', 'Probability', 'Linear Programming'],
    metrics: [
      { kind: 'target', label: '140 lessons' },
      { kind: 'zap', label: '52 practice sets' },
    ],
    pattern: 'grid',
    accent: STEM_BLUE,
    tone: 'school',
  },
  {
    id: 'physics-11-12',
    name: 'Physics',
    subtitle: 'Mechanics to modern physics',
    gradeBand: '11-12',
    primaryTag: 'Grades 11–12',
    board: 'all',
    secondaryTag: 'All Boards',
    icon: Atom,
    rating: 4.9,
    proofStat: '89% clear numerical problem sets faster',
    topics: ['Mechanics', 'Electrodynamics', 'Optics', 'Modern Physics'],
    highlight: { label: 'Most Popular in Class 12', variant: 'popular' },
    momentum: 'Trending for JEE prep',
    metrics: [
      { kind: 'target', label: '128 lessons' },
      { kind: 'trophy', label: '40 numerical drills' },
    ],
    pattern: 'atom',
    accent: STEM_CYAN,
    tone: 'school',
  },
  {
    id: 'chemistry-11-12',
    name: 'Chemistry',
    subtitle: 'Physical, organic & inorganic',
    gradeBand: '11-12',
    primaryTag: 'Grades 11–12',
    board: 'cbse',
    secondaryTag: 'CBSE',
    icon: FlaskConical,
    rating: 4.7,
    proofStat: 'Avg. 19% better organic reaction recall',
    topics: ['Atomic Structure', 'Organic Reactions', 'Equilibrium', 'Electrochemistry'],
    metrics: [
      { kind: 'target', label: '116 lessons' },
      { kind: 'zap', label: '38 reaction drills' },
    ],
    pattern: 'molecule',
    accent: STEM_EMERALD,
    tone: 'school',
  },
  {
    id: 'biology-11-12',
    name: 'Biology',
    subtitle: 'Botany, zoology & human physiology',
    gradeBand: '11-12',
    primaryTag: 'Grades 11–12',
    board: 'all',
    secondaryTag: 'All Boards',
    icon: Dna,
    rating: 4.9,
    proofStat: '93% feel ready for diagram-heavy papers',
    topics: ['Cell Biology', 'Genetics', 'Human Physiology', 'Ecology'],
    metrics: [
      { kind: 'target', label: '124 lessons' },
      { kind: 'trophy', label: '35 diagram quizzes' },
    ],
    pattern: 'dna',
    accent: STEM_GREEN,
    tone: 'school',
  },
  {
    id: 'english-11-12',
    name: 'English',
    subtitle: 'Core & elective language',
    gradeBand: '11-12',
    primaryTag: 'Grades 11–12',
    board: 'icse',
    secondaryTag: 'ICSE',
    icon: BookOpen,
    rating: 4.7,
    proofStat: 'Avg. 27% faster long-answer drafting',
    topics: ['Flamingo & Vistas', 'Writing Section', 'Reading Skills', 'Literary Devices'],
    metrics: [
      { kind: 'target', label: '64 lessons' },
      { kind: 'zap', label: '22 essay prompts' },
    ],
    pattern: 'book',
    accent: HUM_AMBER,
    tone: 'school',
  },
]

export function filterSchoolCourses(
  courses: SchoolCourse[],
  grade: 'all' | GradeBand,
  board: BoardFilter,
): SchoolCourse[] {
  return courses.filter((course) => {
    const gradeOk = grade === 'all' || course.gradeBand === grade
    const boardOk =
      board === 'all' || course.board === 'all' || course.board === board
    return gradeOk && boardOk
  })
}

// ——— Professional filters ———

export type ProLevel = 'beginner' | 'intermediate' | 'advanced'
export type ProFormat = 'self-paced' | 'live-cohort' | 'certification'

export const LEVEL_FILTERS: { id: 'all' | ProLevel; label: string }[] = [
  { id: 'all', label: 'All Levels' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

export const FORMAT_FILTERS: { id: 'all' | ProFormat; label: string }[] = [
  { id: 'all', label: 'All Formats' },
  { id: 'self-paced', label: 'Self-Paced' },
  { id: 'live-cohort', label: 'Live Cohort' },
  { id: 'certification', label: 'Certification' },
]

export interface ProfessionalCourse extends LearningCourse {
  level: ProLevel
  format: ProFormat
}

const PRO_SLATE: CourseAccent = {
  washFrom: '#f8fafc',
  iconFrom: '#64748b',
  iconTo: '#334155',
  pattern: '#475569',
  cta: '#1e293b',
}

const PRO_TEAL: CourseAccent = {
  washFrom: '#f0fdfa',
  iconFrom: '#2dd4bf',
  iconTo: '#0f766e',
  pattern: '#0f766e',
  cta: '#0f766e',
}

const PRO_BLUE: CourseAccent = {
  washFrom: '#f8fafc',
  iconFrom: '#60a5fa',
  iconTo: '#1d4ed8',
  pattern: '#1e40af',
  cta: '#1d4ed8',
}

const PRO_INDIGO: CourseAccent = {
  washFrom: '#eef2ff',
  iconFrom: '#818cf8',
  iconTo: '#4338ca',
  pattern: '#3730a3',
  cta: '#4338ca',
}

const PRO_SKY: CourseAccent = {
  washFrom: '#f0f9ff',
  iconFrom: '#38bdf8',
  iconTo: '#0369a1',
  pattern: '#0369a1',
  cta: '#0369a1',
}

const PRO_ROSE: CourseAccent = {
  washFrom: '#fff1f2',
  iconFrom: '#fb7185',
  iconTo: '#be123c',
  pattern: '#9f1239',
  cta: '#be123c',
}

/**
 * Professional proofStat values are SAMPLE PLACEHOLDERS — not verified
 * salary / hiring outcomes. Replace before external claims.
 */
export const professionalCourses: ProfessionalCourse[] = [
  {
    id: 'web-dev',
    name: 'Web Development',
    subtitle: 'Full-stack apps with modern tooling',
    level: 'beginner',
    primaryTag: 'Beginner Friendly',
    format: 'self-paced',
    secondaryTag: 'Self-Paced',
    icon: Layout,
    rating: 4.8,
    proofStat: 'Avg. 24% salary increase after completion',
    topics: ['HTML & CSS', 'JavaScript', 'React', 'APIs & Deploy'],
    highlight: { label: 'Top Rated', variant: 'top-rated' },
    momentum: 'High demand this quarter',
    metrics: [
      { kind: 'target', label: '86 lessons' },
      { kind: 'zap', label: '18 projects' },
    ],
    pattern: 'code',
    accent: PRO_TEAL,
    tone: 'professional',
    available: false,
  },
  {
    id: 'app-dev',
    name: 'App Development',
    subtitle: 'Native-feel mobile products',
    level: 'intermediate',
    primaryTag: 'Intermediate',
    format: 'live-cohort',
    secondaryTag: 'Live Cohort',
    icon: Terminal,
    rating: 4.9,
    proofStat: '71% ship a portfolio app in 12 weeks',
    topics: ['Kotlin / Swift basics', 'UI Patterns', 'State & Data', 'Store Release'],
    metrics: [
      { kind: 'target', label: '74 lessons' },
      { kind: 'trophy', label: '12 sprints' },
    ],
    pattern: 'code',
    accent: PRO_BLUE,
    tone: 'professional',
    available: false,
  },
  {
    id: 'uiux',
    name: 'UI/UX Design',
    subtitle: 'Research → prototype → handoff',
    level: 'beginner',
    primaryTag: 'Beginner Friendly',
    format: 'self-paced',
    secondaryTag: 'Self-Paced',
    icon: Briefcase,
    rating: 4.8,
    proofStat: 'Industry-recognized certificate included',
    topics: ['User Research', 'Wireframes', 'Design Systems', 'Usability Tests'],
    highlight: { label: 'Industry Choice', variant: 'industry' },
    metrics: [
      { kind: 'target', label: '58 lessons' },
      { kind: 'zap', label: '9 case studies' },
    ],
    pattern: 'frames',
    accent: PRO_SLATE,
    tone: 'professional',
    available: false,
  },
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    subtitle: 'Models, pipelines & applied ML',
    level: 'advanced',
    primaryTag: 'Advanced',
    format: 'certification',
    secondaryTag: 'Certification',
    icon: Cpu,
    rating: 4.9,
    proofStat: '68% hired into AI roles within 3 months',
    topics: ['Python for ML', 'Neural Nets', 'LLM Apps', 'MLOps Basics'],
    highlight: { label: 'Top Rated', variant: 'top-rated' },
    momentum: 'Fastest-growing track',
    metrics: [
      { kind: 'target', label: '102 lessons' },
      { kind: 'trophy', label: '14 labs' },
    ],
    pattern: 'circuit',
    accent: PRO_INDIGO,
    tone: 'professional',
    available: false,
  },
  {
    id: 'data-science',
    name: 'Data Science',
    subtitle: 'Analytics to decision systems',
    level: 'intermediate',
    primaryTag: 'Intermediate',
    format: 'self-paced',
    secondaryTag: 'Self-Paced',
    icon: Database,
    rating: 4.9,
    proofStat: 'Avg. 31% faster insight-to-dashboard cycle',
    topics: ['SQL & ETL', 'Statistics', 'Visualization', 'Predictive Models'],
    metrics: [
      { kind: 'target', label: '94 lessons' },
      { kind: 'zap', label: '16 capstones' },
    ],
    pattern: 'bars',
    accent: PRO_SKY,
    tone: 'professional',
    available: false,
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    subtitle: 'Defend systems end to end',
    level: 'intermediate',
    primaryTag: 'Intermediate',
    format: 'certification',
    secondaryTag: 'Certification',
    icon: Shield,
    rating: 4.7,
    proofStat: '82% pass first practice security exam',
    topics: ['Network Security', 'Threat Modeling', 'IAM', 'Incident Response'],
    highlight: { label: 'Industry Choice', variant: 'industry' },
    metrics: [
      { kind: 'target', label: '80 lessons' },
      { kind: 'trophy', label: '22 simulations' },
    ],
    pattern: 'shield',
    accent: PRO_ROSE,
    tone: 'professional',
    available: false,
  },
]

export function filterProfessionalCourses(
  courses: ProfessionalCourse[],
  level: 'all' | ProLevel,
  format: 'all' | ProFormat,
): ProfessionalCourse[] {
  return courses.filter((course) => {
    const levelOk = level === 'all' || course.level === level
    const formatOk = format === 'all' || course.format === format
    return levelOk && formatOk
  })
}
