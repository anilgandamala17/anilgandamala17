import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import OrbitRings from './HeroCard/OrbitRings';
import StatMiniCard from './HeroCard/StatMiniCard';
import StudentAvatarVideo from './HeroCard/StudentAvatarVideo';

export type WelcomeStat = {
  label: string;
  value: string;
  tone: 'sky' | 'amber' | 'rose' | 'teal';
  sparkline?: number[];
  onClick?: () => void;
  emptyHint?: string;
};

type WelcomeOverviewProps = {
  learnerName: string;
  readiness: number;
  description: ReactNode;
  orbitLabel: string;
  stats: WelcomeStat[];
  growthPct?: number;
  showGrowth?: boolean;
};

/**
 * Compact welcome + KPI strip — avatar ~120–148px with orbit retained.
 */
export default function WelcomeOverview({
  learnerName,
  readiness,
  description,
  orbitLabel,
  stats,
  growthPct = 0,
  showGrowth = false,
}: WelcomeOverviewProps) {
  return (
    <motion.section
      className="dash-card dash-card--featured"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Welcome overview"
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-stretch">
        <div className="w-[120px] sm:w-[132px] md:w-[148px] shrink-0 relative">
          <OrbitRings readiness={readiness} className="w-full">
            <div className="flex items-center justify-center w-full">
              <StudentAvatarVideo size="compact" readiness={readiness} />
            </div>
          </OrbitRings>
          <div
            className="absolute left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap shadow-md max-w-[140px] truncate"
            style={{
              bottom: '0%',
              background: 'var(--dash-surface-ink)',
              color: 'var(--dash-text-inv)',
            }}
          >
            {orbitLabel}
          </div>
        </div>

        <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col justify-center">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <p className="dash-eyebrow" style={{ color: 'var(--dash-brand-2)' }}>
              Learning command center
            </p>
            {showGrowth ? (
              <span
                className={`dash-badge ${growthPct >= 0 ? 'dash-badge--success' : 'dash-badge--warning'}`}
              >
                {growthPct >= 0 ? '+' : ''}
                {growthPct}% vs last week
              </span>
            ) : null}
          </div>
          <h1 className="dash-type-h1">Welcome back, {learnerName}</h1>
          <p className="mt-1.5 dash-type-body max-w-xl mx-auto sm:mx-0">{description}</p>

          <div className="mt-3 sm:mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
            {stats.map((s, i) => (
              <StatMiniCard key={s.label} {...s} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
