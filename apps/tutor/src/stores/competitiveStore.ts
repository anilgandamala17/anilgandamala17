import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CompetitiveAttemptMode = 'standard' | 'pyq' | 'mock' | 'weekly' | 'quiz';

export interface CompetitiveAttempt {
    id: string;
    examId: string;
    examName: string;
    subjectId: string;
    subjectName: string;
    mode: CompetitiveAttemptMode;
    /** Raw correct-answer count (used for accuracy). */
    score: number;
    total: number;
    accuracy: number;
    /** JEE-style net score when applicable (correct×4 − incorrect). */
    netScore?: number;
    correctCount?: number;
    incorrectCount?: number;
    timeSeconds: number;
    paperYear?: string;
    completedAt: string;
    difficultyBreakdown?: { Easy: number; Medium: number; Hard: number };
}

interface CompetitiveAnalyticsState {
    attempts: CompetitiveAttempt[];
    recordAttempt: (attempt: Omit<CompetitiveAttempt, 'id' | 'completedAt' | 'accuracy'> & { accuracy?: number }) => void;
    clearAttempts: () => void;
}

function readinessFromAttempts(attempts: CompetitiveAttempt[]): number {
    if (!attempts.length) return 0;
    const recent = attempts.slice(0, 12);
    const avgAcc = recent.reduce((s, a) => s + a.accuracy, 0) / recent.length;
    const volumeBonus = Math.min(15, attempts.length * 1.2);
    return Math.round(Math.min(98, avgAcc * 0.85 + volumeBonus));
}

export function computeCompetitiveInsights(attempts: CompetitiveAttempt[]) {
    const bySubject = new Map<string, { correct: number; total: number; time: number; name: string }>();
    const byExam = new Map<string, { correct: number; total: number; name: string }>();

    for (const a of attempts) {
        const sub = bySubject.get(a.subjectId) ?? { correct: 0, total: 0, time: 0, name: a.subjectName };
        sub.correct += a.correctCount ?? a.score;
        sub.total += a.total;
        sub.time += a.timeSeconds;
        bySubject.set(a.subjectId, sub);

        const ex = byExam.get(a.examId) ?? { correct: 0, total: 0, name: a.examName };
        ex.correct += a.correctCount ?? a.score;
        ex.total += a.total;
        byExam.set(a.examId, ex);
    }

    const subjectStats = [...bySubject.entries()].map(([id, v]) => ({
        id,
        name: v.name,
        accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0,
        questions: v.total,
        avgSecondsPerQ: v.total ? Math.round(v.time / v.total) : 0,
    }));

    const weak = [...subjectStats].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
    const strong = [...subjectStats].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);

    const overallAccuracy = attempts.length
        ? Math.round(attempts.reduce((s, a) => s + a.accuracy, 0) / attempts.length)
        : 0;
    const totalQuestions = attempts.reduce((s, a) => s + a.total, 0);
    const totalCorrect = attempts.reduce((s, a) => s + (a.correctCount ?? a.score), 0);
    const avgSpeed = totalQuestions
        ? Math.round(attempts.reduce((s, a) => s + a.timeSeconds, 0) / totalQuestions)
        : 0;

    const trend = attempts
        .slice(0, 8)
        .reverse()
        .map((a) => ({
            label: a.examName.split(' ')[0],
            accuracy: a.accuracy,
            date: a.completedAt.slice(0, 10),
        }));

    return {
        overallAccuracy,
        totalQuestions,
        totalCorrect,
        attemptCount: attempts.length,
        avgSpeed,
        readiness: readinessFromAttempts(attempts),
        rankPrediction: readinessFromAttempts(attempts) >= 75 ? 'Top 15%' : readinessFromAttempts(attempts) >= 55 ? 'Top 40%' : 'Building pace',
        weak,
        strong,
        subjectStats,
        examStats: [...byExam.entries()].map(([id, v]) => ({
            id,
            name: v.name,
            accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0,
            questions: v.total,
        })),
        trend,
        recommendations: buildRecommendations(weak, overallAccuracy, attempts.length),
    };
}

function buildRecommendations(
    weak: { name: string; accuracy: number }[],
    overallAccuracy: number,
    attemptCount: number,
): string[] {
    const tips: string[] = [];
    if (attemptCount === 0) {
        return [
            'Start with a topic quiz in your weakest subject to establish a baseline.',
            'Take one timed mock this week to calibrate speed under pressure.',
            'Review previous-year papers after each mock to spot recurring patterns.',
        ];
    }
    if (weak[0]) {
        tips.push(`Prioritize ${weak[0].name} drills — current accuracy ${weak[0].accuracy}%.`);
    }
    if (overallAccuracy < 60) {
        tips.push('Slow down on Medium questions: accuracy beats speed until you cross 60%.');
    } else if (overallAccuracy >= 75) {
        tips.push('Push Hard-difficulty mocks — your accuracy supports advanced pattern practice.');
    }
    tips.push('Schedule a weekly full-length mock and revisit marked questions the next day.');
    return tips.slice(0, 4);
}

export const useCompetitiveStore = create<CompetitiveAnalyticsState>()(
    persist(
        (set) => ({
            attempts: [],
            recordAttempt: (raw) => {
                const total = Math.max(1, raw.total);
                const accuracy = raw.accuracy ?? Math.round((raw.score / total) * 100);
                const attempt: CompetitiveAttempt = {
                    ...raw,
                    accuracy,
                    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    completedAt: new Date().toISOString(),
                };
                set((s) => ({ attempts: [attempt, ...s.attempts].slice(0, 120) }));
            },
            clearAttempts: () => set({ attempts: [] }),
        }),
        { name: 'aira-competitive-analytics', version: 1 },
    ),
);
