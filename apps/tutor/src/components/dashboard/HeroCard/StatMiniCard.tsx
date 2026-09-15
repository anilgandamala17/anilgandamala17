import { motion, useReducedMotion } from 'framer-motion';

type StatMiniCardProps = {
  label: string;
  value: string;
  tone: 'sky' | 'amber' | 'rose' | 'teal';
  sparkline?: number[];
  onClick?: () => void;
  delay?: number;
  emptyHint?: string;
};

const TONE: Record<
  StatMiniCardProps['tone'],
  { color: string; grad: string }
> = {
  sky: { color: '#0ea5e9', grad: 'linear-gradient(160deg, #e0f2fe 0%, #ffffff 70%)' },
  amber: { color: '#f59e0b', grad: 'linear-gradient(160deg, #fef3c7 0%, #ffffff 70%)' },
  rose: { color: '#f43f5e', grad: 'linear-gradient(160deg, #ffe4e6 0%, #ffffff 70%)' },
  teal: { color: '#14b8a6', grad: 'linear-gradient(160deg, #ccfbf1 0%, #ffffff 70%)' },
};

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 0.01);
  const min = Math.min(...data, 0);
  const w = 56;
  const h = 16;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 2) - 1;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="mt-1.5 opacity-80" aria-hidden>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

export default function StatMiniCard({
  label,
  value,
  tone,
  sparkline,
  onClick,
  delay = 0,
  emptyHint,
}: StatMiniCardProps) {
  const reduced = useReducedMotion();
  const { color, grad } = TONE[tone];
  const Comp: typeof motion.button | typeof motion.div = onClick ? motion.button : motion.div;
  const isZeroish = value === '0' || value === '0h' || value === '0%' || value === '0d';

  return (
    <Comp
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduced ? 0 : 0.35 + delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={onClick ? { y: -2 } : undefined}
      className={`rounded-[14px] border text-left px-3 py-2.5 w-full ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        background: grad,
        borderColor: `${color}33`,
        boxShadow: `0 6px 16px ${color}14`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: color, boxShadow: `0 0 0 3px ${color}22` }}
        />
        <span
          className="text-base sm:text-lg font-bold tabular-nums tracking-tight"
          style={{ fontFamily: 'var(--dash-font-display)', color: 'var(--dash-text)' }}
        >
          {value}
        </span>
      </div>
      <p className="dash-eyebrow" style={{ color: 'var(--dash-text-3)' }}>
        {label}
      </p>
      {isZeroish && emptyHint ? (
        <p className="mt-1 text-[10px] leading-snug" style={{ color: 'var(--dash-text-3)' }}>
          {emptyHint}
        </p>
      ) : sparkline && sparkline.length > 1 && sparkline.some((v) => v > 0) ? (
        <MiniSpark data={sparkline} color={color} />
      ) : null}
    </Comp>
  );
}
