/**
 * Lightweight educational SVG compositions for topic card headers.
 * Each VisualKind has multiple named variants that change composition (not just color).
 */
import type { ReactNode } from 'react';
import type { VisualKind, VisualKindProps } from '../types';

function SoftWash({ accent, cx = 120, cy = 58 }: { accent: string; cx?: number; cy?: number }) {
  return (
    <ellipse cx={cx} cy={cy} rx="88" ry="46" fill={accent} fillOpacity="0.07" />
  );
}

function Axes({ accent, opacity = 0.35 }: { accent: string; opacity?: number }) {
  return (
    <g stroke={accent} strokeWidth="1.2" opacity={opacity} fill="none">
      <path d="M36 88H210" strokeLinecap="round" />
      <path d="M52 22V96" strokeLinecap="round" />
    </g>
  );
}

function vi(variant: string): number {
  if (variant === 'b') return 1;
  if (variant === 'c') return 2;
  return 0;
}

function NumberLine({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  const marks = v === 0 ? [60, 90, 120, 150, 180] : v === 1 ? [50, 85, 120, 155, 190] : [70, 100, 130, 160];
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M40 62H208" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
      {marks.map((x, i) => (
        <g key={x}>
          <path d={`M${x} 54v16`} stroke={accent} strokeWidth="1.4" />
          <circle cx={x} cy="62" r={i === Math.min(2, marks.length - 1) ? 4.5 : 3} fill={accent} fillOpacity={0.2} stroke={accent} strokeWidth="1.2" />
        </g>
      ))}
      {v === 2 ? <path d="M70 40h90" stroke={accent} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.45" /> : null}
    </g>
  );
}

function PlaceValue({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  const boxes = v === 0 ? [48, 88, 128, 168] : v === 1 ? [40, 90, 140, 190] : [56, 106, 156];
  return (
    <g>
      <SoftWash accent={accent} cy={64} />
      {boxes.map((x, i) => (
        <g key={x}>
          <rect x={x} y={34 + (i % 2) * 4} width="32" height="42" rx="6" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="1.35" />
          <text x={x + 16} y={60} textAnchor="middle" fill={accent} fontSize="11" fontFamily="ui-sans-serif,system-ui" opacity="0.7">
            {v === 2 ? ['1', '0', '0'][i] : String(10 ** (boxes.length - 1 - i)).slice(0, 2)}
          </text>
        </g>
      ))}
    </g>
  );
}

function Fractions({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <circle cx="90" cy="58" r="28" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="1.4" />
      <path d={v === 0 ? 'M90 30A28 28 0 0 1 118 58L90 58Z' : v === 1 ? 'M90 30A28 28 0 1 1 62 58L90 58Z' : 'M90 30A28 28 0 0 1 90 86L90 58Z'} fill={accent} fillOpacity="0.28" />
      <g stroke={accent} strokeWidth="1.5" fill="none">
        <path d="M150 48h40M150 58h40M150 68h28" opacity="0.5" strokeLinecap="round" />
      </g>
      <text x="170" y="42" fill={accent} fontSize="12" opacity="0.65" fontFamily="ui-sans-serif,system-ui">
        {v === 2 ? '3/4' : v === 1 ? '2/3' : '1/2'}
      </text>
    </g>
  );
}

function AlgebraBalance({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d={`M40 ${58 + v * 2}H200`} stroke={accent} strokeWidth="1.6" />
      <path d="M120 40v40" stroke={accent} strokeWidth="1.4" opacity="0.5" />
      <rect x="52" y={38 - v} width="36" height="24" rx="4" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.2" />
      <rect x="152" y={42 + v} width="36" height="24" rx="4" fill={accent} fillOpacity="0.18" stroke={accent} strokeWidth="1.2" />
      <text x="70" y="54" textAnchor="middle" fill={accent} fontSize="10" opacity="0.7">x</text>
      <text x="170" y="58" textAnchor="middle" fill={accent} fontSize="10" opacity="0.7">{v === 2 ? '6' : '4'}</text>
    </g>
  );
}

function LinearGraph({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  const path = v === 0 ? 'M48 86L190 34' : v === 1 ? 'M48 70L190 50' : 'M48 90L100 40L190 60';
  return (
    <g>
      <SoftWash accent={accent} />
      <Axes accent={accent} />
      <path d={path} stroke={accent} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx={v === 2 ? 100 : 120} cy={v === 2 ? 40 : 56} r="3.5" fill={accent} fillOpacity="0.35" stroke={accent} />
    </g>
  );
}

function QuadraticRoots({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <Axes accent={accent} />
      <path d={v === 0 ? 'M48 40Q120 110 192 40' : v === 1 ? 'M48 88Q120 20 192 88' : 'M40 70Q90 20 140 70Q170 100 200 50'} fill="none" stroke={accent} strokeWidth="1.8" />
      <circle cx="78" cy="88" r="3.5" fill={accent} />
      <circle cx="162" cy="88" r="3.5" fill={accent} />
      {v !== 2 ? <text x="175" y="36" fill={accent} fontSize="10" opacity="0.55">Δ</text> : null}
    </g>
  );
}

function Parabola({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <Axes accent={accent} />
      <path d={v === 0 ? 'M50 30Q120 120 190 30' : v === 1 ? 'M50 95Q120 10 190 95' : 'M40 50Q100 100 160 40'} fill="none" stroke={accent} strokeWidth="1.85" />
      <circle cx="120" cy={v === 1 ? 18 : 95} r="3" fill={accent} fillOpacity="0.4" />
    </g>
  );
}

function TriangleGeo({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  const pts = v === 0 ? '70,88 120,28 180,88' : v === 1 ? '60,80 150,30 190,90' : '80,90 120,32 170,70';
  return (
    <g>
      <SoftWash accent={accent} />
      <polygon points={pts} fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.6" strokeLinejoin="round" />
      {v === 1 ? <path d="M150 30v20h18" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.55" /> : null}
      {v === 2 ? <circle cx="120" cy="64" r="4" fill={accent} fillOpacity="0.25" stroke={accent} /> : null}
    </g>
  );
}

function CircleGeo({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <circle cx="120" cy="58" r="34" fill={accent} fillOpacity="0.07" stroke={accent} strokeWidth="1.5" />
      {v === 0 ? <path d="M120 58L154 58" stroke={accent} strokeWidth="1.4" /> : null}
      {v === 1 ? <path d="M86 58A34 34 0 0 1 154 58" fill="none" stroke={accent} strokeWidth="1.5" /> : null}
      {v === 2 ? (
        <>
          <path d="M90 40L150 76" stroke={accent} strokeWidth="1.3" />
          <circle cx="120" cy="58" r="3" fill={accent} />
        </>
      ) : null}
    </g>
  );
}

function CoordinatePlane({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <Axes accent={accent} />
      <g stroke={accent} strokeWidth="0.8" opacity="0.2">
        <path d="M52 40H200M52 58H200M52 76H200" />
        <path d="M80 22V96M120 22V96M160 22V96" />
      </g>
      <circle cx={80 + v * 28} cy={76 - v * 14} r="4" fill={accent} fillOpacity="0.3" stroke={accent} />
      <circle cx={140 + v * 10} cy={44 + v * 8} r="3.5" fill={accent} fillOpacity="0.2" stroke={accent} />
    </g>
  );
}

function StatisticsBars({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  const heights = v === 0 ? [28, 48, 36, 56] : v === 1 ? [40, 24, 52, 32] : [20, 44, 30, 60, 38];
  return (
    <g>
      <SoftWash accent={accent} />
      <Axes accent={accent} />
      {heights.map((h, i) => (
        <rect key={i} x={64 + i * 32} y={88 - h} width="18" height={h} rx="3" fill={accent} fillOpacity={0.14 + (i % 3) * 0.06} stroke={accent} strokeWidth="1.2" />
      ))}
      {v === 2 ? <path d="M64 50H200" stroke={accent} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.45" /> : null}
    </g>
  );
}

function Probability({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <rect x="70" y="32" width="44" height="44" rx="8" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.4" />
      <circle cx="84" cy="46" r="4" fill={accent} fillOpacity="0.35" />
      <circle cx="100" cy="62" r="4" fill={accent} fillOpacity="0.35" />
      {v > 0 ? <circle cx="84" cy="62" r="4" fill={accent} fillOpacity="0.2" /> : null}
      <circle cx="160" cy="58" r="26" fill={accent} fillOpacity="0.07" stroke={accent} strokeWidth="1.4" />
      <path d={v === 2 ? 'M160 32A26 26 0 0 1 186 58L160 58Z' : 'M160 32A26 26 0 0 1 160 84L160 58Z'} fill={accent} fillOpacity="0.25" />
    </g>
  );
}

function Matrices({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M70 28v60M170 28v60" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M70 28h10M70 88h10M170 28h-10M170 88h-10" stroke={accent} strokeWidth="1.6" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].slice(0, v === 2 ? 2 : 3).map((c) => (
          <circle key={`${r}-${c}`} cx={95 + c * 28} cy={42 + r * 18} r="3" fill={accent} fillOpacity={0.2 + ((r + c) % 3) * 0.08} stroke={accent} strokeWidth="1" />
        )),
      )}
    </g>
  );
}

function Trigonometry({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <circle cx="120" cy="58" r="32" fill="none" stroke={accent} strokeWidth="1.3" opacity="0.45" />
      <path d="M120 58L152 58L120 30Z" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.5" />
      {v >= 1 ? <path d="M120 58L148 78" stroke={accent} strokeWidth="1.3" opacity="0.6" /> : null}
      {v === 2 ? <path d="M88 58A32 32 0 0 1 120 26" fill="none" stroke={accent} strokeWidth="1.4" /> : null}
    </g>
  );
}

function Calculus({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <Axes accent={accent} />
      <path d={v === 0 ? 'M48 80C80 80 90 30 130 40S180 90 200 50' : v === 1 ? 'M48 70C90 20 140 100 200 40' : 'M48 88C100 88 110 30 200 30'} fill="none" stroke={accent} strokeWidth="1.7" />
      <path d={`M${110 + v * 20} ${50 - v * 6}l18 -12`} stroke={accent} strokeWidth="1.4" markerEnd="none" />
      <text x="178" y="34" fill={accent} fontSize="12" opacity="0.5">∫</text>
    </g>
  );
}

function SetsVenn({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <circle cx="100" cy="58" r="30" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.4" />
      <circle cx="140" cy="58" r="30" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.4" />
      {v === 2 ? <circle cx="120" cy="78" r="24" fill={accent} fillOpacity="0.06" stroke={accent} strokeWidth="1.2" /> : null}
      {v >= 1 ? <ellipse cx="120" cy="58" rx="10" ry="16" fill={accent} fillOpacity="0.22" /> : null}
    </g>
  );
}

function Polynomial({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <Axes accent={accent} />
      <path d={v === 0 ? 'M40 70C70 20 100 100 140 40S200 80 210 50' : v === 1 ? 'M40 50C80 90 120 20 160 70S200 40 210 60' : 'M40 80C90 20 130 20 180 80'} fill="none" stroke={accent} strokeWidth="1.7" />
      <text x="168" y="32" fill={accent} fontSize="11" opacity="0.55">{v === 2 ? 'x³' : 'x²'}</text>
    </g>
  );
}

function MotionInertia({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <rect x={70 + v * 20} y="48" width="40" height="28" rx="5" fill={accent} fillOpacity="0.14" stroke={accent} strokeWidth="1.5" />
      {v === 0 ? null : <path d={`M${120 + v * 20} 62h${36 - v * 6}`} stroke={accent} strokeWidth="1.6" strokeLinecap="round" />}
      {v === 2 ? (
        <g stroke={accent} strokeWidth="1.3" opacity="0.5">
          <path d="M170 54l12 8M170 70l12 -8" />
        </g>
      ) : (
        <path d="M50 90H190" stroke={accent} strokeWidth="1.2" opacity="0.35" />
      )}
    </g>
  );
}

function ForceArrows({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <circle cx="120" cy="58" r="16" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="1.5" />
      <path d="M120 58L180 40" stroke={accent} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M168 38l12 2l-6 10" fill="none" stroke={accent} strokeWidth="1.4" />
      {v >= 1 ? <path d="M120 58L70 80" stroke={accent} strokeWidth="1.5" opacity="0.7" /> : null}
      {v === 2 ? <path d="M120 58L120 28" stroke={accent} strokeWidth="1.5" opacity="0.7" /> : null}
    </g>
  );
}

function NewtonSecond({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <rect x="80" y="46" width="36" height="28" rx="4" fill={accent} fillOpacity="0.14" stroke={accent} strokeWidth="1.4" />
      <path d={`M120 60h${40 + v * 12}`} stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
      <path d={`M${152 + v * 12} 52l14 8l-14 8`} fill="none" stroke={accent} strokeWidth="1.4" />
      <text x="56" y="40" fill={accent} fontSize="12" opacity="0.6" fontFamily="ui-sans-serif,system-ui">
        F=ma
      </text>
      {v === 2 ? <path d="M88 88h64" stroke={accent} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.4" /> : null}
    </g>
  );
}

function ActionReaction({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <rect x="58" y="48" width="34" height="26" rx="4" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.4" />
      <rect x="148" y="48" width="34" height="26" rx="4" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.4" />
      <path d="M96 58H144" stroke={accent} strokeWidth="1.5" opacity="0.35" />
      <path d={`M110 ${50 - v}l-16 8l16 8`} fill="none" stroke={accent} strokeWidth="1.5" />
      <path d={`M130 ${50 - v}l16 8l-16 8`} fill="none" stroke={accent} strokeWidth="1.5" />
      {v === 2 ? <text x="112" y="90" fill={accent} fontSize="10" opacity="0.5">−F</text> : null}
    </g>
  );
}

function Energy({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M120 28l10 28h-20z" fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="1.3" />
      <path d={v === 0 ? 'M70 88Q120 40 170 88' : 'M60 70h120'} fill="none" stroke={accent} strokeWidth="1.5" />
      <circle cx={90 + v * 30} cy="70" r="10" fill={accent} fillOpacity="0.15" stroke={accent} />
      {v === 2 ? <path d="M150 40l8 20M158 40l-8 20" stroke={accent} strokeWidth="1.2" opacity="0.5" /> : null}
    </g>
  );
}

function Waves({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  const amp = 12 + v * 4;
  return (
    <g>
      <SoftWash accent={accent} />
      <path d={`M36 60c20 -${amp} 40 -${amp} 60 0s40 ${amp} 60 0 40 -${amp} 60 0`} fill="none" stroke={accent} strokeWidth="1.7" strokeLinecap="round" />
      <path d={`M36 78c20 -${amp - 4} 40 -${amp - 4} 60 0s40 ${amp - 4} 60 0`} fill="none" stroke={accent} strokeWidth="1.2" opacity="0.4" />
      {v === 2 ? <circle cx="200" cy="36" r="4" fill={accent} fillOpacity="0.35" /> : null}
    </g>
  );
}

function OpticsLens({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <ellipse cx="120" cy="58" rx="14" ry="34" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.5" />
      <path d="M40 40L100 58L40 76" fill="none" stroke={accent} strokeWidth="1.3" opacity="0.7" />
      <path d={`M140 58L200 ${40 + v * 10}`} stroke={accent} strokeWidth="1.3" opacity="0.7" />
      <path d={`M140 58L200 ${76 - v * 10}`} stroke={accent} strokeWidth="1.3" opacity="0.7" />
    </g>
  );
}

function Circuit({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M50 58H90M150 58H190" stroke={accent} strokeWidth="1.5" />
      <rect x="90" y="46" width="60" height="24" rx="3" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.4" />
      <circle cx="50" cy="58" r="6" fill={accent} fillOpacity="0.2" stroke={accent} />
      <circle cx="190" cy="58" r="6" fill={accent} fillOpacity="0.2" stroke={accent} />
      {v >= 1 ? <path d="M120 46v-16M112 30h16" stroke={accent} strokeWidth="1.3" /> : null}
      {v === 2 ? <path d="M70 80h100" stroke={accent} strokeWidth="1.2" strokeDasharray="4 3" opacity="0.4" /> : null}
    </g>
  );
}

function HeatTransfer({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <rect x="70" y="40" width="50" height="40" rx="6" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.4" />
      <rect x="130" y="40" width="50" height="40" rx="6" fill={accent} fillOpacity="0.06" stroke={accent} strokeWidth="1.4" />
      <path d={`M122 50h${8 + v * 4}M122 60h${8 + v * 4}M122 70h${8 + v * 4}`} stroke={accent} strokeWidth="1.4" strokeLinecap="round" />
      {v === 2 ? <path d="M95 36c0-10 8-14 8-14" stroke={accent} strokeWidth="1.2" opacity="0.5" fill="none" /> : null}
    </g>
  );
}

function Gravitation({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <circle cx="120" cy="58" r={22 + v * 4} fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.5" />
      <circle cx="120" cy="58" r="8" fill={accent} fillOpacity="0.25" stroke={accent} />
      <ellipse cx="120" cy="58" rx={50 + v * 8} ry={20 + v * 2} fill="none" stroke={accent} strokeWidth="1.2" opacity="0.45" />
      <circle cx={170 + v * 6} cy="58" r="4" fill={accent} fillOpacity="0.4" />
    </g>
  );
}

function Projectile({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M40 88H200" stroke={accent} strokeWidth="1.2" opacity="0.35" />
      <path d={v === 0 ? 'M50 88Q120 20 200 88' : v === 1 ? 'M50 88Q100 30 160 70' : 'M50 88Q140 10 190 60'} fill="none" stroke={accent} strokeWidth="1.7" />
      <circle cx={120 + v * 20} cy={40 - v * 4} r="4" fill={accent} fillOpacity="0.35" stroke={accent} />
    </g>
  );
}

function Magnetism({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <rect x="80" y="40" width="28" height="40" rx="4" fill={accent} fillOpacity="0.18" stroke={accent} strokeWidth="1.4" />
      <rect x="132" y="40" width="28" height="40" rx="4" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.4" />
      <path d={`M108 48C${118 + v * 4} 30 ${122 + v * 4} 30 132 48`} fill="none" stroke={accent} strokeWidth="1.3" />
      <path d={`M108 72C${118 + v * 4} 90 ${122 + v * 4} 90 132 72`} fill="none" stroke={accent} strokeWidth="1.3" />
      <text x="88" y="64" fill={accent} fontSize="10" opacity="0.6">N</text>
      <text x="140" y="64" fill={accent} fontSize="10" opacity="0.6">S</text>
    </g>
  );
}

function BohrAtom({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <circle cx="120" cy="58" r="8" fill={accent} fillOpacity="0.3" stroke={accent} />
      <ellipse cx="120" cy="58" rx="28" ry="16" fill="none" stroke={accent} strokeWidth="1.3" opacity="0.55" />
      <ellipse cx="120" cy="58" rx="46" ry="26" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.35" />
      {v >= 1 ? <ellipse cx="120" cy="58" rx="58" ry="34" fill="none" stroke={accent} strokeWidth="1" opacity="0.25" /> : null}
      <circle cx={148 + v * 6} cy="50" r="3.5" fill={accent} />
      {v === 2 ? <circle cx="86" cy="70" r="3" fill={accent} fillOpacity="0.7" /> : null}
    </g>
  );
}

function MoleculeBond({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  const nodes = v === 0 ? [[90, 50], [130, 40], [150, 70], [110, 78]] : v === 1 ? [[80, 58], [120, 40], [160, 58], [120, 78]] : [[100, 40], [140, 40], [140, 76], [100, 76], [120, 58]];
  return (
    <g>
      <SoftWash accent={accent} />
      <g stroke={accent} strokeWidth="1.4" opacity="0.7">
        {nodes.slice(0, -1).map((n, i) => (
          <path key={i} d={`M${n[0]} ${n[1]}L${nodes[i + 1][0]} ${nodes[i + 1][1]}`} />
        ))}
        {v === 2 ? <path d={`M${nodes[0][0]} ${nodes[0][1]}L${nodes[3][0]} ${nodes[3][1]}`} /> : null}
      </g>
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 7 : 5.5} fill={accent} fillOpacity="0.14" stroke={accent} strokeWidth="1.2" />
      ))}
    </g>
  );
}

function ReactionArrow({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <circle cx="70" cy="58" r="14" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.4" />
      <circle cx="100" cy="58" r="14" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.4" />
      <path d="M120 58H170" stroke={accent} strokeWidth="1.7" />
      <path d="M158 50l14 8l-14 8" fill="none" stroke={accent} strokeWidth="1.5" />
      <circle cx="196" cy="58" r="14" fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="1.4" />
      {v >= 1 ? <path d="M120 48H170" stroke={accent} strokeWidth="1.2" opacity="0.4" /> : null}
      {v === 2 ? <text x="138" y="40" fill={accent} fontSize="10" opacity="0.5">Δ</text> : null}
    </g>
  );
}

function PeriodicHint({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3, 4].slice(0, 5 - (r === 0 ? v : 0)).map((c) => (
          <rect key={`${r}-${c}`} x={60 + c * 26} y={28 + r * 20} width="20" height="16" rx="3" fill={accent} fillOpacity={r === 1 && c === 2 ? 0.28 : 0.08} stroke={accent} strokeWidth="1" />
        )),
      )}
    </g>
  );
}

