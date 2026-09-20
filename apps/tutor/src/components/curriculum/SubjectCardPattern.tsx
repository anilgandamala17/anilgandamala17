/**
 * Layered subject-aware decorative compositions for curriculum cards.
 * Editorial / Stripe-style artwork — never dense wallpaper, never stock photos.
 */

export type SubjectPatternKind =
  | 'grid'
  | 'molecule'
  | 'waves'
  | 'book'
  | 'globe'
  | 'circuit'
  | 'dna'
  | 'soft';

/** Normalize subject id/name → decorative motif kind (universal, not title-specific). */
export function resolveSubjectPattern(
  subjectId?: string,
  subjectName?: string,
): SubjectPatternKind {
  const key = `${subjectId || ''} ${subjectName || ''}`
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');

  if (/math|algebra|calculus|geometry/.test(key)) return 'grid';
  if (/physics|mechanics|optics/.test(key)) return 'waves';
  if (/chem/.test(key)) return 'molecule';
  if (/bio|life/.test(key)) return 'dna';
  if (/computer|informatic|coding|programming|(^|-)it($|-)/.test(key)) {
    return 'circuit';
  }
  if (
    /social|history|geography|economic|political|civics|commerce|account/.test(
      key,
    )
  ) {
    return 'globe';
  }
  if (/english|hindi|language|sanskrit|french|literature/.test(key)) {
    return 'book';
  }
  if (/science/.test(key)) return 'molecule';
  return 'soft';
}

/** Stable per-topic variation so cards in a row don't look identical. */
function offset(seed: number, a: number, b: number) {
  const t = ((seed * 17) % 7) - 3;
  return a + t * b;
}

function BookComposition({
  color,
  seed,
}: {
  color: string;
  seed: number;
}) {
  const dx = offset(seed, 0, 4);
  return (
    <g>
      {/* ambient wash */}
      <ellipse
        cx={118 + dx}
        cy="62"
        rx="78"
        ry="42"
        fill={color}
        fillOpacity="0.05"
      />
      {/* paper sheet behind book */}
      <rect
        x={36 + dx}
        y="34"
        width="48"
        height="62"
        rx="3"
        fill={color}
        fillOpacity="0.04"
        stroke={color}
        strokeWidth="1"
        opacity="0.35"
        transform={`rotate(-8 ${50 + dx} 65)`}
      />
      {/* paper lines */}
      <g opacity="0.28" stroke={color} strokeWidth="1" strokeLinecap="round">
        <path d={`M${22 + dx} 82h68`} />
        <path d={`M${26 + dx} 92h60`} />
        <path d={`M${30 + dx} 102h52`} />
      </g>
      {/* open book */}
      <g
        fill="none"
        stroke={color}
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`translate(${dx} 0)`}
      >
        <path
          d="M78 26c18 7 36 7 44 0v56c-8 8-26 8-44 0V26z"
          fill={color}
          fillOpacity="0.08"
        />
        <path
          d="M122 26c18 7 36 7 44 0v56c-8 8-26 8-44 0V26z"
          fill={color}
          fillOpacity="0.11"
        />
        <path d="M122 26v56" opacity="0.75" />
        <path d="M88 42h20M88 52h24M88 62h18M88 72h14" opacity="0.42" />
        <path d="M132 42h20M132 52h24M132 62h16M132 72h12" opacity="0.42" />
      </g>
      {/* literary ornaments */}
      <g opacity="0.38" stroke={color} strokeWidth="1.25" fill="none">
        <path d={`M${196 + dx} 32l20 32`} strokeLinecap="round" />
        <path d={`M${194 + dx} 36c7 2 11 9 13 16`} />
        <circle cx={218 + dx} cy="66" r="2.4" fill={color} stroke="none" />
        <path
          d={`M${48 + dx} 28c6-8 16-8 22 0`}
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
      <circle
        cx={52 + dx}
        cy="44"
        r="16"
        fill={color}
        fillOpacity="0.06"
        stroke="none"
      />
    </g>
  );
}

function GridComposition({
  color,
  seed,
}: {
  color: string;
  seed: number;
}) {
  const dx = offset(seed, 0, 5);
  return (
    <g transform={`translate(${dx} 0)`}>
      <ellipse cx="118" cy="60" rx="72" ry="40" fill={color} fillOpacity="0.045" />
      <g opacity="0.16" stroke={color} strokeWidth="1">
        <path d="M40 30h140M40 50h140M40 70h140M40 90h140" />
        <path d="M60 20v90M90 20v90M120 20v90M150 20v90" />
      </g>
      <g
        fill="none"
        stroke={color}
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="118" cy="58" r="30" fill={color} fillOpacity="0.07" />
        <path d="M118 28v60M88 58h60" />
        <path d="M96 36l44 44M140 36L96 80" opacity="0.6" />
        <rect x="100" y="40" width="36" height="36" rx="2" opacity="0.5" />
        <path d="M52 88l18-14 14 10 22-18" opacity="0.45" />
      </g>
      <g fill={color} opacity="0.42" fontFamily="ui-sans-serif, system-ui" fontSize="12">
        <text x="170" y="36" fillOpacity="0.55">
          x²
        </text>
        <text x="182" y="78" fillOpacity="0.38">
          ∑
        </text>
        <text x="48" y="104" fillOpacity="0.32">
          π
        </text>
      </g>
    </g>
  );
}

