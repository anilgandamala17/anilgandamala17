import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, Target, Clock, Zap, Flame, CheckCircle2, Orbit } from 'lucide-react';

type ExamMissionCardProps = {
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

export default function ExamMissionCard({
  readiness,
  weeklyScores,
  growthPct,
  accuracy,
  efficiencyMinPerQ,
  streakDays,
  topicsCompleted,
  targetLabel = 'Curriculum mastery',
  hasActivity,
}: ExamMissionCardProps) {
  const reduced = useReducedMotion();
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
  const tier = !hasActivity
    ? 'Getting started'
    : readiness >= 85
      ? 'Exam ready'
      : readiness >= 65
        ? 'On track'
        : readiness >= 35
          ? 'Building'
          : 'Just started';
  const r = 38;
  const circ = 2 * Math.PI * r;
  const displayReady = hasActivity ? readiness : 0;

  return (
    <div
      className="dash-card h-full flex flex-col gap-5"
      style={{ background: 'var(--dash-grad-exam)', minHeight: '100%' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--dash-grad-brand)' }}
          >
            <Target className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2
              className="text-[15px] font-bold tracking-tight"
              style={{ fontFamily: 'var(--dash-font-display)', color: 'var(--dash-text)' }}
            >
              Exam readiness
            </h2>
            <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
              {targetLabel}
            </p>
          </div>
        </div>
        {hasActivity ? (
          <div
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold tabular-nums px-2.5 py-1 rounded-full"
            style={{
              background: growthPct >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
              color: growthPct >= 0 ? '#059669' : '#e11d48',
            }}
          >
            <TrendingUp className={`w-3.5 h-3.5 ${growthPct < 0 ? 'rotate-180' : ''}`} />
            {growthPct >= 0 ? '+' : ''}
            {growthPct}%
          </div>
        ) : null}
      </div>

      {!hasActivity ? (
        <div className="dash-empty-state flex-1 py-10">
          <Orbit className="w-6 h-6" style={{ color: 'var(--dash-brand)' }} />
          <p className="dash-empty-state__title">No exam data yet</p>
          <p className="dash-empty-state__body">
            Complete a lesson or quiz and your exam readiness and weekly scores will update here.
          </p>
        </div>
      ) : (
        <>
          <div
            className="rounded-2xl p-4 border"
            style={{
              background: 'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(238,242,255,0.65))',
              borderColor: 'var(--dash-border)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="relative w-[88px] h-[88px] shrink-0">
                <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r={r}
                    fill="none"
                    stroke="var(--dash-border-strong)"
                    strokeWidth="9"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r={r}
                    fill="none"
                    stroke="url(#examReadyGrad2)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ * (1 - Math.max(0, displayReady / 100)) }}
                    transition={{ duration: reduced ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <defs>
                    <linearGradient id="examReadyGrad2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-xl font-extrabold tabular-nums leading-none"
                    style={{ fontFamily: 'var(--dash-font-display)', color: 'var(--dash-text)' }}
                  >
                    {displayReady}%
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-[0.14em] mt-1"
                    style={{ color: 'var(--dash-text-3)' }}
                  >
                    {tier}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--dash-text-3)' }}>
                  Weekly quiz scores
                </p>
                <div className="h-[64px] flex items-end gap-1.5">
                  {bars.map((score, i) => {
                    const isNow = i === bars.length - 1;
                    const heightPct = score > 0 ? Math.max(14, score) : 4;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <motion.div
                          className="w-full max-w-[14px] mx-auto rounded-md"
                          style={{
                            background:
                              score > 0
                                ? isNow
                                  ? 'linear-gradient(to top, #4f46e5, #0ea5e9)'
                                  : 'linear-gradient(to top, rgba(79,70,229,0.4), rgba(14,165,233,0.55))'
                                : 'var(--dash-surface-2)',
                          }}
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPct}%` }}
                          transition={{
                            delay: reduced ? 0 : 0.04 * i,
                            type: 'spring',
                            stiffness: 150,
                            damping: 16,
                          }}
                          title={score > 0 ? `${score}%` : 'No quiz'}
                        />
                        <span
                          className="text-[9px] font-semibold"
                          style={{ color: isNow ? 'var(--dash-brand)' : 'var(--dash-text-3)' }}
                        >
                          {dayLabels[i]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-auto">
            <MiniStat
              icon={<Clock className="w-3.5 h-3.5" />}
              label="Pace"
              value={efficiencyMinPerQ > 0 ? `${efficiencyMinPerQ}` : '—'}
              unit={efficiencyMinPerQ > 0 ? 'min' : ''}
              accent="#0ea5e9"
            />
            <MiniStat
              icon={<Zap className="w-3.5 h-3.5" />}
              label="Accuracy"
              value={`${accuracy}`}
              unit="%"
              accent="#f59e0b"
            />
            <MiniStat
              icon={<Flame className="w-3.5 h-3.5" />}
              label="Streak"
              value={`${streakDays}`}
              unit="d"
              accent="#f43f5e"
            />
            <MiniStat
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              label="Completed"
              value={`${topicsCompleted}`}
              unit=""
              accent="#14b8a6"
            />
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 border"
      style={{
        background: `linear-gradient(160deg, ${accent}14 0%, rgba(255,255,255,0.92) 55%)`,
        borderColor: `${accent}28`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1" style={{ color: accent }}>
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'var(--dash-text-3)' }}>
          {label}
        </span>
      </div>
      <p
        className="text-[15px] font-extrabold tabular-nums leading-none"
        style={{ fontFamily: 'var(--dash-font-display)', color: 'var(--dash-text)' }}
      >
        {value}
        {unit ? (
          <span className="text-[10px] font-semibold ml-0.5" style={{ color: 'var(--dash-text-3)' }}>
            {unit}
          </span>
        ) : null}
      </p>
    </div>
  );
}