function SolutionBeaker({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M90 30h60v10l10 50h-80l10-50z" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="1.5" strokeLinejoin="round" />
      <path d={`M98 ${70 - v * 8}h52`} stroke={accent} strokeWidth="1.3" opacity="0.5" />
      <circle cx="115" cy={78 - v * 4} r="3" fill={accent} fillOpacity="0.35" />
      <circle cx="130" cy={82 - v * 3} r="2.5" fill={accent} fillOpacity="0.25" />
    </g>
  );
}

function OrganicChain({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d={v === 0 ? 'M50 70L90 40L130 70L170 40L200 60' : v === 1 ? 'M50 50L90 50L130 80L170 50L200 50' : 'M60 60L100 40L140 60L180 40'} fill="none" stroke={accent} strokeWidth="1.6" strokeLinejoin="round" />
      {[70, 110, 150].map((x, i) => (
        <circle key={x} cx={x + v * 4} cy={i % 2 === 0 ? 55 : 65} r="5" fill={accent} fillOpacity="0.15" stroke={accent} />
      ))}
    </g>
  );
}

function CellCutaway({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <ellipse cx="120" cy="58" rx="50" ry="36" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="1.5" />
      <circle cx="120" cy="58" r="14" fill={accent} fillOpacity="0.18" stroke={accent} strokeWidth="1.3" />
      <circle cx="95" cy="48" r="6" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1" />
      <circle cx="150" cy="66" r="7" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1" />
      {v >= 1 ? <ellipse cx="140" cy="44" rx="8" ry="5" fill={accent} fillOpacity="0.1" stroke={accent} /> : null}
      {v === 2 ? <path d="M80 70c10-4 20-4 30 0" fill="none" stroke={accent} strokeWidth="1.1" opacity="0.5" /> : null}
    </g>
  );
}

