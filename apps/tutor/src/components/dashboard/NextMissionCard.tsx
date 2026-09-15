import { ChevronRight, Clock, Rocket } from 'lucide-react';
import { subjectHex, subjectIcon } from './theme/subjectColors';

type NextMissionCardProps = {
  title: string;
  meta: string;
  subjectId?: string;
  difficulty?: string;
  inProgress?: boolean;
  mastery?: number;
  onLaunch: () => void;
  empty?: boolean;
  duration?: string;
  subjectName?: string;
};

export default function NextMissionCard({
  title,
  meta,
  subjectId = 'english',
  difficulty,
  inProgress,
  mastery = 0,
  onLaunch,
  empty = false,
  duration,
  subjectName,
}: NextMissionCardProps) {
  const Icon = subjectIcon(subjectId);
  const color = subjectHex(subjectId);

  const chips = [
    duration || (meta.includes('·') ? meta.split('·')[0]?.trim() : undefined),
    subjectName || (meta.includes('·') ? meta.split('·')[1]?.trim() : undefined),
    difficulty,
  ].filter(Boolean) as string[];

  return (
    <div
      className="dash-card flex flex-col"
      style={{ background: 'var(--dash-grad-mission)' }}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(244,63,94,0.18), rgba(249,115,22,0.12))',
            }}
          >
            <Rocket className="w-4 h-4 text-rose-500" />
          </div>
          <div className="min-w-0">
            <p className="dash-eyebrow">Next lesson</p>
            <p className="text-[11px] font-medium truncate" style={{ color: 'var(--dash-text-3)' }}>
              {inProgress ? 'In progress — pick up where you left off' : 'Recommended for you'}
            </p>
          </div>
        </div>
        {inProgress ? (
          <span
            className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg"
            style={{ background: 'rgba(14,165,233,0.12)', color: '#0284c7' }}
          >
            Active
          </span>
        ) : null}
      </div>

      {empty ? (
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div>
            <h3
              style={{
                fontFamily: 'var(--dash-font-display)',
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--dash-text)',
              }}
            >
              Choose your first lesson
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--dash-text-2)' }}>
              Open the curriculum and pick a topic — your next lesson will show up here.
            </p>
          </div>
          <button
            type="button"
            onClick={onLaunch}
            className="w-full h-11 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5"
            style={{ background: 'var(--dash-grad-brand)', color: '#fff' }}
          >
            Browse topics
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex items-start gap-3.5">
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(145deg, ${color}26, ${color}0d)`,
                color,
                boxShadow: `0 10px 24px ${color}24`,
              }}
            >
              <Icon className="w-6 h-6" />
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className="leading-snug line-clamp-2"
                style={{
                  fontFamily: 'var(--dash-font-display)',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--dash-text)',
                }}
              >
                {title}
              </h3>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1 h-6 px-2 rounded-lg text-[10px] font-semibold"
                    style={{
                      background: 'rgba(255,255,255,0.75)',
                      border: '1px solid var(--dash-border)',
                      color: 'var(--dash-text-2)',
                    }}
                  >
                    {chip.toLowerCase().includes('min') ? <Clock className="w-3 h-3" /> : null}
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {inProgress && mastery > 0 ? (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--dash-text-3)' }}>
                  Progress
                </span>
                <span className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--dash-text)' }}>
                  {Math.min(100, mastery)}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--dash-surface-2)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, mastery)}%`,
                    background: 'var(--dash-grad-brand)',
                  }}
                />
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onLaunch}
            className="mt-5 w-full h-11 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-all group"
            style={{
              background: 'var(--dash-grad-brand)',
              color: '#fff',
              boxShadow: '0 12px 28px rgba(79,70,229,0.28)',
            }}
          >
            {inProgress ? 'Continue lesson' : 'Start lesson'}
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}
    </div>
  );
}
