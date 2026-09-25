import { BookOpen, Trophy } from 'lucide-react';

export type DashboardMode = 'curriculum' | 'competitive';

type DashboardModeSwitcherProps = {
  value: DashboardMode;
  onChange: (mode: DashboardMode) => void;
};

const MODES: Array<{
  id: DashboardMode;
  label: string;
  icon: typeof BookOpen;
}> = [
  { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
  { id: 'competitive', label: 'Competitive', icon: Trophy },
];

/**
 * Premium segmented control for dashboard mode.
 * Stays on /student/dashboard — parent updates ?mode= via replace.
 */
export default function DashboardModeSwitcher({ value, onChange }: DashboardModeSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Dashboard mode"
      className="dash-mode-switcher"
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
            className="dash-mode-switcher__btn"
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
