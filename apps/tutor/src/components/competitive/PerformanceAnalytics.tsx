import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    BarChart3,
    Flame,
    Gauge,
    Lightbulb,
    Target,
    TrendingUp,
    Trophy,
    Zap,
} from 'lucide-react';
import {
    computeCompetitiveInsights,
    type CompetitiveAttemptMode,
    useCompetitiveStore,
} from '../../stores/competitiveStore';
import { analytics } from '../../services/analyticsService';
import { PremiumMetricCard } from './CompetitiveCards';

const MODE_FILTERS: Array<{ id: 'all' | CompetitiveAttemptMode; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'mock', label: 'Mock' },
    { id: 'pyq', label: 'PYQ' },
    { id: 'standard', label: 'Standard' },
];

export default function PerformanceAnalytics() {
    const attempts = useCompetitiveStore((s) => s.attempts);
    const [modeFilter, setModeFilter] = useState<'all' | CompetitiveAttemptMode>('all');
    const filteredAttempts = useMemo(
        () => (modeFilter === 'all' ? attempts : attempts.filter((a) => a.mode === modeFilter)),
        [attempts, modeFilter],
    );
    const insights = computeCompetitiveInsights(filteredAttempts);

    useEffect(() => {
        analytics.performanceAnalyticsViewed(modeFilter);
    }, [modeFilter]);

    return (
        <div className="comp-analytics space-y-8">
            <header className="comp-surface-card relative overflow-hidden p-6 sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
                            Performance intelligence
                        </p>
                        <h2 className="font-display text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                            Exam readiness dashboard
                        </h2>
                        <p className="mt-2 max-w-xl text-sm font-medium text-slate-500 dark:text-slate-400">
                            Every attempt you finish in Competitive Mode feeds this live report —
                            accuracy, speed, weak topics, and AI study cues.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 px-5 py-4 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-orange-950/30">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                            <Gauge className="h-7 w-7" />
                        </div>
                        <div>
                            <div className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                                {insights.readiness}%
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700/80 dark:text-amber-300/80">
                                Readiness · {insights.rankPrediction}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-wrap gap-2">
                {MODE_FILTERS.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => setModeFilter(f.id)}
                        className={`rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider transition ${
                            modeFilter === f.id
                                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <PremiumMetricCard
                    icon={<Trophy className="h-5 w-5" />}
                    label="Attempts"
                    value={String(insights.attemptCount)}
                    accent="#D97706"
                    detail="Completed assessments"
                />
                <PremiumMetricCard
                    icon={<Target className="h-5 w-5" />}
                    label="Accuracy"
                    value={`${insights.overallAccuracy}%`}
                    accent="#059669"
                    detail="Across all attempts"
                />
                <PremiumMetricCard
                    icon={<Zap className="h-5 w-5" />}
                    label="Avg sec / Q"
                    value={insights.avgSpeed ? String(insights.avgSpeed) : '—'}
                    accent="#4F46E5"
                    detail="Solve-time efficiency"
                />
                <PremiumMetricCard
                    icon={<Activity className="h-5 w-5" />}
                    label="Questions"
                    value={`${insights.totalCorrect}/${insights.totalQuestions || 0}`}
                    accent="#DB2777"
                    detail="Correct / attempted"
                />
            </div>

            {insights.trend.length > 0 && (
                <section className="comp-surface-card p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                        <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                            Accuracy trend
                        </h3>
                    </div>
                    <div className="flex h-36 items-end gap-2 sm:gap-3">
                        {insights.trend.map((point, i) => (
                            <div key={`${point.date}-${i}`} className="flex flex-1 flex-col items-center gap-2">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(8, point.accuracy)}%` }}
                                    transition={{ delay: i * 0.05, type: 'spring', damping: 18 }}
                                    className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-orange-600 to-violet-400"
                                    title={`${point.accuracy}%`}
                                />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                    {point.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <InsightList
                    title="Strength areas"
                    icon={<Flame className="h-4 w-4 text-emerald-500" />}
                    empty="Complete a few tests to surface strengths."
                    items={insights.strong.map((s) => ({
                        name: s.name,
                        meta: `${s.accuracy}% · ${s.questions} Qs`,
                        tone: 'strong' as const,
                    }))}
                />
                <InsightList
                    title="Weak areas"
                    icon={<BarChart3 className="h-4 w-4 text-rose-500" />}
                    empty="No weak spots detected yet — keep practicing."
                    items={insights.weak.map((s) => ({
                        name: s.name,
                        meta: `${s.accuracy}% · ${s.avgSecondsPerQ}s/Q`,
                        tone: 'weak' as const,
                    }))}
                />
            </div>

            <section className="comp-surface-card relative overflow-hidden p-5 sm:p-6">
                <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-500/10 blur-3xl" />
                <div className="relative z-10 mb-4 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                    <h3 className="text-sm font-black uppercase tracking-[0.14em] text-orange-900 dark:text-orange-100">
                        AI study recommendations
                    </h3>
                </div>
                <ul className="relative z-10 space-y-3">
                    {insights.recommendations.map((tip) => (
                        <li
                            key={tip}
                            className="flex gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 dark:border-white/5 dark:bg-slate-900/50 dark:text-slate-200"
                        >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                            {tip}
                        </li>
                    ))}
                </ul>
            </section>

            {filteredAttempts.length > 0 && (
                <section className="comp-surface-card p-5 sm:p-6">
                    <h3 className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                        Recent attempts{modeFilter !== 'all' ? ` · ${modeFilter}` : ''}
                    </h3>
                    <div className="space-y-2">
                        {filteredAttempts.slice(0, 8).map((a) => (
                            <div
                                key={a.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40"
                            >
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                                        {a.examName} · {a.subjectName}
                                    </div>
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        {a.mode} · {new Date(a.completedAt).toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black tabular-nums text-slate-900 dark:text-white">
                                        {a.score}/{a.total} · {a.accuracy}%
                                    </div>
                                    <div className="text-[10px] font-semibold text-slate-400">
                                        {Math.floor(a.timeSeconds / 60)}m {a.timeSeconds % 60}s
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function InsightList({
    title,
    icon,
    empty,
    items,
}: {
    title: string;
    icon: React.ReactNode;
    empty: string;
    items: { name: string; meta: string; tone: 'strong' | 'weak' }[];
}) {
    return (
        <section className="comp-surface-card p-5">
            <div className="mb-4 flex items-center gap-2">
                {icon}
                <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
                    {title}
                </h3>
            </div>
            {items.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{empty}</p>
            ) : (
                <ul className="space-y-2">
                    {items.map((item) => (
                        <li
                            key={item.name}
                            className={`flex items-center justify-between rounded-2xl px-3.5 py-3 ${
                                item.tone === 'strong'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                                    : 'bg-rose-50 dark:bg-rose-950/30'
                            }`}
                        >
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                {item.name}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {item.meta}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
