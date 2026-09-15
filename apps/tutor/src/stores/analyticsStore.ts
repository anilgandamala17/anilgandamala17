import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Achievement,
    SessionAnalytics,
    ProgressMetrics
} from '../types';
import { notifyStudentLearningChanged } from '../services/studentLearningNotify';
import { useCurriculumStore } from './curriculumStore';

const MAX_STORED_SESSIONS = 80;

interface AnalyticsStore {
    sessions: SessionAnalytics[];
    achievements: Achievement[];
    metrics: ProgressMetrics;

    // Actions
    addSession: (session: SessionAnalytics) => void;
    replaceSessions: (sessions: SessionAnalytics[]) => void;
    resetSessions: () => void;
    updateMetrics: () => void;
    checkAchievements: () => void;
    unlockAchievement: (id: string) => void;
}

const DAY_MS = 86_400_000;

/** Day bucket in the learner's own timezone, so a 11pm session is not counted as tomorrow. */
function localDayNumber(value: string | number): number | null {
    const date = new Date(value);
    const time = date.getTime();
    if (Number.isNaN(time)) return null;
    return Math.floor((time - date.getTimezoneOffset() * 60_000) / DAY_MS);
}

function activeDays(sessions: SessionAnalytics[]): number[] {
    const days = new Set<number>();
    for (const session of sessions) {
        const day = localDayNumber(session.date);
        if (day !== null) days.add(day);
    }
    return [...days].sort((a, b) => a - b);
}

function currentStreak(days: number[]): number {
    if (days.length === 0) return 0;
    const today = localDayNumber(Date.now());
    if (today === null) return 0;
    const seen = new Set(days);
    // A streak survives until the end of the next day, so yesterday's session still counts today.
    let cursor = seen.has(today) ? today : today - 1;
    if (!seen.has(cursor)) return 0;
    let streak = 0;
    while (seen.has(cursor)) {
        streak++;
        cursor--;
    }
    return streak;
}

/** Best run of consecutive study days ever recorded. */
export function longestStreakFor(sessions: SessionAnalytics[]): number {
    let best = 0;
    let run = 0;
    let previous: number | null = null;
    for (const day of activeDays(sessions)) {
        run = previous !== null && day === previous + 1 ? run + 1 : 1;
        previous = day;
        if (run > best) best = run;
    }
    return best;
}

/** Minutes studied on each of the last 7 local days, oldest first. */
function weeklyHoursFrom(sessions: SessionAnalytics[]): number[] {
    const today = localDayNumber(Date.now());
    if (today === null) return [0, 0, 0, 0, 0, 0, 0];
    const minutes = new Array(7).fill(0) as number[];
    for (const session of sessions) {
        const day = localDayNumber(session.date);
        if (day === null) continue;
        const offset = today - day;
        if (offset >= 0 && offset < 7) minutes[6 - offset] += session.durationMinutes;
    }
    return minutes.map((m) => Math.round((m / 60) * 10) / 10);
}

type ScoredSession = SessionAnalytics & { quizScore: number };

export function scoredSessions(sessions: SessionAnalytics[]): ScoredSession[] {
    return sessions.filter((s): s is ScoredSession => typeof s.quizScore === 'number');
}

/** Distinct topics finished; the same topic revisited must not count twice. */
function completedTopicIds(sessions: SessionAnalytics[]): Set<string> {
    return new Set(
        sessions
            .filter((s) => s.completionPercentage >= 100)
            .map((s) => s.topicId)
            .filter((id) => Boolean(id) && id !== 'unknown')
    );
}

const initialAchievements: Achievement[] = [
    {
        id: 'first_step',
        name: 'First Step',
        description: 'Complete your first learning session',
        icon: '🎯',
        target: 1,
        progress: 0,
    },
    {
        id: 'quick_learner',
        name: 'Quick Learner',
        description: 'Complete a topic with >90% quiz score',
        icon: '⚡',
        target: 1,
        progress: 0,
    },
    {
        id: 'dedicated_student',
        name: 'Dedicated Student',
        description: 'Study for more than 5 hours total',
        icon: '📚',
        target: 300, // minutes
        progress: 0,
    },
    {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Maintain a 3-day learning streak',
        icon: '🔥',
        target: 3,
        progress: 0,
    }
];

