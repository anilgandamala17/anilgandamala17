import type { Question } from '../data/competitiveQuestions';
import type { ExamDifficulty } from '../data/examSyllabus';
import { EXAM_GENERATION_VERSION } from '../data/competitive/generationVersion';
import type { ScienceDiscipline } from '../data/competitive/subjectDiscipline';
import { dedupeQuestions, dedupeQuestionTemplates } from './examQuestionQuality';
import { validateQuestionsSubject } from './examSubjectValidator';
import { validateQuestionsSource, type ValidatedQuestion } from './examSourceValidator';
import { validateQuestionsDifficulty } from './examDifficultyValidator';
import { validateQuestionsOptions } from './examOptionValidator';
import { shuffleAndBalancePaper } from './examOptionShuffle';
import type { ExamQuestionSlot } from './examSlotPlan';

export interface FinalizePaperContext {
  examId: string;
  subjectId: string;
  subjectName: string;
  scienceDiscipline?: ScienceDiscipline;
  paperSeed?: string;
}

export interface FinalizePaperResult {
  questions: Question[];
  rejected: {
    subject: number;
    source: number;
    difficulty: number;
    options: number;
    duplicates: number;
  };
}

function stripInternalMeta(q: ValidatedQuestion): Question {
  const { topicId: _t, syllabusUnit: _s, sourceBasis: _b, examId: _e, ...pub } = q;
  return pub;
}

export function finalizeExamPaper(
  questions: ValidatedQuestion[],
  slots: ExamQuestionSlot[],
  ctx: FinalizePaperContext,
): FinalizePaperResult {
  const rejected = { subject: 0, source: 0, difficulty: 0, options: 0, duplicates: 0 };

  const subjectCtx = {
    examId: ctx.examId,
    subjectId: ctx.subjectId,
    subjectName: ctx.subjectName,
    scienceDiscipline: ctx.scienceDiscipline,
  };
  const sourceCtx = { examId: ctx.examId, subjectId: ctx.subjectId };

  const withFormats = questions.map((q, i) => ({
    ...q,
    questionFormat: q.questionFormat ?? slots[i]?.format,
    difficulty: (slots[i]?.difficulty ?? q.difficulty) as ExamDifficulty,
  }));

  const s1 = validateQuestionsSubject(withFormats, subjectCtx);
  rejected.subject = s1.rejected;

  const s2 = validateQuestionsSource(s1.valid, sourceCtx);
  rejected.source = s2.rejected;

  const expectedDiffs = slots.map((s) => s.difficulty);
  const s3 = validateQuestionsDifficulty(s2.valid, expectedDiffs);
  rejected.difficulty = s3.rejected;

  const s4 = validateQuestionsOptions(s3.valid);
  rejected.options = s4.rejected;

  const minKeep = Math.ceil(slots.length * 0.75);
  const pool = s4.valid;
  let deduped = dedupeQuestionTemplates(dedupeQuestions(pool), 2, 0);
  if (deduped.length < minKeep) {
    deduped = dedupeQuestionTemplates(pool, 3, 0);
  }
  if (deduped.length < minKeep) {
    deduped = dedupeQuestionTemplates(pool, 4, 0);
  }
  if (deduped.length < minKeep && pool.length >= minKeep) {
    deduped = dedupeQuestions(pool).slice(0, slots.length);
  }
  rejected.duplicates = pool.length - deduped.length;

  const seed =
    ctx.paperSeed ?? `${ctx.examId}:${ctx.subjectId}:${EXAM_GENERATION_VERSION}`;
  const shuffled = shuffleAndBalancePaper(deduped, seed);

  return {
    questions: shuffled.map(stripInternalMeta),
    rejected,
  };
}