function Photosynthesis({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M120 90V55" stroke={accent} strokeWidth="1.5" />
      <ellipse cx="105" cy="48" rx="22" ry="12" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="1.3" transform="rotate(-30 105 48)" />
      <ellipse cx="138" cy="46" rx="22" ry="12" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="1.3" transform="rotate(25 138 46)" />
      {v >= 1 ? <path d="M160 30l8 14M168 30l-8 14" stroke={accent} strokeWidth="1.2" opacity="0.5" /> : null}
      {v === 2 ? <circle cx="70" cy="40" r="8" fill={accent} fillOpacity="0.12" stroke={accent} /> : null}
    </g>
  );
}

function DigestivePath({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <circle cx="120" cy="32" r="12" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.3" />
      <path d={`M120 44c0 16 ${10 + v * 4} 20 ${10 + v * 4} 36s-20 18-20 18`} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="118" cy="88" rx="18" ry="10" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.2" />
    </g>
  );
}

function Circulation({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M120 40c16 8 24 22 0 40c-24-18-16-32 0-40z" fill={accent} fillOpacity="0.18" stroke={accent} strokeWidth="1.5" />
      <path d={`M90 50C70 ${40 + v * 6} 60 70 90 78`} fill="none" stroke={accent} strokeWidth="1.4" />
      <path d={`M150 50C170 ${40 + v * 6} 180 70 150 78`} fill="none" stroke={accent} strokeWidth="1.4" />
    </g>
  );
}

