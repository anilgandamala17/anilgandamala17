import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

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
    /** Owner of the in-memory `attempts` slice (auth user id or guest). */
    ownerId: string | null;
    attempts: CompetitiveAttempt[];
    /** Bind store to the signed-in user so curriculum + competitive share the same personal history. */
    bindUser: (userId: string | null) => void;
    recordAttempt: (
        attempt: Omit<CompetitiveAttempt, 'id' | 'completedAt' | 'accuracy'> & { accuracy?: number },
    ) => void;
    clearAttempts: () => void;
}

const LEGACY_KEY = 'aira-competitive-analytics';
const KEY_PREFIX = 'aira-competitive-analytics:v2:';

function storageKeyFor(ownerId: string | null): string {
    return `${KEY_PREFIX}${ownerId?.trim() || 'guest'}`;
}

function readAttemptsFromKey(key: string): CompetitiveAttempt[] {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as {
            state?: { attempts?: CompetitiveAttempt[] };
            attempts?: CompetitiveAttempt[];
        };
        const list = parsed?.state?.attempts ?? parsed?.attempts;
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

function writeAttemptsToKey(key: string, attempts: CompetitiveAttempt[]) {
    try {
        localStorage.setItem(key, JSON.stringify({ state: { attempts }, version: 2 }));
    } catch {
        /* quota / private mode */
    }
}

/** Migrate pre-user-scoped blob into the current owner's key once. */
function migrateLegacyIfNeeded(ownerId: string | null): CompetitiveAttempt[] {
    const key = storageKeyFor(ownerId);
    const existing = readAttemptsFromKey(key);
    if (existing.length) return existing;
    const legacy = readAttemptsFromKey(LEGACY_KEY);
    // Also handle zustand persist envelope under LEGACY_KEY
    if (!legacy.length) {
        try {
            const raw = localStorage.getItem(LEGACY_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as { state?: { attempts?: CompetitiveAttempt[] } };
                if (Array.isArray(parsed?.state?.attempts) && parsed.state.attempts.length) {
                    writeAttemptsToKey(key, parsed.state.attempts);
                    return parsed.state.attempts;
                }
            }
        } catch {
            /* ignore */
        }
        return [];
    }
    writeAttemptsToKey(key, legacy);
    return legacy;
}

let activeOwnerId: string | null = null;

const scopedStorage: StateStorage = {
    getItem: (name) => {
        void name;
        const key = storageKeyFor(activeOwnerId);
        return localStorage.getItem(key);
    },
    setItem: (name, value) => {
        void name;
        localStorage.setItem(storageKeyFor(activeOwnerId), value);
    },
    removeItem: (name) => {
        void name;
        localStorage.removeItem(storageKeyFor(activeOwnerId));
    },
};

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
        rankPrediction:
            readinessFromAttempts(attempts) >= 75
                ? 'Top 15%'
                : readinessFromAttempts(attempts) >= 55
                  ? 'Top 40%'
                  : 'Building pace',
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
        recentAttempts: attempts.slice(0, 5),
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
            'Review year practice papers after each mock to spot recurring patterns.',
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
        (set, get) => ({
            ownerId: null,
            attempts: [],
            bindUser: (userId) => {
                const nextId = userId?.trim() || null;
                if (get().ownerId === nextId && activeOwnerId === nextId) return;
                activeOwnerId = nextId;
                const attempts = migrateLegacyIfNeeded(nextId);
                set({ ownerId: nextId, attempts });
            },
            recordAttempt: (raw) => {
                const total = Math.max(1, raw.total);
                const accuracy = raw.accuracy ?? Math.round((raw.score / total) * 100);
                const attempt: CompetitiveAttempt = {
                    ...raw,
                    accuracy,
                    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    completedAt: new Date().toISOString(),
                };
                set((s) => {
                    const attempts = [attempt, ...s.attempts].slice(0, 120);
                    writeAttemptsToKey(storageKeyFor(s.ownerId ?? activeOwnerId), attempts);
                    return { attempts };
                });
            },
            clearAttempts: () => {
                const owner = get().ownerId ?? activeOwnerId;
                writeAttemptsToKey(storageKeyFor(owner), []);
                set({ attempts: [] });
            },
        }),
        {
            name: LEGACY_KEY,
            version: 2,
            storage: createJSONStorage(() => scopedStorage),
            partialize: (s) => ({ attempts: s.attempts, ownerId: s.ownerId }),
        },
    ),
);
