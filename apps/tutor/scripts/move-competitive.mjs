/**
 * Phase 2: physically relocate competitive feature files.
 * Run from apps/tutor. Uses robocopy MOVE on Windows.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = process.cwd();

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function moveFile(fromRel, toRel) {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  if (!fs.existsSync(from)) {
    console.warn('SKIP missing', fromRel);
    return;
  }
  ensureDir(path.dirname(to));
  if (fs.existsSync(to)) {
    console.warn('SKIP exists', toRel);
    return;
  }
  fs.renameSync(from, to);
  console.log('mv', fromRel, '→', toRel);
}

function moveDir(fromRel, toRel) {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  if (!fs.existsSync(from)) {
    console.warn('SKIP missing dir', fromRel);
    return;
  }
  ensureDir(path.dirname(to));
  if (process.platform === 'win32') {
    try {
      execSync(`robocopy "${from}" "${to}" /E /MOVE /NFL /NDL /NJH /NJS /nc /ns /np`, {
        stdio: 'inherit',
      });
    } catch (e) {
      // robocopy exit 0-7 are success-ish
      if (e.status > 7) throw e;
    }
    // clean empty leftover
    try {
      if (fs.existsSync(from) && fs.readdirSync(from).length === 0) fs.rmdirSync(from);
    } catch {}
  } else {
    fs.renameSync(from, to);
  }
  console.log('mvdir', fromRel, '→', toRel);
}

ensureDir('src/features/competitive');

// Components → feature groups
moveFile(
  'src/components/competitive/CompetitiveHub.tsx',
  'src/features/competitive/hub/CompetitiveHub.tsx',
);
moveFile(
  'src/components/competitive/ExamFlow.tsx',
  'src/features/competitive/exam/ExamFlow.tsx',
);
moveFile(
  'src/components/competitive/LiveExamPanel.tsx',
  'src/features/competitive/exam/LiveExamPanel.tsx',
);
moveFile(
  'src/components/competitive/TopicQuizzesFlow.tsx',
  'src/features/competitive/quiz/TopicQuizzesFlow.tsx',
);
moveFile(
  'src/components/competitive/WeeklyTestsFlow.tsx',
  'src/features/competitive/weekly/WeeklyTestsFlow.tsx',
);
moveFile(
  'src/components/competitive/QuestionaryExplanationFlow.tsx',
  'src/features/competitive/ai-explanation/QuestionaryExplanationFlow.tsx',
);
moveFile(
  'src/components/competitive/ExamCard.tsx',
  'src/features/competitive/components/ExamCard.tsx',
);
moveFile(
  'src/components/competitive/CompetitiveCards.tsx',
  'src/features/competitive/components/CompetitiveCards.tsx',
);

// Store / lib / utils
moveFile(
  'src/stores/competitiveStore.ts',
  'src/features/competitive/stores/competitiveStore.ts',
);
moveFile(
  'src/lib/competitiveRoute.ts',
  'src/features/competitive/lib/competitiveRoute.ts',
);
moveFile(
  'src/utils/competitiveTeaching.ts',
  'src/features/competitive/utils/competitiveTeaching.ts',
);

// Pages
moveFile(
  'src/pages/StudentCompetitivePage.tsx',
  'src/pages/student/StudentCompetitivePage.tsx',
);
moveFile(
  'src/pages/CompetitiveTeachingPage.tsx',
  'src/pages/student/CompetitiveTeachingPage.tsx',
);

// Services (competitive-only)
const services = [
  'aiExamGenerator.ts',
  'buildFullExamSession.ts',
  'competitiveExamApi.ts',
  'examDifficultyValidator.ts',
  'examOptionShuffle.ts',
  'examOptionValidator.ts',
  'examQuestionQuality.ts',
  'examSessionDiversity.ts',
  'examSlotPlan.ts',
  'examSourceValidator.ts',
  'examSubjectValidator.ts',
  'finalizeExamPaper.ts',
  'weeklyExamSchedule.ts',
];
for (const f of services) {
  moveFile(`src/services/${f}`, `src/features/competitive/services/${f}`);
}

// Data
const dataFiles = [
  'competitiveQuestions.ts',
  'examContentFallbacks.ts',
  'examMeta.ts',
  'examSyllabus.ts',
  'examThemes.tsx',
];
for (const f of dataFiles) {
  moveFile(`src/data/${f}`, `src/features/competitive/data/${f}`);
}
moveDir('src/data/competitive', 'src/features/competitive/data/competitive');

// Remove empty competitive components dir
const leftover = path.join(root, 'src/components/competitive');
if (fs.existsSync(leftover)) {
  try {
    fs.rmdirSync(leftover);
    console.log('removed empty components/competitive');
  } catch (e) {
    console.warn('leftover', leftover, e.message);
  }
}

console.log('Phase 2 moves done');