function DNAHelix({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d={`M90 28c${20 + v * 4} 12 ${20 + v * 4} 24 0 36s-${20 + v * 4} 24 0 36`} fill="none" stroke={accent} strokeWidth="1.5" />
      <path d={`M150 28c-${20 + v * 4} 12 -${20 + v * 4} 24 0 36s${20 + v * 4} 24 0 36`} fill="none" stroke={accent} strokeWidth="1.5" />
      {[40, 58, 76, 94].map((y) => (
        <path key={y} d={`M95 ${y}H145`} stroke={accent} strokeWidth="1.1" opacity="0.45" />
      ))}
    </g>
  );
}

function EcologyWeb({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  const pts = [[120, 30], [70, 70], [170, 70], [100, 95], [150, 95]];
  return (
    <g>
      <SoftWash accent={accent} />
      <g stroke={accent} strokeWidth="1.2" opacity="0.55">
        <path d="M120 30L70 70L100 95L150 95L170 70Z" fill="none" />
        {v >= 1 ? <path d="M120 30L100 95M120 30L150 95" /> : null}
      </g>
      {pts.slice(0, 4 + v).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill={accent} fillOpacity="0.16" stroke={accent} />
      ))}
    </g>
  );
}

function PlantStructure({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M120 95V45" stroke={accent} strokeWidth="1.6" />
      <path d="M120 60C95 50 90 35 100 28" fill="none" stroke={accent} strokeWidth="1.3" />
      <path d="M120 55C145 48 155 35 145 28" fill="none" stroke={accent} strokeWidth="1.3" />
      <circle cx="120" cy="36" r="8" fill={accent} fillOpacity="0.15" stroke={accent} />
      {v >= 1 ? <path d="M110 95c-10 0-18 8-18 8M130 95c10 0 18 8 18 8" stroke={accent} strokeWidth="1.2" opacity="0.5" /> : null}
      {v === 2 ? <ellipse cx="100" cy="48" rx="10" ry="5" fill={accent} fillOpacity="0.12" stroke={accent} /> : null}
    </g>
  );
}

