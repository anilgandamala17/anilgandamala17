import type { PatternKind } from '@/lib/learning-courses'

/** Low-opacity decorative SVG fills for course cards. */
export function CoursePattern({
  kind,
  color,
  id,
}: {
  kind: PatternKind
  color: string
  id: string
}) {
  const patternId = `pat-${id}`

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
      aria-hidden
    >
      <defs>
        {kind === 'grid' ? (
          <pattern
            id={patternId}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M24 0H0V24"
              fill="none"
              stroke={color}
              strokeWidth="1"
            />
            <circle cx="0" cy="0" r="1.2" fill={color} />
          </pattern>
        ) : null}

        {kind === 'molecule' ? (
          <pattern
            id={patternId}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="12" cy="12" r="3" fill={color} />
            <circle cx="28" cy="28" r="2.5" fill={color} />
            <circle cx="30" cy="10" r="2" fill={color} />
            <line
              x1="12"
              y1="12"
              x2="28"
              y2="28"
              stroke={color}
              strokeWidth="1"
            />
            <line
              x1="12"
              y1="12"
              x2="30"
              y2="10"
              stroke={color}
              strokeWidth="1"
            />
          </pattern>
        ) : null}

        {kind === 'dna' ? (
          <pattern
            id={patternId}
            width="28"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M6 0 Q14 10 6 20 Q-2 30 6 40"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
            />
            <path
              d="M22 0 Q14 10 22 20 Q30 30 22 40"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
            />
            <line x1="8" y1="8" x2="20" y2="8" stroke={color} strokeWidth="1" />
            <line
              x1="8"
              y1="20"
              x2="20"
              y2="20"
              stroke={color}
              strokeWidth="1"
            />
            <line
              x1="8"
              y1="32"
              x2="20"
              y2="32"
              stroke={color}
              strokeWidth="1"
            />
          </pattern>
        ) : null}

        {kind === 'globe' ? (
          <pattern
            id={patternId}
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="24"
              cy="24"
              r="16"
              fill="none"
              stroke={color}
              strokeWidth="1"
            />
            <ellipse
              cx="24"
              cy="24"
              rx="8"
              ry="16"
              fill="none"
              stroke={color}
              strokeWidth="1"
            />
            <line
              x1="8"
              y1="24"
              x2="40"
              y2="24"
              stroke={color}
              strokeWidth="1"
            />
            <path
              d="M10 16 H38 M10 32 H38"
              fill="none"
              stroke={color}
              strokeWidth="0.8"
            />
          </pattern>
        ) : null}

        {kind === 'book' ? (
          <pattern
            id={patternId}
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M4 6 H16 V26 H4 Z M16 6 H28 V26 H16"
              fill="none"
              stroke={color}
              strokeWidth="1"
            />
            <line
              x1="16"
              y1="6"
              x2="16"
              y2="26"
              stroke={color}
              strokeWidth="1.5"
            />
            <path
              d="M8 12 H13 M8 16 H13 M20 12 H25 M20 16 H25"
              stroke={color}
              strokeWidth="0.8"
            />
          </pattern>
        ) : null}

        {kind === 'atom' ? (
          <pattern
            id={patternId}
            width="44"
            height="44"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="22" cy="22" r="2.5" fill={color} />
            <ellipse
              cx="22"
              cy="22"
              rx="16"
              ry="6"
              fill="none"
              stroke={color}
              strokeWidth="1"
              transform="rotate(30 22 22)"
            />
            <ellipse
              cx="22"
              cy="22"
              rx="16"
              ry="6"
              fill="none"
              stroke={color}
              strokeWidth="1"
              transform="rotate(-30 22 22)"
            />
            <ellipse
              cx="22"
              cy="22"
              rx="16"
              ry="6"
              fill="none"
              stroke={color}
              strokeWidth="1"
              transform="rotate(90 22 22)"
            />
          </pattern>
        ) : null}

        {kind === 'circuit' ? (
          <pattern
            id={patternId}
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M4 18 H14 M22 18 H32 M18 4 V14 M18 22 V32"
              stroke={color}
              strokeWidth="1"
              fill="none"
            />
            <rect
              x="14"
              y="14"
              width="8"
              height="8"
              rx="1"
              fill="none"
              stroke={color}
              strokeWidth="1"
            />
            <circle cx="4" cy="18" r="1.5" fill={color} />
            <circle cx="32" cy="18" r="1.5" fill={color} />
            <circle cx="18" cy="4" r="1.5" fill={color} />
            <circle cx="18" cy="32" r="1.5" fill={color} />
          </pattern>
        ) : null}

        {kind === 'code' ? (
          <pattern
            id={patternId}
            width="40"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M10 6 L4 14 L10 22 M30 6 L36 14 L30 22 M22 4 L18 24"
              fill="none"
              stroke={color}
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </pattern>
        ) : null}

        {kind === 'frames' ? (
          <pattern
            id={patternId}
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="6"
              y="8"
              width="18"
              height="14"
              rx="1"
              fill="none"
              stroke={color}
              strokeWidth="1"
            />
            <rect
              x="12"
              y="14"
              width="18"
              height="14"
              rx="1"
              fill="none"
              stroke={color}
              strokeWidth="1"
            />
          </pattern>
        ) : null}

        {kind === 'bars' ? (
          <pattern
            id={patternId}
            width="32"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <rect x="4" y="14" width="4" height="10" rx="0.5" fill={color} />
            <rect x="12" y="8" width="4" height="16" rx="0.5" fill={color} />
            <rect x="20" y="4" width="4" height="20" rx="0.5" fill={color} />
          </pattern>
        ) : null}

        {kind === 'shield' ? (
          <pattern
            id={patternId}
            width="36"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M18 4 L30 10 V20 C30 28 18 34 18 34 C18 34 6 28 6 20 V10 Z"
              fill="none"
              stroke={color}
              strokeWidth="1.2"
            />
            <path
              d="M13 19 L17 23 L24 14"
              fill="none"
              stroke={color}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </pattern>
        ) : null}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  )
}
