import type { Question } from '../data/competitiveQuestions';

export type AnswerPositionDistribution = Record<0 | 1 | 2 | 3, number>;

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function hashSeed(parts: string[]): number {
  let h = 0;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Fisher-Yates shuffle; correctAnswer tracks the correct option text. */
export function shuffleQuestionOptions(q: Question, seed?: number): Question {
  if (!Array.isArray(q.options) || q.options.length !== 4) return q;
  const correctText = q.options[q.correctAnswer] ?? q.options[0];
  const r = mulberry32(seed ?? hashSeed([q.id, q.text.slice(0, 40)]));
  const opts = [...q.options];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  const correctAnswer = opts.findIndex((o) => o === correctText);
  return { ...q, options: opts, correctAnswer: correctAnswer < 0 ? 0 : correctAnswer };
}

export function analyzeAnswerPositionDistribution(questions: Question[]): AnswerPositionDistribution {
  const dist: AnswerPositionDistribution = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const q of questions) {
    if (q.correctAnswer >= 0 && q.correctAnswer <= 3) {
      dist[q.correctAnswer as 0 | 1 | 2 | 3] += 1;
    }
  }
  return dist;
}

function isSkewed(dist: AnswerPositionDistribution, total: number): boolean {
  if (total < 8) return false;
  const maxShare = Math.max(...Object.values(dist)) / total;
  const minShare = Math.min(...Object.values(dist)) / total;
  return maxShare > 0.4 || minShare < 0.1;
}

/** Re-shuffle questions in skewed slots until distribution is acceptable or attempts exhausted. */
export function balanceAnswerPositions(questions: Question[], seed: string): Question[] {
  if (questions.length < 8) {
    return questions.map((q, i) =>
      shuffleQuestionOptions(q, hashSeed([seed, String(i), q.id])),
    );
  }
  let result = questions.map((q, i) =>
    shuffleQuestionOptions(q, hashSeed([seed, String(i), q.id])),
  );
  for (let attempt = 0; attempt < 12; attempt++) {
    const dist = analyzeAnswerPositionDistribution(result);
    if (!isSkewed(dist, result.length)) return result;
    result = result.map((q, i) =>
      shuffleQuestionOptions(q, hashSeed([seed, String(attempt), String(i), q.text.slice(0, 20)])),
    );
  }
  return result;
}

export function shuffleAndBalancePaper(
  questions: Question[],
  paperSeed: string,
): Question[] {
  return balanceAnswerPositions(questions, paperSeed);
}