function Respiration({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M100 40c-10 20-10 40 0 50M140 40c10 20 10 40 0 50" fill="none" stroke={accent} strokeWidth="1.5" />
      <path d="M100 40c8-12 32-12 40 0" fill="none" stroke={accent} strokeWidth="1.4" />
      <ellipse cx="120" cy="78" rx="22" ry="12" fill={accent} fillOpacity="0.1" stroke={accent} />
      {v >= 1 ? <path d="M80 50c-8-4-12-12-8-18" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.5" /> : null}
      {v === 2 ? <path d="M160 50c8-4 12-12 8-18" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.5" /> : null}
    </g>
  );
}

function ProsePages({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M78 28c16 6 32 6 42 0v52c-10 7-26 7-42 0V28z" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="1.4" />
      <path d="M120 28c16 6 32 6 42 0v52c-10 7-26 7-42 0V28z" fill={accent} fillOpacity="0.11" stroke={accent} strokeWidth="1.4" />
      <path d="M88 44h20M88 54h24M88 64h16M132 44h20M132 54h22" stroke={accent} strokeWidth="1.1" opacity="0.45" strokeLinecap="round" />
      {v >= 1 ? <path d={`M${190 + v * 2} 36l12 22`} stroke={accent} strokeWidth="1.2" opacity="0.4" /> : null}
    </g>
  );
}

function CharacterPortrait({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <circle cx="120" cy="44" r="18" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.4" />
      <path d="M90 92c8-22 52-22 60 0" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.4" />
      {v >= 1 ? <rect x="168" y="36" width="28" height="36" rx="4" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="1.2" /> : null}
      {v === 2 ? <path d="M174 46h16M174 54h12" stroke={accent} strokeWidth="1" opacity="0.45" /> : null}
    </g>
  );
}

function LetterDoc({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <rect x="70" y="28" width="100" height="68" rx="6" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="1.5" />
      <path d="M86 44h68M86 56h60M86 68h48" stroke={accent} strokeWidth="1.15" opacity="0.45" strokeLinecap="round" />
      {v >= 1 ? <path d="M70 28l50 28l50-28" fill="none" stroke={accent} strokeWidth="1.3" opacity="0.55" /> : null}
      {v === 2 ? <circle cx="150" cy="80" r="6" fill={accent} fillOpacity="0.15" stroke={accent} /> : null}
    </g>
  );
}

function GrammarTimeline({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M40 60H200" stroke={accent} strokeWidth="1.6" />
      {[60, 100, 140, 180].slice(0, 3 + v).map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="60" r="5" fill={accent} fillOpacity="0.2" stroke={accent} />
          <text x={x} y="42" textAnchor="middle" fill={accent} fontSize="9" opacity="0.55">
            {['Past', 'Now', 'Fut', 'Asp'][i]}
          </text>
        </g>
      ))}
    </g>
  );
}

