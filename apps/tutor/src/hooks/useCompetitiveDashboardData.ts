import { useMemo } from 'react';
import { COMPETITIVE_EXAMS } from '../data/mockData';
import {
  findLatestExamDraft,
  flowTypeToSection,
  type ExamDraft,
} from '../lib/competitiveRoute';
import {
  computeCompetitiveInsights,
  useCompetitiveStore,
  type CompetitiveAttempt,
} from '../stores/competitiveStore';
import { studentRoutes } from '../utils/routes';

export type CompetitiveContinueSession = {
  title: string;
  examName: string;
  subjectLabel: string;
  progressLabel: string;
  questionIndex: number;
  questionTotal: number;
  progressPct: number;
  href: string;
  savedAt: number;
};

function safeNumber(n: unknown): number | null {
  if (typeof n !== 'number' || Number.isNaN(n) || !Number.isFinite(n)) return null;
  return n;
}

function avgScoreFromAttempts(attempts: CompetitiveAttempt[]): number | null {
  if (!attempts.length) return null;
  const scores = attempts
    .map((a) => {
      if (typeof a.netScore === 'number' && Number.isFinite(a.netScore)) return a.netScore;
      if (typeof a.accuracy === 'number' && Number.isFinite(a.accuracy)) return a.accuracy;
      return null;
    })
    .filter((v): v is number => v !== null);
  if (!scores.length) return null;
  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

function bestScoreFromAttempts(attempts: CompetitiveAttempt[]): number | null {
  if (!attempts.length) return null;
  let best: number | null = null;
  for (const a of attempts) {
    const v =
      typeof a.netScore === 'number' && Number.isFinite(a.netScore)
        ? a.netScore
        : typeof a.accuracy === 'number' && Number.isFinite(a.accuracy)
          ? a.accuracy
          : null;
    if (v === null) continue;
    if (best === null || v > best) best = v;
  }
  return best === null ? null : Math.round(best);
}

function deriveSkipped(attempts: CompetitiveAttempt[]): number | null {
  let known = false;
  let skipped = 0;
  for (const a of attempts) {
    const correct = a.correctCount ?? a.score;
    const incorrect = a.incorrectCount;
    if (typeof incorrect !== 'number' || !Number.isFinite(incorrect)) continue;
    known = true;
    const s = a.total - correct - incorrect;
    if (s > 0) skipped += s;
  }
  return known ? skipped : null;
}

function draftToContinue(draft: ExamDraft): CompetitiveContinueSession {
  const exam = COMPETITIVE_EXAMS.find((e) => e.id === draft.examId);
  const examName = exam?.name ?? draft.examId;
  const total = draft.questions.length;
  const index = Math.min(Math.max(0, draft.currentQuestionIndex), Math.max(0, total - 1));
  const answered = draft.userAnswers.filter((a) => a != null && a >= 0).length;
  const subjectLabel =
    draft.scope === 'full' || draft.subjectId === 'full'
      ? 'Full paper'
      : draft.subjectId || 'In progress';
  const section = flowTypeToSection(draft.flowType);
  const params = new URLSearchParams();
  params.set('section', section);
  params.set('step', 'solving');
  params.set('exam', draft.examId);
  if (draft.paperYear) params.set('paper', draft.paperYear);
  if (draft.scope !== 'full' && draft.subjectId && draft.subjectId !== 'full') {
    params.set('subject', draft.subjectId);
  }

  return {
    title: `Continue ${examName}${draft.paperYear ? ` ${draft.paperYear}` : ''}`,
    examName,
    subjectLabel,
    progressLabel: `Question ${index + 1} / ${total}`,
    questionIndex: index + 1,
    questionTotal: total,
    progressPct: total ? Math.round((answered / total) * 100) : 0,
    href: `${studentRoutes.competitive}?${params.toString()}`,
    savedAt: draft.savedAt,
  };
}

/**
 * Data façade for Competitive dashboard mode — real attempts + drafts only.
 */
export function useCompetitiveDashboardData() {
  const attempts = useCompetitiveStore((s) => s.attempts);

  return useMemo(() => {
    let continueSession: CompetitiveContinueSession | null = null;
    try {
      const draft = findLatestExamDraft();
      if (draft) continueSession = draftToContinue(draft);
    } catch {
      continueSession = null;
    }

    const insights = computeCompetitiveInsights(attempts);
    const hasActivity = attempts.length > 0;

    const practiceCount = attempts.filter(
      (a) => a.mode === 'quiz' || a.mode === 'mock',
    ).length;
    const completedCount = attempts.length;

    const averageScore = avgScoreFromAttempts(attempts);
    const bestScore = bestScoreFromAttempts(attempts);
    const skipped = deriveSkipped(attempts);

    const totalIncorrect = attempts.reduce((s, a) => {
      if (typeof a.incorrectCount === 'number') return s + a.incorrectCount;
      const correct = a.correctCount ?? a.score;
      return s + Math.max(0, a.total - correct);
    }, 0);

    const examProgress = COMPETITIVE_EXAMS.map((exam) => {
      const stat = insights.examStats.find((e) => e.id === exam.id);
      const examAttempts = attempts.filter((a) => a.examId === exam.id);
      return {
        id: exam.id,
        name: exam.name,
        attemptCount: examAttempts.length,
        accuracy: stat && examAttempts.length ? safeNumber(stat.accuracy) : null,
        questions: stat?.questions ?? 0,
      };
    });

    const subjectPerformance = insights.subjectStats
      .filter((s) => s.id !== 'full' || s.questions > 0)
      .map((s) => ({
        id: s.id,
        name: s.id === 'full' ? 'Full examination' : s.name,
        accuracy: s.questions ? s.accuracy : null,
        questions: s.questions,
        avgSecondsPerQ: s.avgSecondsPerQ || null,
      }));

    const recentAttempts = insights.recentAttempts.map((a) => ({
      id: a.id,
      exam: a.examName,
      year: a.paperYear ?? null,
      date: a.completedAt,
      score:
        typeof a.netScore === 'number'
          ? a.netScore
          : typeof a.accuracy === 'number'
            ? a.accuracy
            : null,
      scoreLabel:
        typeof a.netScore === 'number'
          ? `${a.netScore} net`
          : typeof a.accuracy === 'number'
            ? `${a.accuracy}%`
            : '—',
      accuracy: typeof a.accuracy === 'number' ? a.accuracy : null,
      status: 'Completed' as const,
      mode: a.mode,
    }));

    const pyqExams = COMPETITIVE_EXAMS.filter((e) => e.papers.length > 0).map((e) => ({
      id: e.id,
      name: e.name,
      latestYear: e.papers[0]?.year ?? null,
      href: `${studentRoutes.competitive}?section=pyqs&exam=${encodeURIComponent(e.id)}`,
    }));

    return {
      hasActivity,
      continueSession,
      overview: {
        examsAttempted: hasActivity
          ? new Set(attempts.map((a) => a.examId)).size
          : null,
        examsCompleted: hasActivity ? completedCount : null,
        practiceTests: hasActivity ? practiceCount : null,
        averageScore: hasActivity ? averageScore : null,
      },
      performance: {
        averageScore: hasActivity ? averageScore : null,
        bestScore: hasActivity ? bestScore : null,
        accuracy: hasActivity ? safeNumber(insights.overallAccuracy) : null,
        questionsAttempted: hasActivity ? insights.totalQuestions : null,
        correct: hasActivity ? insights.totalCorrect : null,
        incorrect: hasActivity ? totalIncorrect : null,
        skipped,
        readiness: hasActivity ? insights.readiness : null,
        rankPrediction: hasActivity ? insights.rankPrediction : null,
      },
      examProgress,
      subjectPerformance,
      recentAttempts,
      pyqExams,
      recommendations: insights.recommendations,
      attemptCount: attempts.length,
    };
  }, [attempts]);
}
