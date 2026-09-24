import { BookOpen, Trophy } from 'lucide-react';

export type DashboardMode = 'curriculum' | 'competitive';

type DashboardModeSwitcherProps = {
  value: DashboardMode;
  onChange: (mode: DashboardMode) => void;
};

const MODES: Array<{
  id: DashboardMode;
  label: string;
  shortLabel: string;
  icon: typeof BookOpen;
}> = [
  { id: 'curriculum', label: 'Curriculum Dashboard', shortLabel: 'Curriculum', icon: BookOpen },
  { id: 'competitive', label: 'Competitive Dashboard', shortLabel: 'Competitive', icon: Trophy },
];

/**
 * Accessible segmented control for dashboard mode. Stays on /student/dashboard.
 */
export default function DashboardModeSwitcher({ value, onChange }: DashboardModeSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Dashboard mode"
      className="dash-mode-switcher flex w-full max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border p-1 gap-1"
      style={{
        borderColor: 'var(--dash-border)',
        background: 'var(--dash-surface-1)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {MODES.map((mode) => {
        const selected = value === mode.id;
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            id={`dash-mode-${mode.id}`}
            aria-selected={selected}
            aria-controls={`dash-panel-${mode.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(mode.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(mode.id);
              }
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const idx = MODES.findIndex((m) => m.id === value);
                const next =
                  e.key === 'ArrowRight'
                    ? MODES[(idx + 1) % MODES.length]
                    : MODES[(idx - 1 + MODES.length) % MODES.length];
                onChange(next.id);
              }
            }}
            className={`dash-mode-switcher__btn relative flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${
              selected
                ? 'text-white shadow-sm'
                : 'hover:opacity-90'
            }`}
            style={
              selected
                ? {
                    background: 'var(--dash-brand)',
                    color: '#fff',
                  }
                : {
                    color: 'var(--dash-text-2)',
                    background: 'transparent',
                  }
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline truncate">{mode.label}</span>
            <span className="sm:hidden truncate">{mode.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
