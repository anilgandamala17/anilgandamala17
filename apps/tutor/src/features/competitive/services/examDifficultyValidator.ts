import type { Question } from '@/features/competitive/data/competitiveQuestions';
import type { ExamDifficulty } from '@/features/competitive/data/examSyllabus';

const DIFFICULTY_RANK: Record<ExamDifficulty, number> = { Easy: 0, Medium: 1, Hard: 2 };

const HARD_MARKERS =
  /\b(assertion|reason|minimum|maximum|determine|prove|non[- ]?routine|multi[- ]?step|if .+ then|which of the following is (not|incorrect)|exception)\b/i;
const EASY_MARKERS =
  /\b(what is the|define|which of the following is the|si unit|name of|largest|smallest|basic unit)\b/i;

export interface DifficultyValidationResult {
  valid: boolean;
  reason?: string;
  inferred?: ExamDifficulty;
}

function countNumbers(text: string): number {
  return (text.match(/-?\d+(?:\.\d+)?/g) || []).length;
}

function clauseCount(text: string): number {
  return text.split(/[.;:?]/).filter((s) => s.trim().length > 8).length;
}

export function inferQuestionDifficulty(q: Pick<Question, 'text' | 'questionFormat' | 'difficulty'>): ExamDifficulty {
  const text = q.text ?? '';
  const fmt = q.questionFormat ?? '';
  let score = DIFFICULTY_RANK[q.difficulty ?? 'Medium'];

  if (HARD_MARKERS.test(text)) score += 1;
  if (EASY_MARKERS.test(text) && countNumbers(text) <= 1) score -= 1;
  if (countNumbers(text) >= 3) score += 1;
  if (clauseCount(text) >= 3) score += 1;
  if (fmt === 'ASSERTION_REASON' || fmt === 'STATEMENT_PAIR') score += 1;
  if (fmt === 'CONCEPTUAL_DIRECT' && countNumbers(text) === 0) score -= 1;
  if (fmt === 'NUMERICAL_WORD' && countNumbers(text) >= 2) score += 1;

  if (score <= 0) return 'Easy';
  if (score >= 2) return 'Hard';
  return 'Medium';
}

export function validateQuestionDifficulty(
  q: Question,
  expected: ExamDifficulty,
): DifficultyValidationResult {
  const inferred = inferQuestionDifficulty(q);
  const gap = Math.abs(DIFFICULTY_RANK[inferred] - DIFFICULTY_RANK[expected]);
  if (gap >= 2) {
    return { valid: false, reason: `difficulty_mismatch:${expected}_vs_${inferred}`, inferred };
  }
  if (gap === 1 && inferred !== expected) {
    return { valid: true, inferred };
  }
  return { valid: true, inferred };
}

export function validateQuestionsDifficulty(
  questions: Question[],
  expectedDifficulties: ExamDifficulty[],
): { valid: Question[]; rejected: number; reasons: string[] } {
  const valid: Question[] = [];
  const reasons: string[] = [];
  let rejected = 0;
  for (let i = 0; i < questions.length; i++) {
    const expected = expectedDifficulties[i] ?? questions[i].difficulty ?? 'Medium';
    const result = validateQuestionDifficulty(questions[i], expected);
    if (result.valid) {
      valid.push({ ...questions[i], difficulty: expected });
    } else {
      rejected += 1;
      if (result.reason) reasons.push(result.reason);
    }
  }
  return { valid, rejected, reasons };
}
