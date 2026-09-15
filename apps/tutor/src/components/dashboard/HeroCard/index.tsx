import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import OrbitRings from './OrbitRings';
import StatMiniCard from './StatMiniCard';
import StudentAvatarVideo from './StudentAvatarVideo';

export type HeroStat = {
  label: string;
  value: string;
  tone: 'sky' | 'amber' | 'rose' | 'teal';
  sparkline?: number[];
  onClick?: () => void;
  emptyHint?: string;
};

type HeroCardProps = {
  learnerName: string;
  readiness: number;
  description: ReactNode;
  orbitLabel: string;
  stats: HeroStat[];
};

export default function HeroCard({
  learnerName,
  readiness,
  description,
  orbitLabel,
  stats,
}: HeroCardProps) {
  return (
    <motion.section
      className="dash-card dash-card--featured relative overflow-hidden h-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="absolute -top-24 -right-16 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--dash-brand-glow), transparent 70%)' }}
      />

      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-center sm:items-stretch relative">
        <div className="w-full sm:w-[200px] md:w-[240px] lg:w-[260px] shrink-0 relative">
          <OrbitRings readiness={readiness} className="w-full">
            <div className="flex items-center justify-center w-full">
              <StudentAvatarVideo readiness={readiness} />
            </div>
          </OrbitRings>
          <div
            className="absolute left-1/2 -translate-x-1/2 z-20 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap shadow-lg"
            style={{
              bottom: '2%',
              background: 'var(--dash-surface-ink)',
              color: 'var(--dash-text-inv)',
            }}
          >
            {orbitLabel}
          </div>
        </div>

        <div className="flex-1 min-w-0 text-center sm:text-left flex flex-col justify-center pt-2 sm:pt-0">
          <p
            className="inline-flex self-center sm:self-start items-center gap-1.5 dash-eyebrow mb-2"
            style={{ color: 'var(--dash-brand-2)', letterSpacing: '0.14em' }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--dash-brand-2)' }} />
            Curriculum overview
          </p>
          <h1
            className="tracking-tight leading-[1.15]"
            style={{
              fontFamily: 'var(--dash-font-display)',
              fontSize: 'var(--dash-hero-size)',
              fontWeight: 800,
              color: 'var(--dash-text)',
            }}
          >
            Welcome back, {learnerName}
          </h1>
          <p
            className="mt-2 text-sm sm:text-[15px] max-w-xl mx-auto sm:mx-0"
            style={{ color: 'var(--dash-text-2)', lineHeight: 1.45 }}
          >
            {description}
          </p>

          <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {stats.map((s, i) => (
              <StatMiniCard key={s.label} {...s} delay={i * 0.06} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