function WavesComposition({
  color,
  seed,
}: {
  color: string;
  seed: number;
}) {
  const dy = offset(seed, 0, 3);
  return (
    <g transform={`translate(0 ${dy})`}>
      <circle cx="130" cy="58" r="10" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.4" />
      <ellipse
        cx="130"
        cy="58"
        rx="34"
        ry="18"
        fill="none"
        stroke={color}
        strokeWidth="1.3"
        opacity="0.55"
      />
      <ellipse
        cx="130"
        cy="58"
        rx="54"
        ry="28"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.35"
      />
      <path
        d="M28 88c18-16 36-16 54 0s36 16 54 0 36-16 54 0"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M36 72c16-12 32-12 48 0s32 12 48 0"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.35"
      />
      <circle cx="210" cy="36" r="3" fill={color} fillOpacity="0.35" />
      <circle cx="48" cy="40" r="2.4" fill={color} fillOpacity="0.3" />
    </g>
  );
}

function MoleculeComposition({
  color,
  seed,
}: {
  color: string;
  seed: number;
}) {
  const dx = offset(seed, 0, 4);
  const nodes = [
    [90 + dx, 42],
    [130 + dx, 34],
    [156 + dx, 62],
    [118 + dx, 78],
    [78 + dx, 68],
    [170 + dx, 44],
  ] as const;
  return (
    <g>
      <g stroke={color} strokeWidth="1.35" fill="none" opacity="0.7">
        <path d={`M${nodes[0][0]} ${nodes[0][1]}L${nodes[1][0]} ${nodes[1][1]}`} />
        <path d={`M${nodes[1][0]} ${nodes[1][1]}L${nodes[2][0]} ${nodes[2][1]}`} />
        <path d={`M${nodes[2][0]} ${nodes[2][1]}L${nodes[3][0]} ${nodes[3][1]}`} />
        <path d={`M${nodes[3][0]} ${nodes[3][1]}L${nodes[4][0]} ${nodes[4][1]}`} />
        <path d={`M${nodes[4][0]} ${nodes[4][1]}L${nodes[0][0]} ${nodes[0][1]}`} />
        <path d={`M${nodes[1][0]} ${nodes[1][1]}L${nodes[5][0]} ${nodes[5][1]}`} />
        <path d={`M${nodes[5][0]} ${nodes[5][1]}L${nodes[2][0]} ${nodes[2][1]}`} />
      </g>
      {nodes.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === 1 || i === 2 ? 7 : 5.5}
          fill={color}
          fillOpacity={0.12 + (i % 3) * 0.04}
          stroke={color}
          strokeWidth="1.2"
        />
      ))}
      {/* flask hint */}
      <g
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.35"
        transform={`translate(${40 + dx} 28)`}
      >
        <path d="M18 8v14l10 22H8L18 22V8" strokeLinejoin="round" />
        <path d="M12 8h12" />
      </g>
    </g>
  );
}

function DnaComposition({
  color,
  seed,
}: {
  color: string;
  seed: number;
}) {
  const dx = offset(seed, 0, 5);
  return (
    <g transform={`translate(${dx} 0)`}>
      <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
        <path d="M100 18c28 18 28 28 0 46s-28 28 0 46" opacity="0.7" />
        <path d="M148 18c-28 18-28 28 0 46s28 28 0 46" opacity="0.7" />
        <path d="M104 36h40M104 54h40M104 72h40M104 90h40" opacity="0.45" />
      </g>
      <g fill="none" stroke={color} strokeWidth="1.2" opacity="0.35">
        <circle cx="188" cy="48" r="14" />
        <ellipse cx="188" cy="48" rx="6" ry="14" />
        <circle cx="188" cy="48" r="3" fill={color} fillOpacity="0.2" stroke="none" />
      </g>
      <path
        d="M52 86c8-14 18-18 28-8"
        fill="none"
        stroke={color}
        strokeWidth="1.3"
        opacity="0.3"
        strokeLinecap="round"
      />
    </g>
  );
}

