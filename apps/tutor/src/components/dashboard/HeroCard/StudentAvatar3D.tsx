import { motion, useReducedMotion } from 'framer-motion';
import { SUBJECT_HEX } from '../theme/subjectColors';
import { StaticStudentFallback } from './StudentAvatar3DFallback';

type StudentAvatar3DProps = {
  readiness: number;
  className?: string;
  scrollY?: number;
};

const ORBIT_ICONS = [
  { color: SUBJECT_HEX.mathematics, r: 42, dur: 14, delay: 0, size: 11 },
  { color: SUBJECT_HEX.science, r: 48, dur: 18, delay: -4, size: 10 },
  { color: SUBJECT_HEX.english, r: 54, dur: 22, delay: -8, size: 9 },
  { color: SUBJECT_HEX.physics, r: 46, dur: 16, delay: -2, size: 10 },
];

/**
 * Student-in-Orbit visual — premium animated 2.5D scene (Framer Motion + SVG).
 * Delivers the mission-control astronaut concept without WebGL (R3F v9 needs React 19;
 * this app is on React 18). Falls back to a static illustration when reduced-motion is set.
 */
export default function StudentAvatar3D({
  readiness,
  className = '',
  scrollY = 0,
}: StudentAvatar3DProps) {
  const reduced = useReducedMotion();
  const parallax = Math.max(-8, Math.min(8, scrollY / 80));

  if (reduced) {
    return (
      <div className={`relative w-full aspect-square max-w-[300px] mx-auto ${className}`}>
        <StaticStudentFallback readiness={readiness} />
      </div>
    );
  }

  return (
    <motion.div
      className={`relative w-full aspect-square max-w-[300px] mx-auto ${className}`}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ y: parallax }}
      role="img"
      aria-label={`Student learning orbit, ${readiness}% ready`}
    >
      <div
        className="absolute inset-[8%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--dash-brand-glow) 0%, transparent 70%)' }}
      />

      {/* Star dust */}
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-indigo-300/70"
          style={{ left: `${12 + (i * 7) % 76}%`, top: `${18 + (i * 11) % 64}%` }}
          animate={{ y: [0, -18, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}

      <svg viewBox="0 0 200 200" className="relative z-10 w-full h-full overflow-visible">
        <defs>
          <linearGradient id="astroSuit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="55%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          <linearGradient id="astroVisor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a5f3fc" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient floor glow */}
        <ellipse cx="100" cy="168" rx="34" ry="7" fill="#818cf8" opacity="0.22" />

        {/* Character group — idle bob + sway */}
        <motion.g
          animate={{ y: [0, -5, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '100px 110px' }}
        >
          {/* Legs */}
          <rect x="86" y="128" width="10" height="26" rx="5" fill="#312e81" />
          <rect x="104" y="128" width="10" height="26" rx="5" fill="#312e81" />
          {/* Torso */}
          <rect x="80" y="88" width="40" height="48" rx="14" fill="url(#astroSuit)" filter="url(#softGlow)" />
          {/* Chest panel */}
          <rect x="90" y="100" width="20" height="14" rx="3" fill="#22d3ee" opacity="0.95" />
          {/* Scarf */}
          <motion.path
            d="M112 96 Q128 110 122 130"
            stroke="#a78bfa"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            animate={{ d: ['M112 96 Q128 110 122 130', 'M112 96 Q134 112 126 132', 'M112 96 Q128 110 122 130'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Arms */}
          <rect x="68" y="98" width="12" height="28" rx="6" fill="#6366f1" transform="rotate(18 74 112)" />
          <motion.g
            style={{ transformOrigin: '128px 100px' }}
            whileHover={{ rotate: -55 }}
            animate={{ rotate: [8, 14, 8] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="120" y="96" width="12" height="28" rx="6" fill="#6366f1" />
            <circle cx="126" cy="126" r="6" fill="#f5d0a9" />
          </motion.g>
          {/* Head */}
          <circle cx="100" cy="74" r="20" fill="#f5d0a9" />
          <circle cx="100" cy="74" r="22" fill="none" stroke="#1e1b4b" strokeWidth="3" />
          <path d="M84 72 Q100 90 116 72" fill="url(#astroVisor)" opacity="0.88" />
          {/* Holo tablet */}
          <motion.g
            animate={{ y: [0, -3, 0], rotate: [8, 12, 8] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '138px 112px' }}
          >
            <rect x="126" y="98" width="26" height="34" rx="3" fill="#1e1b4b" />
            <rect x="130" y="103" width="18" height="24" rx="2" fill="#67e8f9" opacity="0.9" />
          </motion.g>
        </motion.g>

        {/* Orbiting subject nodes */}
        {ORBIT_ICONS.map((o, i) => (
          <motion.g
            key={i}
            animate={{ rotate: 360 }}
            transition={{ duration: o.dur, repeat: Infinity, ease: 'linear', delay: o.delay }}
            style={{ transformOrigin: '100px 100px' }}
          >
            <circle cx={100 + o.r} cy="100" r={o.size / 2 + 2} fill={o.color} opacity="0.95" filter="url(#softGlow)" />
            <circle cx={100 + o.r} cy="100" r={o.size / 4} fill="#fff" opacity="0.55" />
          </motion.g>
        ))}
      </svg>
    </motion.div>
  );
}
