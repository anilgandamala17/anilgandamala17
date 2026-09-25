/**
 * Rewrite imports after competitive feature move.
 * Prefer @/ aliases for cross-boundary imports.
 */
import fs from 'fs';
import path from 'path';

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist') continue;
      walk(p, out);
    } else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

/** Exact module basename remaps used in import strings (path fragment → new) */
const MODULE_REMAPS = [
  // stores / lib / utils
  ['stores/competitiveStore', 'features/competitive/stores/competitiveStore'],
  ['lib/competitiveRoute', 'features/competitive/lib/competitiveRoute'],
  ['utils/competitiveTeaching', 'features/competitive/utils/competitiveTeaching'],
  // pages
  ['pages/StudentCompetitivePage', 'pages/student/StudentCompetitivePage'],
  ['pages/CompetitiveTeachingPage', 'pages/student/CompetitiveTeachingPage'],
  // components → feature groups
  ['components/competitive/CompetitiveHub', 'features/competitive/hub/CompetitiveHub'],
  ['components/competitive/ExamFlow', 'features/competitive/exam/ExamFlow'],
  ['components/competitive/LiveExamPanel', 'features/competitive/exam/LiveExamPanel'],
  ['components/competitive/TopicQuizzesFlow', 'features/competitive/quiz/TopicQuizzesFlow'],
  ['components/competitive/WeeklyTestsFlow', 'features/competitive/weekly/WeeklyTestsFlow'],
  [
    'components/competitive/QuestionaryExplanationFlow',
    'features/competitive/ai-explanation/QuestionaryExplanationFlow',
  ],
  ['components/competitive/ExamCard', 'features/competitive/components/ExamCard'],
  ['components/competitive/CompetitiveCards', 'features/competitive/components/CompetitiveCards'],
  // services
  ['services/aiExamGenerator', 'features/competitive/services/aiExamGenerator'],
  ['services/buildFullExamSession', 'features/competitive/services/buildFullExamSession'],
  ['services/competitiveExamApi', 'features/competitive/services/competitiveExamApi'],
  ['services/examDifficultyValidator', 'features/competitive/services/examDifficultyValidator'],
  ['services/examOptionShuffle', 'features/competitive/services/examOptionShuffle'],
  ['services/examOptionValidator', 'features/competitive/services/examOptionValidator'],
  ['services/examQuestionQuality', 'features/competitive/services/examQuestionQuality'],
  ['services/examSessionDiversity', 'features/competitive/services/examSessionDiversity'],
  ['services/examSlotPlan', 'features/competitive/services/examSlotPlan'],
  ['services/examSourceValidator', 'features/competitive/services/examSourceValidator'],
  ['services/examSubjectValidator', 'features/competitive/services/examSubjectValidator'],
  ['services/finalizeExamPaper', 'features/competitive/services/finalizeExamPaper'],
  ['services/weeklyExamSchedule', 'features/competitive/services/weeklyExamSchedule'],
  // data
  ['data/competitiveQuestions', 'features/competitive/data/competitiveQuestions'],
  ['data/examContentFallbacks', 'features/competitive/data/examContentFallbacks'],
  ['data/examMeta', 'features/competitive/data/examMeta'],
  ['data/examSyllabus', 'features/competitive/data/examSyllabus'],
  ['data/examThemes', 'features/competitive/data/examThemes'],
  ['data/competitive/', 'features/competitive/data/competitive/'],
];

function rewriteImportPath(specifier) {
  // Already aliased correctly?
  if (specifier.startsWith('@/features/competitive/')) return specifier;

  // Relative or @/ — normalize to a path we can match
  let body = specifier;
  let prefix = '';
  if (body.startsWith('@/')) {
    prefix = '@/';
    body = body.slice(2);
  }

  // Sort remaps longest-first
  const sorted = [...MODULE_REMAPS].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    // Match end of relative path: ../../stores/competitiveStore
    const idx = body.indexOf(from);
    if (idx === -1) continue;
    // Prefer matching at a path segment boundary
    if (idx > 0 && body[idx - 1] !== '/') continue;
    const before = body.slice(0, idx);
    // If relative (has ../ or ./), replace whole thing with @/to
    if (!prefix && (before.includes('..') || before.startsWith('.'))) {
      return `@/${to}${body.slice(idx + from.length)}`;
    }
    if (prefix === '@/') {
      return `@/${to}${body.slice(idx + from.length)}`;
    }
    // bare? unlikely
    return `@/${to}${body.slice(idx + from.length)}`;
  }
  return specifier;
}

