import { motion, useReducedMotion } from 'framer-motion';
import { Compass, Zap } from 'lucide-react';

type SuperStrengthCardProps = {
  subjectName: string;
  subtitle: string;
  progressPct: number;
  contextLine?: string;
  empty?: boolean;
};

export default function SuperStrengthCard({
  subjectName,
  subtitle,
  progressPct,
  contextLine = 'Based on your recent practice sessions',
  empty = false,
}: SuperStrengthCardProps) {
  const reduced = useReducedMotion();
  const pct = empty ? 0 : Math.max(0, Math.min(100, progressPct));

  if (empty) {
    return (
      <div
        className="relative overflow-hidden rounded-[var(--dash-radius-lg)] p-4 sm:p-5 flex-1 min-h-[148px]"
        style={{
          background: 'var(--dash-grad-strength)',
          boxShadow: 'var(--dash-shadow-3)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #fff, transparent)',
          }}
        />
        <div className="relative flex flex-col h-full justify-between gap-3 text-white">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.12)' }}
              >
                <Compass className="w-4 h-4 text-sky-200" />
              </div>
              <span className="dash-eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Super strength
              </span>
            </div>
            <h3
              className="tracking-tight"
              style={{ fontFamily: 'var(--dash-font-display)', fontSize: '1.2rem', fontWeight: 700 }}
            >
              No strength data yet
            </h3>
            <p className="mt-1.5 text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Complete a lesson or quiz and your strongest subject will appear here.
            </p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <div className="h-full w-[6%] rounded-full" style={{ background: 'rgba(255,255,255,0.35)' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-[var(--dash-radius-lg)] p-4 sm:p-5 flex-1 text-white min-h-[148px]"
      style={{
        background: 'var(--dash-grad-strength)',
        boxShadow: 'var(--dash-shadow-3)',
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #fff, transparent), radial-gradient(1px 1px at 40% 80%, #fff, transparent)',
        }}
      />
      <div
        className="absolute -top-8 -right-6 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.35), transparent 70%)' }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.12)',
              boxShadow: '0 0 18px rgba(251,191,36,0.35)',
            }}
          >
            <Zap className="w-4 h-4 text-amber-300" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.8))' }} />
          </div>
          <span className="dash-eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Super strength
          </span>
        </div>
        <h3
          className="tracking-tight"
          style={{ fontFamily: 'var(--dash-font-display)', fontSize: '1.25rem', fontWeight: 700 }}
        >
          {subjectName}
        </h3>
        <p className="mt-1.5 text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.72)' }}>
          {subtitle}
        </p>
        <p className="mt-1 text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.42)' }}>
          {contextLine}
        </p>
        <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #38bdf8, #2dd4bf, #a3e635)' }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(pct, 2)}%` }}
            transition={{ duration: reduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          />
        </div>
      </div>
    </div>
  );
}
