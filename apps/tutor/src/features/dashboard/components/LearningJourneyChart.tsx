import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, Activity } from 'lucide-react';

export type JourneyPoint = { x: number; y: number; hours: number; label: string };

type RangeKey = '7d' | '30d' | 'all';

type LearningJourneyChartProps = {
  points: JourneyPoint[];
  growthPct: number;
  hasActivity: boolean;
  range?: RangeKey;
  rangeLabel?: string;
  onRangeChange?: (r: RangeKey) => void;
};

function buildPath(points: JourneyPoint[]) {
  if (points.length < 2) return points.length ? `M ${points[0].x} ${points[0].y}` : '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const mx = (p0.x + p1.x) / 2;
    d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

/** Remap journey points (authored for 180h viewBox) into a shorter chart. */
function slimPoints(points: JourneyPoint[], height = 120): JourneyPoint[] {
  return points.map((p) => ({
    ...p,
    y: 12 + ((p.y - 20) / 140) * (height - 24),
  }));
}

export default function LearningJourneyChart({
  points,
  growthPct,
  hasActivity,
  range = '7d',
  rangeLabel = 'last 7 days',
  onRangeChange,
}: LearningJourneyChartProps) {
  const reduced = useReducedMotion();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const chartH = 120;
  const slim = useMemo(() => slimPoints(points, chartH), [points]);
  const chartPath = useMemo(() => buildPath(slim), [slim]);
  const areaPath = useMemo(() => {
    if (!slim.length) return '';
    return `${chartPath} L ${slim[slim.length - 1].x} ${chartH} L ${slim[0].x} ${chartH} Z`;
  }, [chartPath, slim]);

  const ranges: { key: RangeKey; label: string }[] = [
    { key: '7d', label: '7d' },
    { key: '30d', label: '30d' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="dash-card dash-card--analytics flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="dash-section-title flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-lg inline-flex items-center justify-center"
              style={{ background: 'var(--dash-brand-soft)' }}
            >
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--dash-brand)' }} />
            </span>
            Learning activity
          </h2>
          <p className="dash-type-caption mt-0.5">Study hours · {rangeLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {onRangeChange && (
            <div
              className="inline-flex rounded-lg p-0.5 border"
              style={{ background: 'var(--dash-surface-1)', borderColor: 'var(--dash-border)' }}
              role="group"
              aria-label="Chart range"
            >
              {ranges.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => onRangeChange(r.key)}
                  className="px-2.5 h-8 min-h-[32px] rounded-md text-[11px] font-semibold transition-colors"
                  style={{
                    background: range === r.key ? 'var(--dash-grad-brand)' : 'transparent',
                    color: range === r.key ? '#fff' : 'var(--dash-text-3)',
                  }}
                  aria-pressed={range === r.key}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
          {hasActivity ? (
            <span
              className={`dash-badge ${growthPct >= 0 ? 'dash-badge--success' : 'dash-badge--warning'}`}
            >
              {growthPct >= 0 ? '+' : ''}
              {growthPct}% vs last week
            </span>
          ) : null}
        </div>
      </div>

      <div className="h-28 sm:h-32 w-full relative flex-1 min-h-[7rem]">
        {hasActivity ? (
          <>
            <svg
              viewBox={`0 0 700 ${chartH}`}
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
              aria-hidden
            >
              {[0, chartH / 2, chartH].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="700"
                  y2={y}
                  stroke="var(--dash-border)"
                  strokeWidth="1"
                />
              ))}
              <motion.path
                d={areaPath}
                fill="url(#journeyFillSlim)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduced ? 0 : 0.25 }}
              />
              <motion.path
                d={chartPath}
                fill="none"
                stroke="url(#journeyStrokeSlim)"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduced ? 0 : 1, ease: 'easeOut' }}
              />
              {slim.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={hoverIdx === i ? 5 : 3.5}
                  fill="var(--dash-brand)"
                  stroke="var(--dash-surface-0)"
                  strokeWidth="2"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                />
              ))}
              <defs>
                <linearGradient id="journeyStrokeSlim" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <linearGradient id="journeyFillSlim" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            {hoverIdx !== null && slim[hoverIdx] && (
              <div
                className="absolute pointer-events-none px-2 py-1 rounded-md text-[11px] font-semibold shadow-lg z-10"
                style={{
                  left: `${(slim[hoverIdx].x / 700) * 100}%`,
                  top: `${(slim[hoverIdx].y / chartH) * 100}%`,
                  transform: 'translate(-50%, -130%)',
                  background: 'var(--dash-surface-ink)',
                  color: 'var(--dash-text-inv)',
                }}
              >
                {slim[hoverIdx].label}: {slim[hoverIdx].hours}h
              </div>
            )}
          </>
        ) : (
          <div className="dash-empty-state h-full py-4">
            <Activity className="w-5 h-5" style={{ color: 'var(--dash-brand-2)' }} />
            <p className="dash-empty-state__title">No study hours yet</p>
            <p className="dash-empty-state__body">
              Finish your first lesson and this chart will fill with your study time for {rangeLabel}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
