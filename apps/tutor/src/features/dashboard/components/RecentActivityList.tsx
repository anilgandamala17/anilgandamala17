import { ChevronRight, History } from 'lucide-react';
import { subjectHex, subjectIcon } from './theme/subjectColors';
import type { RecentActivityItem } from './recentActivityUtils';

type RecentActivityListProps = {
  items: RecentActivityItem[];
  onOpen: (topicId: string) => void;
  empty?: boolean;
};

/** Compact recent activity list (replaces large card strip). */
export default function RecentActivityList({ items, onOpen, empty }: RecentActivityListProps) {
  const list = items.slice(0, 5);

  return (
    <section className="dash-surface-support" aria-label="Recent activity">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <p className="dash-eyebrow mb-0.5">Recent activity</p>
          <h2 className="dash-section-title">Recent lessons</h2>
        </div>
        {!empty && list.length > 0 ? (
          <span className="dash-type-caption font-semibold">{list.length} recent</span>
        ) : null}
      </div>

      {empty || !list.length ? (
        <div className="dash-empty-state py-6">
          <History className="w-5 h-5" style={{ color: 'var(--dash-brand-2)' }} />
          <p className="dash-empty-state__title">No lessons yet</p>
          <p className="dash-empty-state__body">
            Start a topic and your recent study sessions will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--dash-border)' }}>
          {list.map((s) => {
            const Icon = subjectIcon(s.subject);
            const color = subjectHex(s.subject);
            const title =
              (s.attempts || 1) > 1 ? `${s.topicName} (${s.attempts}×)` : s.topicName;
            const pct = Math.min(100, Math.max(0, s.completionPercentage));
            return (
              <li key={s.key} style={{ borderColor: 'var(--dash-border)' }}>
                <button
                  type="button"
                  onClick={() => onOpen(s.topicId)}
                  className="w-full flex items-center gap-3 py-2.5 px-1 text-left group min-h-[44px] rounded-lg transition-colors"
                  style={{ color: 'var(--dash-text)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--dash-surface-1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: `color-mix(in srgb, ${color} 14%, transparent)`,
                      color,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{title}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--dash-text-3)' }}>
                      {s.subject} · {s.durationMinutes} min · {pct}% complete
                    </p>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 shrink-0 opacity-40 group-hover:opacity-80"
                    style={{ color: 'var(--dash-text-3)' }}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
