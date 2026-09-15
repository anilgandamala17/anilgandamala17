/** Static illustrated student-astronaut — used when WebGL / motion is unavailable. */
export function StaticStudentFallback({ readiness }: { readiness: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-[85%] h-[85%]" aria-hidden>
        <defs>
          <linearGradient id="suitGradStatic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <radialGradient id="glowGradStatic" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="70" fill="url(#glowGradStatic)" />
        <ellipse cx="100" cy="155" rx="36" ry="8" fill="#6366f1" opacity="0.2" />
        <rect x="78" y="88" width="44" height="52" rx="16" fill="url(#suitGradStatic)" />
        <rect x="88" y="98" width="24" height="16" rx="4" fill="#22d3ee" opacity="0.9" />
        <circle cx="100" cy="72" r="22" fill="#f5d0a9" />
        <path d="M82 70 Q100 88 118 70" fill="#67e8f9" opacity="0.75" />
        <circle cx="100" cy="72" r="24" fill="none" stroke="#312e81" strokeWidth="3" />
        <rect x="118" y="100" width="28" height="36" rx="3" fill="#1e1b4b" transform="rotate(12 132 118)" />
        <rect
          x="122"
          y="105"
          width="20"
          height="26"
          rx="2"
          fill="#67e8f9"
          transform="rotate(12 132 118)"
          opacity="0.85"
        />
        <text x="100" y="182" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="700">
          {readiness}% READY
        </text>
      </svg>
    </div>
  );
}
