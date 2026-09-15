import type { Question } from '../data/competitiveQuestions';
import { isValidExamQuestion } from './examQuestionQuality';
import {
  detectDominantForeignDiscipline,
  getSubjectDiscipline,
  type SubjectDiscipline,
} from '../data/competitive/subjectDiscipline';

export interface SubjectValidationContext {
  examId: string;
  subjectId: string;
  subjectName: string;
  /** Locked discipline for integrated science (`sci`, `sat-sci`) sessions. */
  scienceDiscipline?: import('../data/competitive/subjectDiscipline').ScienceDiscipline;
}

function resolveExpectedDiscipline(ctx: SubjectValidationContext): SubjectDiscipline | null {
  const id = ctx.subjectId.toLowerCase();
  if ((id === 'sci' || id === 'sat-sci') && ctx.scienceDiscipline) {
    return ctx.scienceDiscipline;
  }
  return getSubjectDiscipline(ctx.subjectId);
}

function detectForeignDiscipline(
  text: string,
  expected: SubjectDiscipline,
  scienceDiscipline?: SubjectValidationContext['scienceDiscipline'],
): SubjectDiscipline | null {
  const foreign = detectDominantForeignDiscipline(text, expected);
  if (!foreign || !scienceDiscipline) return foreign;
  if (scienceDiscipline === 'biology' && (foreign === 'botany' || foreign === 'zoology')) {
    return null;
  }
  return foreign;
}

export interface SubjectValidationResult {
  valid: boolean;
  reason?: string;
}

function fullQuestionText(q: Pick<Question, 'text' | 'options' | 'explanation'>): string {
  const parts = [q.text, ...(q.options ?? []), q.explanation ?? ''];
  return parts.join(' ');
}

export function validateQuestionSubject(
  q: Question,
  ctx: SubjectValidationContext,
): SubjectValidationResult {
  if (!isValidExamQuestion(q)) {
    return { valid: false, reason: 'structural_invalid' };
  }

  if (q.subjectId && q.subjectId !== ctx.subjectId) {
    return { valid: false, reason: 'subject_id_mismatch' };
  }

  const discipline = resolveExpectedDiscipline(ctx);
  if (!discipline) {
    return { valid: true };
  }

  const stemForeign = detectForeignDiscipline(q.text, discipline, ctx.scienceDiscipline);
  if (stemForeign) {
    return { valid: false, reason: `cross_subject_stem:${stemForeign}` };
  }

  const correctIdx = q.correctAnswer;
  const correctOpt = q.options[correctIdx] ?? '';
  const optForeign = detectForeignDiscipline(correctOpt, discipline, ctx.scienceDiscipline);
  if (optForeign) {
    return { valid: false, reason: `cross_subject_answer:${optForeign}` };
  }

  for (let i = 0; i < q.options.length; i++) {
    const optForeignEach = detectForeignDiscipline(q.options[i], discipline, ctx.scienceDiscipline);
    if (optForeignEach && i !== correctIdx) {
      const stemMarkers = fullQuestionText({ text: q.text, options: [], explanation: '' });
      const optMarkers = q.options[i];
      if (detectForeignDiscipline(stemMarkers + optMarkers, discipline, ctx.scienceDiscipline)) {
        return { valid: false, reason: `cross_subject_option:${optForeignEach}` };
      }
    }
  }

  if (q.explanation) {
    const explForeign = detectForeignDiscipline(q.explanation, discipline, ctx.scienceDiscipline);
    if (explForeign) {
      return { valid: false, reason: `cross_subject_explanation:${explForeign}` };
    }
  }

  return { valid: true };
}

export function validateQuestionsSubject(
  questions: Question[],
  ctx: SubjectValidationContext,
): { valid: Question[]; rejected: number; reasons: string[] } {
  const valid: Question[] = [];
  const reasons: string[] = [];
  let rejected = 0;
  for (const q of questions) {
    const result = validateQuestionSubject(q, ctx);
    if (result.valid) {
      valid.push(q);
    } else {
      rejected += 1;
      if (result.reason) reasons.push(result.reason);
    }
  }
  return { valid, rejected, reasons };
}

export function isIntegratedScienceSubject(subjectId: string): boolean {
  return subjectId === 'sci' || subjectId === 'sat-sci';
}

export function integratedScienceMapsTo(discipline: SubjectDiscipline): boolean {
  return discipline === 'physics' || discipline === 'chemistry' || discipline === 'biology';
}
