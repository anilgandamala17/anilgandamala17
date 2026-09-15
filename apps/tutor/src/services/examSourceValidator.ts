import type { Question } from '../data/competitiveQuestions';
import {
  allowedSourceBases,
  getExamSourcePolicy,
  type SourceBasis,
} from '../data/competitive/examSourcePolicy';
import {
  findChapterById,
  getNcertChapters,
  getSyllabusUnitTitles,
  hasNcertMapping,
  type NcertChapter,
} from '../data/competitive/ncertSyllabus';
import { getSyllabusUnits } from '../data/examSyllabus';

export interface ExamQuestionMetadata {
  examId?: string;
  subjectId?: string;
  topicId?: string;
  syllabusUnit?: string;
  sourceBasis?: SourceBasis;
}

export type ValidatedQuestion = Question & ExamQuestionMetadata;

export interface SourceValidationContext {
  examId: string;
  subjectId: string;
  topicIds?: string[];
}

export interface SourceValidationResult {
  valid: boolean;
  reason?: string;
}

export interface AssignMetadataContext extends SourceValidationContext {
  defaultTopicId?: string;
  defaultSyllabusUnit?: string;
  defaultSourceBasis?: SourceBasis;
}

function normalizeUnit(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function unitMatchesAllowed(syllabusUnit: string, allowed: string[]): boolean {
  const norm = normalizeUnit(syllabusUnit);
  return allowed.some((a) => {
    const an = normalizeUnit(a);
    return norm === an || norm.includes(an) || an.includes(norm);
  });
}

function expandAllowedUnitsFromChapter(chapter: NcertChapter, officialUnits: string[]): string[] {
  const extra = [chapter.title, ...chapter.concepts, ...chapter.syllabusUnitIds];
  for (const sid of chapter.syllabusUnitIds) {
    const sidNorm = normalizeUnit(sid);
    for (const ou of officialUnits) {
      const ouNorm = normalizeUnit(ou);
      if (ouNorm.includes(sidNorm) || sidNorm.includes(ouNorm)) {
        extra.push(ou);
      }
    }
  }
  return extra;
}

function resolveSyllabusUnitFromChapter(
  chapter: NcertChapter | null | undefined,
  officialUnits: string[],
  fallback?: string,
): string | undefined {
  if (!chapter) return fallback;
  for (const sid of chapter.syllabusUnitIds) {
    const sidNorm = normalizeUnit(sid);
    const match = officialUnits.find((ou) => {
      const ouNorm = normalizeUnit(ou);
      return ouNorm.includes(sidNorm) || sidNorm.includes(ouNorm);
    });
    if (match) return match;
  }
  return chapter.title || fallback;
}

export function validateQuestionSource(
  q: ValidatedQuestion,
  ctx: SourceValidationContext,
): SourceValidationResult {
  const policy = getExamSourcePolicy(ctx.examId);
  if (!policy) {
    return { valid: false, reason: 'unknown_exam_policy' };
  }

  const topicId = q.topicId;
  const syllabusUnit = q.syllabusUnit ?? q.topic;
  const sourceBasis = q.sourceBasis;

  if (!syllabusUnit?.trim()) {
    return { valid: false, reason: 'missing_syllabus_unit' };
  }

  const officialUnits = getSyllabusUnits(ctx.examId, ctx.subjectId);
  const ncertTitles = getSyllabusUnitTitles(ctx.examId, ctx.subjectId);
  let allowedUnits = [...officialUnits, ...ncertTitles];

  if (topicId?.trim() && hasNcertMapping(ctx.examId, ctx.subjectId)) {
    const chapter = findChapterById(ctx.examId, ctx.subjectId, topicId);
    if (chapter) {
      allowedUnits = [...allowedUnits, ...expandAllowedUnitsFromChapter(chapter, officialUnits)];
    }
  }

  if (!unitMatchesAllowed(syllabusUnit, allowedUnits)) {
    return { valid: false, reason: 'syllabus_unit_out_of_scope' };
  }

  if (hasNcertMapping(ctx.examId, ctx.subjectId)) {
    if (!topicId?.trim()) {
      return { valid: false, reason: 'missing_topic_id' };
    }
    const chapter = findChapterById(ctx.examId, ctx.subjectId, topicId);
    if (!chapter) {
      return { valid: false, reason: 'invalid_topic_id' };
    }
    if (ctx.topicIds?.length && !ctx.topicIds.includes(topicId)) {
      return { valid: false, reason: 'topic_out_of_requested_range' };
    }
  }

  if (sourceBasis) {
    const allowed = allowedSourceBases(policy);
    if (!allowed.includes(sourceBasis)) {
      return { valid: false, reason: 'invalid_source_basis' };
    }
  }

  return { valid: true };
}

export function validateQuestionsSource(
  questions: ValidatedQuestion[],
  ctx: SourceValidationContext,
): { valid: ValidatedQuestion[]; rejected: number; reasons: string[] } {
  const valid: ValidatedQuestion[] = [];
  const reasons: string[] = [];
  let rejected = 0;
  for (const q of questions) {
    const result = validateQuestionSource(q, ctx);
    if (result.valid) {
      valid.push(q);
    } else {
      rejected += 1;
      if (result.reason) reasons.push(result.reason);
    }
  }
  return { valid, rejected, reasons };
}

export function assignDefaultMetadata(
  q: Question,
  ctx: AssignMetadataContext,
): ValidatedQuestion {
  const chapters = getNcertChapters(ctx.examId, ctx.subjectId);
  const defaultChapter = chapters[0];
  const officialUnits = getSyllabusUnits(ctx.examId, ctx.subjectId);
  const policy = getExamSourcePolicy(ctx.examId);
  const defaultBasis: SourceBasis =
    ctx.defaultSourceBasis ??
    (policy?.foundation === 'INTERMEDIATE_FIRST'
      ? 'INTERMEDIATE'
      : policy?.foundation === 'NCERT' || policy?.foundation === 'NCERT_FOUNDATION'
        ? 'NCERT'
        : 'OFFICIAL_SYLLABUS');

  const topicId =
    ctx.defaultTopicId ??
    defaultChapter?.id ??
    `unit-${normalizeUnit(q.topic).replace(/\s/g, '-')}`;
  const chapter = findChapterById(ctx.examId, ctx.subjectId, topicId) ?? defaultChapter;
  const syllabusUnit =
    ctx.defaultSyllabusUnit ??
    resolveSyllabusUnitFromChapter(chapter, officialUnits) ??
    q.syllabusUnit ??
    q.topic;

  return {
    ...q,
    examId: ctx.examId,
    subjectId: ctx.subjectId,
    topicId,
    syllabusUnit,
    sourceBasis: defaultBasis,
  };
}

export function catalogHasSubjectMapping(examId: string, subjectId: string): boolean {
  const units = getSyllabusUnits(examId, subjectId);
  return units.length > 0 || hasNcertMapping(examId, subjectId);
}
