import type { ReactNode } from 'react';
import {
  ChevronRight,
  Crosshair,
  Gauge,
  Target,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react';
import type { computeCompetitiveInsights } from '../../stores/competitiveStore';

type CompetitiveInsights = ReturnType<typeof computeCompetitiveInsights>;

type CompetitivePreparationCardProps = {
  insights: CompetitiveInsights;
  onOpenAnalytics: () => void;
  onStart: () => void;
};

/**
 * Dedicated competitive prep block — empty CTA when attemptCount === 0.
 */
export default function CompetitivePreparationCard({
  insights,
  onOpenAnalytics,
  onStart,
}: CompetitivePreparationCardProps) {
  const empty = insights.attemptCount === 0;

  return (
    <section
      className="dash-card dash-card--analytics h-full flex flex-col"
      aria-label="Competitive preparation"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="dash-section-head mb-0">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-lg inline-flex items-center justify-center"
              style={{ background: 'var(--dash-info-soft)' }}
            >
              <Crosshair className="w-3.5 h-3.5" style={{ color: 'var(--dash-info)' }} />
            </span>
            <h2 className="dash-section-title">Competitive preparation</h2>
          </div>
          <p className="dash-section-head__sub">Mocks, accuracy, and speed from your attempts</p>
        </div>
        {!empty ? (
          <span className="dash-badge dash-badge--info shrink-0">{insights.rankPrediction}</span>
        ) : null}
      </div>

      {empty ? (
        <div className="dash-empty-state flex-1">
          <Trophy className="w-5 h-5" style={{ color: 'var(--dash-info)' }} />
          <p className="dash-empty-state__title">No competitive attempts yet</p>
          <p className="dash-empty-state__body">
            Take a topic quiz or timed mock to unlock accuracy, speed, and readiness insights.
          </p>
          <button type="button" className="dash-btn dash-btn--primary dash-btn--sm mt-2" onClick={onStart}>
            Start competitive prep
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Metric
              icon={<Gauge className="w-3.5 h-3.5" />}
              label="Readiness"
              value={`${insights.readiness}%`}
            />
            <Metric
              icon={<Target className="w-3.5 h-3.5" />}
              label="Accuracy"
              value={`${insights.overallAccuracy}%`}
            />
            <Metric
              icon={<Zap className="w-3.5 h-3.5" />}
              label="Attempts"
              value={`${insights.attemptCount}`}
            />
            <Metric
              icon={<Timer className="w-3.5 h-3.5" />}
              label="Avg / Q"
              value={insights.avgSpeed ? `${insights.avgSpeed}s` : '—'}
            />
          </div>

          {insights.weak.length > 0 ? (
            <div className="mb-3">
              <p className="dash-type-label mb-1.5">Priority subjects</p>
              <ul className="flex flex-col gap-1.5">
                {insights.weak.slice(0, 3).map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded-lg"
                    style={{ background: 'var(--dash-surface-1)' }}
                  >
                    <span className="font-semibold truncate" style={{ color: 'var(--dash-text)' }}>
                      {w.name}
                    </span>
                    <span
                      className="tabular-nums font-bold shrink-0"
                      style={{ color: 'var(--dash-warning)' }}
                    >
                      {w.accuracy}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {insights.recommendations[0] ? (
            <p className="dash-type-caption mb-3 line-clamp-2">{insights.recommendations[0]}</p>
          ) : null}

          <div className="mt-auto flex flex-wrap gap-2">
            <button
              type="button"
              className="dash-btn dash-btn--primary dash-btn--sm"
              onClick={onOpenAnalytics}
            >
              View performance
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button type="button" className="dash-btn dash-btn--ghost dash-btn--sm" onClick={onStart}>
              Practice more
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-xl px-2.5 py-2 border"
      style={{ borderColor: 'var(--dash-border)', background: 'var(--dash-surface-1)' }}
    >
      <div className="flex items-center gap-1 mb-0.5" style={{ color: 'var(--dash-text-3)' }}>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="dash-type-metric text-base">{value}</p>
    </div>
  );
}
