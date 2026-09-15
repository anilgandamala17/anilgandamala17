import { getExamSourcePolicy, summarizeSourcePolicy, type ExamSourcePolicy } from './examSourcePolicy';
import { formatNcertBlock, getNcertChapters, hasNcertMapping } from './ncertSyllabus';
import { EXAM_GENERATION_VERSION } from './generationVersion';
import {
  getExamDifficultyGuidance,
  getExamPatternGuide,
  getSubjectGenerationBrief,
  getSyllabusUnits,
} from '../examSyllabus';

export interface ExamGenerationContext {
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  topicIds?: string[];
  officialSyllabusUnits: string[];
  ncertChapters: ReturnType<typeof getNcertChapters>;
  sourcePolicy: ExamSourcePolicy;
  sourcePolicySummary: string;
  difficultyProfile: string;
  patternGuide: string;
  subjectBrief: string;
  generationVersion: string;
  hasContentMapping: boolean;
}

export function buildExamGenerationContext(args: {
  examId: string;
  examName: string;
  subjectId: string;
  subjectName: string;
  topicIds?: string[];
}): ExamGenerationContext | null {
  const policy = getExamSourcePolicy(args.examId);
  if (!policy) return null;

  const hasMapping = hasNcertMapping(args.examId, args.subjectId);
  const syllabusUnits = getSyllabusUnits(args.examId, args.subjectId);
  if (!hasMapping && syllabusUnits.length === 0) return null;

  return {
    examId: args.examId,
    examName: args.examName,
    subjectId: args.subjectId,
    subjectName: args.subjectName,
    topicIds: args.topicIds,
    officialSyllabusUnits: syllabusUnits,
    ncertChapters: getNcertChapters(args.examId, args.subjectId),
    sourcePolicy: policy,
    sourcePolicySummary: summarizeSourcePolicy(policy),
    difficultyProfile: getExamDifficultyGuidance(args.examId),
    patternGuide: getExamPatternGuide(args.examId),
    subjectBrief: getSubjectGenerationBrief(args.examId, args.subjectId, args.subjectName),
    generationVersion: EXAM_GENERATION_VERSION,
    hasContentMapping: hasMapping || syllabusUnits.length > 0,
  };
}

export function formatGenerationContextBlock(
  ctx: ExamGenerationContext,
  extras?: { slotTable?: string },
): string {
  const ncertBlock = formatNcertBlock(ctx.examId, ctx.subjectId, ctx.topicIds);
  const units = ctx.officialSyllabusUnits.join('; ');
  return [
    `SOURCE POLICY: ${ctx.sourcePolicySummary}`,
    ncertBlock ? `NCERT / INTERMEDIATE CHAPTERS (subject-scoped):\n${ncertBlock}` : '',
    units ? `OFFICIAL SYLLABUS UNITS: ${units}` : '',
    `DIFFICULTY: ${ctx.difficultyProfile}`,
    `PATTERN: ${ctx.patternGuide}`,
    `SUBJECT LOCK:\n${ctx.subjectBrief}`,
    extras?.slotTable
      ? `PER-QUESTION SLOTS (generate each question to match its slot exactly):\n${extras.slotTable}`
      : '',
    `DISTRACTOR RULES: Each wrong option must reflect a plausible student error (unit slip, sign error, wrong formula step). No absurd options.`,
    `VARIETY: Vary question openings and stem structures; do not repeat the same skeleton.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
