import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type OrbitRingsProps = {
  readiness: number;
  children?: ReactNode;
  className?: string;
};

/** Decorative progress rings around the Student-in-Orbit scene. */
export default function OrbitRings({ readiness, children, className = '' }: OrbitRingsProps) {
  const reduced = useReducedMotion();
  const clamped = Math.max(4, Math.min(100, readiness));
  const r = 54;
  const circ = 2 * Math.PI * r;

  return (
    <div className={`relative ${className}`}>
      {/* Ambient purple glow */}
      <div
        className="absolute inset-[-4%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--dash-brand-glow) 0%, transparent 70%)',
        }}
      />

      <svg
        viewBox="0 0 160 160"
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden
      >
        {/* Outer faint ring */}
        <circle
          cx="80"
          cy="80"
          r="76"
          fill="none"
          stroke="var(--dash-brand)"
          strokeOpacity="0.12"
          strokeWidth="1"
        />

        {/* Middle ring with cardinal dots — slow rotate */}
        <motion.g
          style={{ transformOrigin: '80px 80px' }}
          animate={reduced ? undefined : { rotate: 360 }}
          transition={reduced ? undefined : { duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx="80"
            cy="80"
            r="68"
            fill="none"
            stroke="var(--dash-brand)"
            strokeOpacity="0.22"
            strokeWidth="1.5"
            strokeDasharray="3 8"
          />
          {[0, 90, 180, 270].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const x = 80 + Math.cos(rad) * 68;
            const y = 80 + Math.sin(rad) * 68;
            return <circle key={deg} cx={x} cy={y} r="2.2" fill="var(--dash-brand)" opacity="0.7" />;
          })}
        </motion.g>

        {/* Track */}
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="var(--dash-border-strong)"
          strokeWidth="5"
        />
        {/* Progress arc — animates on load */}
        <motion.circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="url(#orbitArcGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (clamped / 100) * circ }}
          transition={{ duration: reduced ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
          transform="rotate(-90 80 80)"
        />

        <defs>
          <linearGradient id="orbitArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative z-10 p-[8%]">{children}</div>
    </div>
  );
}
