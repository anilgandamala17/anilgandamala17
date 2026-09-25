import type { ReactNode } from 'react';

export type WelcomeStat = {
  label: string;
  value: string;
  tone?: 'sky' | 'amber' | 'rose' | 'teal';
  sparkline?: number[];
  onClick?: () => void;
  emptyHint?: string;
};

type WelcomeOverviewProps = {
  learnerName: string;
  readiness?: number;
  description: ReactNode;
  orbitLabel?: string;
  stats: WelcomeStat[];
  growthPct?: number;
  showGrowth?: boolean;
};

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Concise welcome — hierarchy below Continue Learning.
 * Stats render as Level-3 flat tiles (not competing cards).
 */
export default function WelcomeOverview({
  learnerName,
  description,
  stats,
  growthPct = 0,
  showGrowth = false,
}: WelcomeOverviewProps) {
  return (
    <section className="dash-welcome" aria-label="Welcome">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="dash-welcome__greeting">
          {timeGreeting()}, {learnerName}
        </h1>
        {showGrowth ? (
          <span
            className={`dash-badge ${growthPct >= 0 ? 'dash-badge--success' : 'dash-badge--warning'}`}
          >
            {growthPct >= 0 ? '+' : ''}
            {growthPct}% vs last week
          </span>
        ) : null}
      </div>
      <p className="dash-welcome__sub">{description}</p>

      {stats.length > 0 ? (
        <ul className="dash-welcome__stats">
          {stats.map((s) => (
            <li key={s.label} className="min-w-0">
              {s.onClick ? (
                <button
                  type="button"
                  className="dash-welcome__stat text-left w-full focus-visible:outline-none focus-visible:shadow-[var(--dash-focus-ring)]"
                  onClick={s.onClick}
                >
                  <p className="dash-welcome__stat-label">{s.label}</p>
                  <p className="dash-welcome__stat-value">{s.emptyHint ? '—' : s.value}</p>
                  {s.emptyHint ? (
                    <p className="dash-welcome__stat-hint">{s.emptyHint}</p>
                  ) : null}
                </button>
              ) : (
                <div className="dash-welcome__stat">
                  <p className="dash-welcome__stat-label">{s.label}</p>
                  <p className="dash-welcome__stat-value">{s.emptyHint ? '—' : s.value}</p>
                  {s.emptyHint ? (
                    <p className="dash-welcome__stat-hint">{s.emptyHint}</p>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