function rewriteFile(file) {
  let s = fs.readFileSync(file, 'utf8');
  const orig = s;

  // import / export / dynamic import string literals
  s = s.replace(
    /((?:from|import)\s*\(?\s*|export\s+[^'"]*from\s+)(['"])([^'"]+)\2/g,
    (full, pre, q, spec) => {
      const next = rewriteImportPath(spec);
      if (next === spec) return full;
      return `${pre}${q}${next}${q}`;
    },
  );

  // await import('...')
  s = s.replace(/import\(\s*(['"])([^'"]+)\1\s*\)/g, (full, q, spec) => {
    const next = rewriteImportPath(spec);
    if (next === spec) return full;
    return `import(${q}${next}${q})`;
  });

  // Fix intra-feature relative sibling imports that broke after regrouping
  const rel = path.relative(path.join(process.cwd(), 'src'), file).replace(/\\/g, '/');

  if (rel.startsWith('features/competitive/')) {
    // Hub lazy loads
    if (rel.endsWith('hub/CompetitiveHub.tsx')) {
      s = s.replace(
        "import('./ExamFlow')",
        "import('@/features/competitive/exam/ExamFlow')",
      );
      s = s.replace(
        "import('./TopicQuizzesFlow')",
        "import('@/features/competitive/quiz/TopicQuizzesFlow')",
      );
      s = s.replace(
        "import('./QuestionaryExplanationFlow')",
        "import('@/features/competitive/ai-explanation/QuestionaryExplanationFlow')",
      );
      s = s.replace(
        "import('./WeeklyTestsFlow')",
        "import('@/features/competitive/weekly/WeeklyTestsFlow')",
      );
    }

    // ExamFlow local comps moved to components/
    if (rel.endsWith('exam/ExamFlow.tsx')) {
      s = s.replace("from './ExamCard'", "from '@/features/competitive/components/ExamCard'");
      s = s.replace(
        "from './CompetitiveCards'",
        "from '@/features/competitive/components/CompetitiveCards'",
      );
      // LiveExamPanel still sibling
    }

    if (rel.endsWith('quiz/TopicQuizzesFlow.tsx')) {
      s = s.replace(
        "from './CompetitiveCards'",
        "from '@/features/competitive/components/CompetitiveCards'",
      );
    }

    if (rel.endsWith('weekly/WeeklyTestsFlow.tsx')) {
      s = s.replace("from './ExamFlow'", "from '@/features/competitive/exam/ExamFlow'");
    }

    // Shared globals wrongly still relative within feature
    const globalFixes = [
      ["from '@/data/mockData'", null], // already ok
      ["from '../data/mockData'", "from '@/data/mockData'"],
      ["from './mockData'", "from '@/data/mockData'"],
      ["from '../services/aiService'", "from '@/services/aiService'"],
      ["from './aiService'", "from '@/services/aiService'"],
      ["from '../services/analyticsService'", "from '@/services/analyticsService'"],
      ["from './analyticsService'", "from '@/services/analyticsService'"],
      ["from './adapters/mockAdapter'", "from '@/services/adapters/mockAdapter'"],
      ["from '../stores/authStore'", "from '@/stores/authStore'"],
      ["from '../stores/toastStore'", "from '@/stores/toastStore'"],
      ["from '../lib/firebase'", "from '@/lib/firebase'"],
      ["from '../types'", "from '@/types'"],
      ["from '../types/", "from '@/types/"],
      ["from '../utils/routes'", "from '@/utils/routes'"],
      ["from '../utils/imageVision'", "from '@/utils/imageVision'"],
      ["from '../utils/examText'", "from '@/utils/examText'"],
      ["from './examText'", "from '@/utils/examText'"],
      ["from '../hooks/useSpeechRecognition'", "from '@/hooks/useSpeechRecognition'"],
    ];
    for (const [from, to] of globalFixes) {
      if (to && s.includes(from)) s = s.replaceAll(from, to);
    }
  }

  // StudentCompetitivePage
  if (rel.endsWith('pages/student/StudentCompetitivePage.tsx')) {
    s = s.replace(
      /from ['"][^'"]*CompetitiveHub['"]/,
      "from '@/features/competitive/hub/CompetitiveHub'",
    );
  }

  if (s !== orig) {
    fs.writeFileSync(file, s);
    return true;
  }
  return false;
}

const files = walk('src');
let n = 0;
for (const f of files) {
  if (rewriteFile(f)) {
    n++;
    console.log('updated', path.relative(process.cwd(), f));
  }
}
console.log('files updated:', n);
