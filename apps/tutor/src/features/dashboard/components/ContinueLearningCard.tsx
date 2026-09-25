import { ChevronRight, Clock, BookOpen } from 'lucide-react';
import { subjectHex, subjectIcon } from './theme/subjectColors';

type ContinueLearningCardProps = {
  title: string;
  subjectId?: string;
  subjectName?: string;
  difficulty?: string;
  duration?: string;
  inProgress?: boolean;
  mastery?: number;
  lastSessionAt?: string;
  empty?: boolean;
  onLaunch: () => void;
  onBrowse?: () => void;
};

function relativeTime(iso?: string): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Level-1 primary surface — answers "What should I continue?"
 */
export default function ContinueLearningCard({
  title,
  subjectId = 'mathematics',
  subjectName,
  difficulty,
  duration,
  inProgress,
  mastery = 0,
  lastSessionAt,
  empty = false,
  onLaunch,
  onBrowse,
}: ContinueLearningCardProps) {
  const Icon = subjectIcon(subjectId);
  const color = subjectHex(subjectId);
  const pct = Math.min(100, Math.max(0, mastery));
  const when = relativeTime(lastSessionAt);

  return (
    <section className="dash-surface-primary" aria-label="Continue learning">
      <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-[var(--dash-radius-sm)] flex items-center justify-center shrink-0"
          style={{
            background: empty
              ? 'var(--dash-brand-soft)'
              : `color-mix(in srgb, ${color} 16%, transparent)`,
            color: empty ? 'var(--dash-brand)' : color,
          }}
        >
          {empty ? <BookOpen className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="dash-eyebrow" style={{ color: 'var(--dash-brand)' }}>
              Continue learning
            </p>
            {!empty && inProgress ? (
              <span className="dash-badge dash-badge--info">In progress</span>
            ) : null}
            {!empty && when ? (
              <span className="inline-flex items-center gap-1 dash-type-caption">
                <Clock className="w-3 h-3" aria-hidden />
                Last session {when}
              </span>
            ) : null}
          </div>

          {empty ? (
            <>
              <h2 className="dash-type-h2">Ready to start learning?</h2>
              <p className="dash-type-caption mt-1 max-w-lg">
                Choose a subject and begin your first lesson. Your progress will appear here.
              </p>
            </>
          ) : (
            <>
              <h2 className="dash-type-h2 truncate">{title}</h2>
              <p className="dash-type-caption mt-1">
                {[duration, subjectName, difficulty].filter(Boolean).join(' · ')}
              </p>
              {pct > 0 || inProgress ? (
                <div className="mt-3 max-w-md">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--dash-text-3)' }}
                    >
                      Progress
                    </span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color }}>
                      {pct}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--dash-surface-2)' }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Topic progress"
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                      style={{
                        width: `${pct}%`,
                        background: color,
                        minWidth: pct > 0 ? 4 : 0,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
          {empty && onBrowse ? (
            <button type="button" className="dash-btn dash-btn--ghost" onClick={onBrowse}>
              Explore curriculum
            </button>
          ) : null}
          <button
            type="button"
            className="dash-btn dash-btn--primary w-full sm:w-auto"
            onClick={onLaunch}
          >
            {empty ? 'Start learning' : inProgress ? 'Resume' : 'Continue'}
            <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