function GlobeComposition({
  color,
  seed,
}: {
  color: string;
  seed: number;
}) {
  const dx = offset(seed, 0, 4);
  return (
    <g transform={`translate(${dx} 0)`}>
      <circle
        cx="128"
        cy="60"
        r="36"
        fill={color}
        fillOpacity="0.06"
        stroke={color}
        strokeWidth="1.5"
      />
      <ellipse
        cx="128"
        cy="60"
        rx="14"
        ry="36"
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        opacity="0.55"
      />
      <path
        d="M92 60h72M128 24c12 14 12 46 0 72"
        fill="none"
        stroke={color}
        strokeWidth="1.25"
        opacity="0.5"
      />
      <path
        d="M98 42h60M98 78h60"
        fill="none"
        stroke={color}
        strokeWidth="1.1"
        opacity="0.35"
      />
      {/* map contour */}
      <path
        d="M178 34c10 4 16 12 14 22-8 4-14 2-20-4 2-8 2-14 6-18z"
        fill={color}
        fillOpacity="0.12"
        stroke={color}
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M48 70c8-18 22-22 34-10"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.3"
        strokeLinecap="round"
      />
    </g>
  );
}

function CircuitComposition({
  color,
  seed,
}: {
  color: string;
  seed: number;
}) {
  const dx = offset(seed, 0, 4);
  return (
    <g transform={`translate(${dx} 0)`} stroke={color} fill="none" strokeLinecap="round">
      <rect
        x="108"
        y="42"
        width="36"
        height="36"
        rx="4"
        fill={color}
        fillOpacity="0.1"
        strokeWidth="1.4"
      />
      <path d="M126 22v20M126 78v20M88 60h20M144 60h28" strokeWidth="1.4" />
      <circle cx="126" cy="22" r="3" fill={color} fillOpacity="0.45" stroke="none" />
      <circle cx="126" cy="98" r="3" fill={color} fillOpacity="0.45" stroke="none" />
      <circle cx="88" cy="60" r="3" fill={color} fillOpacity="0.4" stroke="none" />
      <circle cx="172" cy="60" r="3" fill={color} fillOpacity="0.4" stroke="none" />
      <path d="M96 34l12 12M156 34l-12 12M96 86l12-12M156 86l-12-12" strokeWidth="1.2" opacity="0.45" />
      <g fill={color} opacity="0.35" fontFamily="ui-monospace, monospace" fontSize="10">
        <text x="48" y="40">{'{'}</text>
        <text x="188" y="88">{'}'}</text>
        <text x="52" y="88" fillOpacity="0.3">
          01
        </text>
      </g>
    </g>
  );
}

function SoftComposition({
  color,
  seed,
}: {
  color: string;
  seed: number;
}) {
  const dx = offset(seed, 0, 5);
  return (
    <g transform={`translate(${dx} 0)`}>
      <circle cx="120" cy="58" r="32" fill={color} fillOpacity="0.07" stroke={color} strokeWidth="1.3" opacity="0.5" />
      <circle cx="120" cy="58" r="14" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1.2" />
      <circle cx="72" cy="40" r="5" fill={color} fillOpacity="0.25" />
      <circle cx="178" cy="78" r="4" fill={color} fillOpacity="0.2" />
      <path
        d="M48 88c20-10 40-10 60 0s40 10 60 0"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.3"
      />
    </g>
  );
}

function Composition({
  kind,
  color,
  seed,
}: {
  kind: SubjectPatternKind;
  color: string;
  seed: number;
}) {
  switch (kind) {
    case 'book':
      return <BookComposition color={color} seed={seed} />;
    case 'grid':
      return <GridComposition color={color} seed={seed} />;
    case 'waves':
      return <WavesComposition color={color} seed={seed} />;
    case 'molecule':
      return <MoleculeComposition color={color} seed={seed} />;
    case 'dna':
      return <DnaComposition color={color} seed={seed} />;
    case 'globe':
      return <GlobeComposition color={color} seed={seed} />;
    case 'circuit':
      return <CircuitComposition color={color} seed={seed} />;
    default:
      return <SoftComposition color={color} seed={seed} />;
  }
}

export function SubjectCardPattern({
  kind,
  color,
  className = '',
  variant = 'hero',
  seed = 0,
}: {
  kind: SubjectPatternKind;
  color: string;
  className?: string;
  /** hero = topic visual header; module = chapter right-side artwork */
  variant?: 'hero' | 'module' | 'watermark';
  /** variation index so sibling topic cards differ slightly */
  seed?: number;
}) {
  const isModule = variant === 'module' || variant === 'watermark';

  return (
    <svg
      className={`curr-subject-art curr-subject-art--${variant} ${className}`.trim()}
      viewBox={isModule ? '40 10 200 110' : '0 0 240 120'}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <Composition kind={kind} color={color} seed={seed} />
    </svg>
  );
}