function PoetryStanza({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M80 30c20 8 40 8 60 0" fill="none" stroke={accent} strokeWidth="1.3" opacity="0.5" />
      {[44, 56, 68, 80].slice(0, 3 + (v > 0 ? 1 : 0)).map((y, i) => (
        <path key={y} d={`M70 ${y}h${90 - i * 10 - v * 4}`} stroke={accent} strokeWidth="1.2" opacity="0.45" strokeLinecap="round" />
      ))}
      {v === 2 ? <text x="170" y="50" fill={accent} fontSize="16" opacity="0.4">”</text> : null}
    </g>
  );
}

function ComprehensionMarks({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <rect x="60" y="30" width="90" height="60" rx="6" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="1.4" />
      <path d="M74 46h62M74 58h50M74 70h40" stroke={accent} strokeWidth="1.1" opacity="0.4" />
      <circle cx="175" cy="50" r="16" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.4" />
      <text x="175" y="55" textAnchor="middle" fill={accent} fontSize="14" opacity="0.65">?</text>
      {v >= 1 ? <path d="M160 78l12 8l16-18" fill="none" stroke={accent} strokeWidth="1.4" opacity="0.55" /> : null}
    </g>
  );
}

function Vocabulary({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <rect x="70" y="36" width="50" height="48" rx="5" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.4" />
      <rect x="128" y="36" width="50" height="48" rx="5" fill={accent} fillOpacity="0.14" stroke={accent} strokeWidth="1.4" />
      <path d="M120 60H128" stroke={accent} strokeWidth="1.4" />
      <text x="95" y="64" textAnchor="middle" fill={accent} fontSize="10" opacity="0.6">A</text>
      <text x="153" y="64" textAnchor="middle" fill={accent} fontSize="10" opacity="0.6">{v === 2 ? 'अ' : 'B'}</text>
    </g>
  );
}

function DramaMasks({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <ellipse cx="95" cy="58" rx="28" ry="32" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.4" />
      <ellipse cx="150" cy="58" rx="28" ry="32" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.4" />
      <path d="M84 52h8M98 52h8" stroke={accent} strokeWidth="1.3" />
      <path d="M86 70q9 8 18 0" fill="none" stroke={accent} strokeWidth="1.3" />
      <path d="M139 52h8M153 52h8" stroke={accent} strokeWidth="1.3" />
      <path d={v === 2 ? 'M141 72q9 -8 18 0' : 'M141 70q9 6 18 0'} fill="none" stroke={accent} strokeWidth="1.3" />
    </g>
  );
}

