import type { Question } from '@/features/competitive/data/competitiveQuestions';

const ABSURD_OPTION =
  /\b(banana|apple|orange|none of these|all of the above|cannot be determined|not applicable \(\d+\)|999999|123456)\b/i;

export interface OptionValidationResult {
  valid: boolean;
  reason?: string;
}

function parseLeadingNumber(s: string): number | null {
  const m = String(s).trim().match(/^-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export function validateQuestionOptions(q: Question): OptionValidationResult {
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    return { valid: false, reason: 'invalid_option_count' };
  }
  const normalized = q.options.map((o) => String(o).trim().toLowerCase());
  if (new Set(normalized).size < 4) {
    return { valid: false, reason: 'duplicate_options' };
  }
  const correct = q.options[q.correctAnswer] ?? '';
  for (let i = 0; i < q.options.length; i++) {
    if (i === q.correctAnswer) continue;
    if (q.options[i] === correct) {
      return { valid: false, reason: 'correct_in_distractors' };
    }
  }
  for (const opt of q.options) {
    if (ABSURD_OPTION.test(opt)) {
      return { valid: false, reason: 'absurd_option' };
    }
  }

  const nums = q.options.map(parseLeadingNumber).filter((n): n is number => n !== null);
  const hasUnits = q.options.some((o) => /[a-zA-Z%°²³]/.test(String(o)));
  if (nums.length === 4 && !hasUnits) {
    const correctNum = parseLeadingNumber(correct);
    if (correctNum !== null && correctNum !== 0) {
      for (const n of nums) {
        if (n !== correctNum && Math.abs(n / correctNum) >= 100) {
          return { valid: false, reason: 'implausible_numeric_distractor' };
        }
      }
    }
  }

  return { valid: true };
}

export function validateQuestionsOptions(
  questions: Question[],
): { valid: Question[]; rejected: number; reasons: string[] } {
  const valid: Question[] = [];
  const reasons: string[] = [];
  let rejected = 0;
  for (const q of questions) {
    const result = validateQuestionOptions(q);
    if (result.valid) valid.push(q);
    else {
      rejected += 1;
      if (result.reason) reasons.push(result.reason);
    }
  }
  return { valid, rejected, reasons };
}
