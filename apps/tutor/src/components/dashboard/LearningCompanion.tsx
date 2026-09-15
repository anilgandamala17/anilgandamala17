import { motion } from 'framer-motion';

type LearningCompanionProps = {
  readiness: number;
  streakDays: number;
  totalHours: number;
  topicsCompleted: number;
  learnerInitials: string;
  className?: string;
};

/**
 * Interactive "Knowledge Orbit" — a game-like progress companion students enjoy,
 * without emoji mascots. Rings map to readiness / streak / study volume.
 */
export function LearningCompanion({
  readiness,
  streakDays,
  totalHours,
  topicsCompleted,
  learnerInitials,
  className = '',
}: LearningCompanionProps) {
  const r1 = Math.min(100, readiness);
  const r2 = Math.min(100, streakDays * 12);
  const r3 = Math.min(100, totalHours * 8);
  const circ = 2 * Math.PI * 54;

  return (
    <div className={`relative aspect-square w-full max-w-[220px] mx-auto ${className}`}>
      {/* Soft aura */}
      <div className="absolute inset-[8%] rounded-full bg-gradient-to-br from-sky-400/25 via-indigo-500/20 to-teal-400/15 blur-2xl" />

      <svg viewBox="0 0 200 200" className="relative z-10 w-full h-full drop-shadow-sm" aria-hidden>
        <defs>
          <linearGradient id="orbitCore" x1="30%" y1="20%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="45%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
          <linearGradient id="orbitRingA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
          <linearGradient id="orbitRingB" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <filter id="orbitGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer dashed orbit */}
        <motion.circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke="rgba(99,102,241,0.18)"
          strokeWidth="1"
          strokeDasharray="4 6"
          animate={{ rotate: 360 }}
          transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '100px 100px' }}
        />

        {/* Progress ring — readiness */}
        <circle cx="100" cy="100" r="54" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="7" />
        <motion.circle
          cx="100"
          cy="100"
          r="54"
          fill="none"
          stroke="url(#orbitRingA)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (r1 / 100) * circ }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          transform="rotate(-90 100 100)"
          filter="url(#orbitGlow)"
        />

        {/* Mid ring — streak */}
        <circle cx="100" cy="100" r="68" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="3.5" />
        <motion.circle
          cx="100"
          cy="100"
          r="68"
          fill="none"
          stroke="url(#orbitRingB)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 68}
          initial={{ strokeDashoffset: 2 * Math.PI * 68 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 68 - (r2 / 100) * 2 * Math.PI * 68 }}
          transition={{ duration: 1.6, delay: 0.15, ease: 'easeOut' }}
          transform="rotate(-90 100 100)"
        />

        {/* Inner core */}
        <motion.circle
          cx="100"
          cy="100"
          r="36"
          fill="url(#orbitCore)"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '100px 100px' }}
        />
        <circle cx="88" cy="86" r="10" fill="white" opacity="0.28" />

        {/* Satellites — topics cleared nodes */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
          const active = i < Math.min(4, Math.max(1, topicsCompleted));
          const x = 100 + Math.cos(angle) * 88;
          const y = 100 + Math.sin(angle) * 88;
          return (
            <motion.g key={i}>
              <motion.circle
                cx={x}
                cy={y}
                r={active ? 5.5 : 3.5}
                fill={active ? '#6366F1' : '#CBD5E1'}
                animate={active ? { scale: [1, 1.25, 1] } : undefined}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
            </motion.g>
          );
        })}
      </svg>

      {/* Center identity badge */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-lg border border-white/80 dark:border-slate-700 flex items-center justify-center">
          <span className="text-lg sm:text-xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-300 font-[family-name:Inter_Tight,Inter,sans-serif]">
            {learnerInitials.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {readiness}% ready
        </p>
      </div>

      {/* Volume chip */}
      <motion.div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-semibold shadow-lg whitespace-nowrap"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {totalHours}h logged · {r3 > 0 ? 'orbit active' : 'ignite orbit'}
      </motion.div>
    </div>
  );
}

export default LearningCompanion;
