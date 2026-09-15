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
  const chartPath = useMemo(() => buildPath(points), [points]);
  const areaPath = useMemo(() => {
    if (!points.length) return '';
    return `${chartPath} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;
  }, [chartPath, points]);

  const ranges: { key: RangeKey; label: string }[] = [
    { key: '7d', label: '7d' },
    { key: '30d', label: '30d' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="dash-card flex flex-col" style={{ background: 'var(--dash-grad-chart)' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="dash-section-title flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-lg inline-flex items-center justify-center"
              style={{ background: 'var(--dash-brand-soft)' }}
            >
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--dash-brand)' }} />
            </span>
            Learning journey
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--dash-text-3)' }}>
            Study hours · {rangeLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {onRangeChange && (
            <div
              className="inline-flex rounded-xl p-0.5 border"
              style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'var(--dash-border)' }}
            >
              {ranges.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => onRangeChange(r.key)}
                  className="px-2.5 h-7 rounded-lg text-[11px] font-semibold transition-colors"
                  style={{
                    background: range === r.key ? 'var(--dash-grad-brand)' : 'transparent',
                    color: range === r.key ? '#fff' : 'var(--dash-text-3)',
                    boxShadow: range === r.key ? '0 4px 12px rgba(79,70,229,0.25)' : undefined,
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
          {hasActivity ? (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: growthPct >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                color: growthPct >= 0 ? '#059669' : '#e11d48',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: growthPct >= 0 ? '#10b981' : '#f43f5e' }}
              />
              {growthPct >= 0 ? '+' : ''}
              {growthPct}% vs last week
            </span>
          ) : null}
        </div>
      </div>

      <div className="h-40 sm:h-48 w-full relative flex-1 min-h-[10rem]">
        {hasActivity ? (
          <>
            <svg viewBox="0 0 700 180" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {[0, 60, 120, 180].map((y) => (
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
                fill="url(#journeyFillEnterprise)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduced ? 0 : 0.35 }}
              />
              <motion.path
                d={chartPath}
                fill="none"
                stroke="url(#journeyStrokeEnterprise)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduced ? 0 : 1.2, ease: 'easeOut' }}
              />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={hoverIdx === i ? 6 : 4}
                  fill="var(--dash-brand)"
                  stroke="var(--dash-surface-0)"
                  strokeWidth="2"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                />
              ))}
              <defs>
                <linearGradient id="journeyStrokeEnterprise" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
                <linearGradient id="journeyFillEnterprise" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            {hoverIdx !== null && points[hoverIdx] && (
              <div
                className="absolute pointer-events-none px-2.5 py-1.5 rounded-lg text-[11px] font-semibold shadow-lg z-10"
                style={{
                  left: `${(points[hoverIdx].x / 700) * 100}%`,
                  top: `${(points[hoverIdx].y / 180) * 100}%`,
                  transform: 'translate(-50%, -130%)',
                  background: 'var(--dash-surface-ink)',
                  color: 'var(--dash-text-inv)',
                }}
              >
                {points[hoverIdx].label}: {points[hoverIdx].hours}h
              </div>
            )}
          </>
        ) : (
          <div className="dash-empty-state h-full">
            <Activity className="w-6 h-6" style={{ color: 'var(--dash-brand-2)' }} />
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