function Timeline({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M36 64H210" stroke={accent} strokeWidth="1.6" />
      {[55, 95, 135, 175].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 64v${i % 2 === 0 ? -18 : 18}`} stroke={accent} strokeWidth="1.3" />
          <rect x={x - 10} y={i % 2 === 0 ? 30 : 72} width="20" height="12" rx="3" fill={accent} fillOpacity={0.12 + (i === v ? 0.15 : 0)} stroke={accent} strokeWidth="1" />
        </g>
      ))}
    </g>
  );
}

function MapContour({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d={v === 0 ? 'M60 40c30-10 50 10 70 5s40-20 70 5c10 30-10 50-40 55s-60 5-80-15-20-40-20-50z' : v === 1 ? 'M70 50c40-30 90-20 110 10s-10 50-50 55-70-10-70-35 10-30 10-30z' : 'M55 60c25-35 80-40 110-10s20 50-20 55-90 0-100-20 10-25 10-25z'} fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.5" />
      <circle cx={120 + v * 12} cy="58" r="4" fill={accent} fillOpacity="0.35" />
    </g>
  );
}

function DemocracyPillars({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  const cols = v === 2 ? [70, 110, 150, 190] : [80, 120, 160];
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M55 36H200" stroke={accent} strokeWidth="1.5" />
      {cols.map((x) => (
        <rect key={x} x={x - 8} y="40" width="16" height="48" rx="2" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.2" />
      ))}
      <path d="M50 90H205" stroke={accent} strokeWidth="1.5" />
    </g>
  );
}

function MarketSupply({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <Axes accent={accent} />
      <path d="M55 80L190 35" stroke={accent} strokeWidth="1.6" />
      <path d="M55 35L190 80" stroke={accent} strokeWidth="1.6" opacity="0.7" />
      <circle cx={120 + v * 10} cy="58" r="4.5" fill={accent} fillOpacity="0.3" stroke={accent} />
    </g>
  );
}

function Archaeology({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <path d="M70 88H190L170 50H90Z" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="110" y="58" width="20" height="30" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="1.2" />
      {v >= 1 ? <circle cx="160" cy="70" r="8" fill={accent} fillOpacity="0.12" stroke={accent} /> : null}
      {v === 2 ? <path d="M80 40l10 12M90 38l-4 14" stroke={accent} strokeWidth="1.2" opacity="0.45" /> : null}
    </g>
  );
}

function GlobeLayers({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <circle cx="120" cy="58" r="34" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="1.5" />
      <ellipse cx="120" cy="58" rx="14" ry="34" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.5" />
      <path d="M86 58H154" stroke={accent} strokeWidth="1.2" opacity="0.5" />
      {v >= 1 ? <path d="M92 40H148M92 76H148" stroke={accent} strokeWidth="1" opacity="0.35" /> : null}
      {v === 2 ? <path d="M70 50c20-25 80-25 100 0" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.4" /> : null}
    </g>
  );
}

function Climate({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <circle cx="90" cy="44" r="16" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="1.4" />
      <path d="M120 50c10-12 30-12 40 0s10 28-10 32h-40c-16 0-20-14-10-22z" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.3" />
      {v >= 1 ? <path d="M70 88c8-6 16-6 24 0s16 6 24 0" fill="none" stroke={accent} strokeWidth="1.3" opacity="0.5" /> : null}
      {v === 2 ? <path d="M170 78l6 12M178 78l-6 12" stroke={accent} strokeWidth="1.2" opacity="0.45" /> : null}
    </g>
  );
}

function Flowchart({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <rect x="95" y="22" width="50" height="22" rx="4" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.3" />
      <path d="M120 44v12" stroke={accent} strokeWidth="1.3" />
      <path d="M120 56l30 16H90Z" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.3" />
      <path d="M120 72v10" stroke={accent} strokeWidth="1.3" />
      <rect x={v === 2 ? 70 : 95} y="82" width="50" height="20" rx="4" fill={accent} fillOpacity="0.14" stroke={accent} strokeWidth="1.3" />
      {v >= 1 ? <rect x="155" y="82" width="40" height="20" rx="4" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="1.2" /> : null}
    </g>
  );
}

function ArrayBlocks({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  const n = 4 + v;
  return (
    <g>
      <SoftWash accent={accent} />
      {Array.from({ length: n }).map((_, i) => (
        <rect key={i} x={50 + i * 36} y="40" width="30" height="40" rx="5" fill={accent} fillOpacity={0.1 + (i === v ? 0.14 : 0)} stroke={accent} strokeWidth="1.3" />
      ))}
      <path d={`M${65 + v * 36} 88v-6`} stroke={accent} strokeWidth="1.4" />
    </g>
  );
}

function StackDs({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      {[0, 1, 2, 3].slice(0, 3 + (v > 0 ? 1 : 0)).map((i) => (
        <rect key={i} x="90" y={70 - i * 16} width="60" height="14" rx="3" fill={accent} fillOpacity={0.1 + i * 0.04} stroke={accent} strokeWidth="1.2" />
      ))}
      {v === 2 ? <path d="M160 40h24M172 32v16" stroke={accent} strokeWidth="1.3" opacity="0.5" /> : null}
    </g>
  );
}

function TreeNodes({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <circle cx="120" cy="32" r="10" fill={accent} fillOpacity="0.16" stroke={accent} />
      <path d="M120 42L80 70M120 42L160 70" stroke={accent} strokeWidth="1.3" />
      <circle cx="80" cy="78" r="9" fill={accent} fillOpacity="0.12" stroke={accent} />
      <circle cx="160" cy="78" r="9" fill={accent} fillOpacity="0.12" stroke={accent} />
      {v >= 1 ? <path d="M80 87L60 105M80 87L100 105" stroke={accent} strokeWidth="1.1" opacity="0.6" /> : null}
      {v === 2 ? <circle cx="60" cy="110" r="6" fill={accent} fillOpacity="0.1" stroke={accent} /> : null}
    </g>
  );
}

function Network({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  const nodes = [[70, 40], [120, 30], [170, 45], [90, 80], [150, 85]];
  return (
    <g>
      <SoftWash accent={accent} />
      <g stroke={accent} strokeWidth="1.2" opacity="0.55">
        <path d="M70 40L120 30L170 45L150 85L90 80Z" fill="none" />
        {v >= 1 ? <path d="M120 30L90 80M120 30L150 85" /> : null}
      </g>
      {nodes.slice(0, 4 + Math.min(v, 1)).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="6" fill={accent} fillOpacity="0.15" stroke={accent} />
      ))}
    </g>
  );
}

function CodeBrackets({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <text x="70" y="55" fill={accent} fontSize="28" opacity="0.45" fontFamily="ui-monospace,monospace">{'{'}</text>
      <path d={`M100 ${40 + v * 4}h70M100 58h50M100 ${76 - v * 2}h60`} stroke={accent} strokeWidth="1.3" opacity="0.5" strokeLinecap="round" />
      <text x="180" y="78" fill={accent} fontSize="28" opacity="0.45" fontFamily="ui-monospace,monospace">{'}'}</text>
    </g>
  );
}

function FoodSources({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <ellipse cx="90" cy="70" rx="28" ry="14" fill={accent} fillOpacity="0.12" stroke={accent} />
      <path d="M90 70V40" stroke={accent} strokeWidth="1.4" />
      <ellipse cx="90" cy="38" rx="14" ry="10" fill={accent} fillOpacity="0.16" stroke={accent} />
      <circle cx="150" cy="58" r="18" fill={accent} fillOpacity="0.1" stroke={accent} />
      {v >= 1 ? <path d="M150 48c6 0 10 6 10 10" fill="none" stroke={accent} strokeWidth="1.2" /> : null}
      {v === 2 ? <rect x="175" y="70" width="22" height="16" rx="3" fill={accent} fillOpacity="0.12" stroke={accent} /> : null}
    </g>
  );
}

function Materials({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <rect x="60" y="40" width="40" height="40" rx="6" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.4" />
      <circle cx="140" cy="60" r="22" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.4" />
      <path d="M175 40l20 40H155Z" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.4" />
      {v === 2 ? <path d="M80 90h100" stroke={accent} strokeWidth="1.2" opacity="0.35" /> : null}
    </g>
  );
}

function Microbes({ accent, variant }: VisualKindProps) {
  const v = vi(variant);
  return (
    <g>
      <SoftWash accent={accent} />
      <ellipse cx="100" cy="58" rx="24" ry="16" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.4" />
      <circle cx="150" cy="48" r="14" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.4" />
      <circle cx="160" cy="78" r="10" fill={accent} fillOpacity="0.1" stroke={accent} />
      {v >= 1 ? <path d="M124 58h10M164 48l8-6" stroke={accent} strokeWidth="1.2" opacity="0.5" /> : null}
      {v === 2 ? <circle cx="70" cy="78" r="8" fill={accent} fillOpacity="0.1" stroke={accent} /> : null}
    </g>
  );
}

function NeutralMath({ accent, variant }: VisualKindProps) {
  return <CoordinatePlane accent={accent} variant={variant} />;
}
function NeutralScience({ accent, variant }: VisualKindProps) {
  return <MoleculeBond accent={accent} variant={variant} />;
}
function NeutralPhysics({ accent, variant }: VisualKindProps) {
  return <Waves accent={accent} variant={variant} />;
}
function NeutralChemistry({ accent, variant }: VisualKindProps) {
  return <BohrAtom accent={accent} variant={variant} />;
}
function NeutralBiology({ accent, variant }: VisualKindProps) {
  return <CellCutaway accent={accent} variant={variant} />;
}
function NeutralLanguage({ accent, variant }: VisualKindProps) {
  return <ProsePages accent={accent} variant={variant} />;
}
function NeutralSocial({ accent, variant }: VisualKindProps) {
  return <MapContour accent={accent} variant={variant} />;
}
function NeutralCs({ accent, variant }: VisualKindProps) {
  return <CodeBrackets accent={accent} variant={variant} />;
}

const RENDERERS: Record<VisualKind, (p: VisualKindProps) => ReactNode> = {
  'number-line': (p) => <NumberLine {...p} />,
  'place-value': (p) => <PlaceValue {...p} />,
  fractions: (p) => <Fractions {...p} />,
  'algebra-balance': (p) => <AlgebraBalance {...p} />,
  'linear-graph': (p) => <LinearGraph {...p} />,
  'quadratic-roots': (p) => <QuadraticRoots {...p} />,
  parabola: (p) => <Parabola {...p} />,
  triangle: (p) => <TriangleGeo {...p} />,
  'circle-geo': (p) => <CircleGeo {...p} />,
  'coordinate-plane': (p) => <CoordinatePlane {...p} />,
  'statistics-bars': (p) => <StatisticsBars {...p} />,
  probability: (p) => <Probability {...p} />,
  matrices: (p) => <Matrices {...p} />,
  trigonometry: (p) => <Trigonometry {...p} />,
  calculus: (p) => <Calculus {...p} />,
  'sets-venn': (p) => <SetsVenn {...p} />,
  polynomial: (p) => <Polynomial {...p} />,
  'motion-inertia': (p) => <MotionInertia {...p} />,
  'force-arrows': (p) => <ForceArrows {...p} />,
  'newton-second': (p) => <NewtonSecond {...p} />,
  'action-reaction': (p) => <ActionReaction {...p} />,
  energy: (p) => <Energy {...p} />,
  waves: (p) => <Waves {...p} />,
  'optics-lens': (p) => <OpticsLens {...p} />,
  circuit: (p) => <Circuit {...p} />,
  'heat-transfer': (p) => <HeatTransfer {...p} />,
  gravitation: (p) => <Gravitation {...p} />,
  projectile: (p) => <Projectile {...p} />,
  magnetism: (p) => <Magnetism {...p} />,
  'bohr-atom': (p) => <BohrAtom {...p} />,
  'molecule-bond': (p) => <MoleculeBond {...p} />,
  'reaction-arrow': (p) => <ReactionArrow {...p} />,
  'periodic-hint': (p) => <PeriodicHint {...p} />,
  'solution-beaker': (p) => <SolutionBeaker {...p} />,
  'organic-chain': (p) => <OrganicChain {...p} />,
  'cell-cutaway': (p) => <CellCutaway {...p} />,
  photosynthesis: (p) => <Photosynthesis {...p} />,
  'digestive-path': (p) => <DigestivePath {...p} />,
  circulation: (p) => <Circulation {...p} />,
  'dna-helix': (p) => <DNAHelix {...p} />,
  'ecology-web': (p) => <EcologyWeb {...p} />,
  'plant-structure': (p) => <PlantStructure {...p} />,
  respiration: (p) => <Respiration {...p} />,
  'prose-pages': (p) => <ProsePages {...p} />,
  'character-portrait': (p) => <CharacterPortrait {...p} />,
  'letter-doc': (p) => <LetterDoc {...p} />,
  'grammar-timeline': (p) => <GrammarTimeline {...p} />,
  'poetry-stanza': (p) => <PoetryStanza {...p} />,
  'comprehension-marks': (p) => <ComprehensionMarks {...p} />,
  vocabulary: (p) => <Vocabulary {...p} />,
  'drama-masks': (p) => <DramaMasks {...p} />,
  timeline: (p) => <Timeline {...p} />,
  'map-contour': (p) => <MapContour {...p} />,
  'democracy-pillars': (p) => <DemocracyPillars {...p} />,
  'market-supply': (p) => <MarketSupply {...p} />,
  archaeology: (p) => <Archaeology {...p} />,
  'globe-layers': (p) => <GlobeLayers {...p} />,
  climate: (p) => <Climate {...p} />,
  flowchart: (p) => <Flowchart {...p} />,
  'array-blocks': (p) => <ArrayBlocks {...p} />,
  'stack-ds': (p) => <StackDs {...p} />,
  'tree-nodes': (p) => <TreeNodes {...p} />,
  network: (p) => <Network {...p} />,
  'code-brackets': (p) => <CodeBrackets {...p} />,
  'food-sources': (p) => <FoodSources {...p} />,
  materials: (p) => <Materials {...p} />,
  microbes: (p) => <Microbes {...p} />,
  'neutral-math': (p) => <NeutralMath {...p} />,
  'neutral-science': (p) => <NeutralScience {...p} />,
  'neutral-physics': (p) => <NeutralPhysics {...p} />,
  'neutral-chemistry': (p) => <NeutralChemistry {...p} />,
  'neutral-biology': (p) => <NeutralBiology {...p} />,
  'neutral-language': (p) => <NeutralLanguage {...p} />,
  'neutral-social': (p) => <NeutralSocial {...p} />,
  'neutral-cs': (p) => <NeutralCs {...p} />,
};

export function renderVisualKind(kind: VisualKind, props: VisualKindProps): ReactNode {
  const render = RENDERERS[kind] ?? RENDERERS['neutral-math'];
  return render(props);
}