export const useAnalyticsStore = create<AnalyticsStore>()(
    persist(
        (set, get) => ({
            sessions: [],
            achievements: initialAchievements,
            metrics: {
                totalHours: 0,
                topicsCompleted: 0,
                averageQuizScore: 0,
                knowledgeRetention: 0,
                weeklyHours: [0, 0, 0, 0, 0, 0, 0],
                streakDays: 0,
                conceptMastery: {},
                dailyActivity: [],
                learningVelocity: 0
            },

            addSession: (session) => {
                set((state) => ({
                    sessions: [...state.sessions, session].slice(-MAX_STORED_SESSIONS)
                }));
                if (session.completionPercentage >= 100 && session.topicId) {
                    useCurriculumStore.getState().recordTopicCompleteById(session.topicId);
                }
                get().updateMetrics();
                get().checkAchievements();
                notifyStudentLearningChanged();
            },

            replaceSessions: (sessions) => {
                const trimmed = [...sessions]
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(-MAX_STORED_SESSIONS);
                set({ sessions: trimmed });
                get().updateMetrics();
                get().checkAchievements();
            },

            resetSessions: () => {
                set({
                    sessions: [],
                    achievements: initialAchievements,
                    metrics: {
                        totalHours: 0,
                        topicsCompleted: 0,
                        averageQuizScore: 0,
                        knowledgeRetention: 0,
                        weeklyHours: [0, 0, 0, 0, 0, 0, 0],
                        streakDays: 0,
                        conceptMastery: {},
                        dailyActivity: [],
                        learningVelocity: 0
                    }
                });
            },

            updateMetrics: () => {
                const { sessions } = get();
                const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
                const topicsCompleted = completedTopicIds(sessions).size;
                const scored = scoredSessions(sessions);
                const days = activeDays(sessions);

                set((state) => {
                    const mastery = { ...state.metrics.conceptMastery };
                    scored.forEach(s => {
                        mastery[s.topicId] = Math.max(mastery[s.topicId] || 0, s.quizScore);
                    });

                    const spanWeeks = days.length ? Math.max(1, (days[days.length - 1] - days[0] + 1) / 7) : 1;

                    return {
                        metrics: {
                            ...state.metrics,
                            totalHours: Math.round((totalMinutes / 60) * 10) / 10,
                            topicsCompleted,
                            // Only quizzes that actually recorded a score may move the average.
                            averageQuizScore: scored.length
                                ? Math.round(scored.reduce((acc, s) => acc + s.quizScore, 0) / scored.length)
                                : 0,
                            weeklyHours: weeklyHoursFrom(sessions),
                            streakDays: currentStreak(days),
                            conceptMastery: mastery,
                            learningVelocity: Math.round((topicsCompleted / spanWeeks) * 10) / 10,
                        }
                    };
                });
            },

            checkAchievements: () => {
                const { sessions, metrics } = get();
                const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
                const bestQuizScore = sessions.reduce((best, s) => Math.max(best, s.quizScore ?? 0), 0);
                const earned: Record<string, number> = {
                    first_step: sessions.length,
                    quick_learner: bestQuizScore > 90 ? 1 : 0,
                    dedicated_student: totalMinutes,
                    streak_master: metrics.streakDays,
                };

                set((state) => ({
                    achievements: state.achievements.map((a) => {
                        const raw = earned[a.id];
                        if (raw === undefined) return a;
                        const target = a.target ?? 1;
                        const progress = Math.min(raw, target);
                        const unlockedAt = a.unlockedAt ?? (raw >= target ? new Date().toISOString() : undefined);
                        if (progress === a.progress && unlockedAt === a.unlockedAt) return a;
                        return { ...a, progress, unlockedAt };
                    })
                }));
            },

            unlockAchievement: (id) => {
                set((state) => ({
                    achievements: state.achievements.map(a =>
                        a.id === id
                            ? { ...a, unlockedAt: new Date().toISOString(), progress: a.target }
                            : a
                    )
                }));
            }
        }),
        {
            name: 'analytics-storage',
            // Sessions are per-student (Firestore + uid-scoped cache). Do not persist
            // them on a global key or account switches leak another learner's progress.
            partialize: () => ({}),
            onRehydrateStorage: () => (state) => {
                if (!state) return;
                state.updateMetrics();
                state.checkAchievements();
            },
        }
    )
);
