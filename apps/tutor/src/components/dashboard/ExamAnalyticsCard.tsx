import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Clock, Zap, Flame, CheckCircle2 } from 'lucide-react';

type ExamAnalyticsCardProps = {
  readiness: number;
  weeklyScores: number[];
  growthPct: number;
  accuracy: number;
  efficiencyMinPerQ: number;
  streakDays: number;
  topicsCompleted: number;
  targetLabel?: string;
  hasActivity: boolean;
};

export default function ExamAnalyticsCard({
  readiness,
  weeklyScores,
  growthPct,
  accuracy,
  efficiencyMinPerQ,
  streakDays,
  topicsCompleted,
  targetLabel = 'Curriculum mastery',
  hasActivity,
}: ExamAnalyticsCardProps) {
  const bars = weeklyScores.length === 7 ? weeklyScores : [0, 0, 0, 0, 0, 0, 0];
  const dayLabels = (() => {
    const labels: string[] = [];
    for (let i = -6; i <= 0; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      labels.push(i === 0 ? 'Now' : d.toLocaleDateString(undefined, { weekday: 'narrow' }));
    }
    return labels;
  })();

  const tier =
    readiness >= 85 ? 'Elite' : readiness >= 65 ? 'Rising' : readiness >= 35 ? 'Building' : 'Start';

  return (
    <div className="h-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col gap-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                Exam mission
              </h2>
              <p className="text-[11px] text-slate-500 truncate">{targetLabel}</p>
            </div>
          </div>
        </div>
        <div
          className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${
            growthPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          <TrendingUp className={`w-3.5 h-3.5 ${growthPct < 0 ? 'rotate-180' : ''}`} />
          {growthPct >= 0 ? '+' : ''}
          {growthPct}%
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative w-[72px] h-[72px] sm:w-20 sm:h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="8" />
            <motion.circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="url(#readyGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 32}
              initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - Math.max(0.04, readiness / 100)) }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="readyGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0EA5E9" />
                <stop offset="100%" stopColor="#4F46E5" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums leading-none">
              {readiness}%
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
              {tier}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="h-[56px] sm:h-16 flex items-end gap-1">
            {bars.map((score, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <motion.div
                  className="w-full rounded-md bg-gradient-to-t from-indigo-600 to-sky-400"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(8, score)}%` }}
                  transition={{ delay: 0.05 * i, type: 'spring', stiffness: 140, damping: 16 }}
                />
                <span className="text-[9px] font-medium text-slate-400">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
          {!hasActivity && (
            <p className="text-[11px] text-slate-500 mt-2">Complete a lesson to calibrate readiness.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-auto">
        <MiniStat icon={<Clock className="w-3 h-3" />} label="Pace" value={efficiencyMinPerQ > 0 ? `${efficiencyMinPerQ}` : '—'} unit="min" />
        <MiniStat icon={<Zap className="w-3 h-3" />} label="Accuracy" value={`${accuracy}`} unit="%" />
        <MiniStat icon={<Flame className="w-3 h-3" />} label="Streak" value={`${streakDays}`} unit="d" />
        <MiniStat icon={<CheckCircle2 className="w-3 h-3" />} label="Cleared" value={`${topicsCompleted}`} unit="" />
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  unit,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-2.5 py-2">
      <div className="flex items-center gap-1 text-slate-400 mb-0.5">
        {icon}
        <span className="text-[9px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
        {value}
        {unit ? <span className="text-[10px] font-semibold text-slate-400 ml-0.5">{unit}</span> : null}
      </p>
    </div>
  );
}
