import { ChevronRight, History } from 'lucide-react';
import { subjectHex, subjectIcon } from './theme/subjectColors';

export type RecentMissionItem = {
  key: string;
  topicId: string;
  topicName: string;
  subject: string;
  durationMinutes: number;
  completionPercentage: number;
  attempts?: number;
};

type RecentMissionsStripProps = {
  items: RecentMissionItem[];
  onOpen: (topicId: string) => void;
  empty?: boolean;
};

/** Deduplicate consecutive same-topic entries into attempt counts. */
export function dedupeRecentMissions(
  sessions: Array<{
    sessionId: string;
    topicId: string;
    topicName: string;
    subject: string;
    durationMinutes: number;
    completionPercentage: number;
  }>
): RecentMissionItem[] {
  const out: RecentMissionItem[] = [];
  for (const s of sessions) {
    const last = out[out.length - 1];
    if (last && last.topicId === s.topicId) {
      last.attempts = (last.attempts || 1) + 1;
      last.durationMinutes += s.durationMinutes;
      last.completionPercentage = Math.max(last.completionPercentage, s.completionPercentage);
      continue;
    }
    out.push({
      key: s.sessionId,
      topicId: s.topicId,
      topicName: s.topicName,
      subject: s.subject,
      durationMinutes: s.durationMinutes,
      completionPercentage: s.completionPercentage,
      attempts: 1,
    });
  }
  return out;
}

export default function RecentMissionsStrip({ items, onOpen, empty }: RecentMissionsStripProps) {
  const list = items.slice(0, 4);

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-3.5">
        <div>
          <p className="dash-eyebrow mb-1">Recent activity</p>
          <h3
            className="text-[15px] font-bold tracking-tight"
            style={{ fontFamily: 'var(--dash-font-display)', color: 'var(--dash-text)' }}
          >
            Recent lessons
          </h3>
        </div>
        {!empty && list.length > 0 ? (
          <span className="text-[11px] font-semibold" style={{ color: 'var(--dash-text-3)' }}>
            {list.length} recent
          </span>
        ) : null}
      </div>

      {empty || !list.length ? (
        <div className="dash-empty-state py-8">
          <History className="w-5 h-5" style={{ color: 'var(--dash-brand-2)' }} />
          <p className="dash-empty-state__title">No lessons yet</p>
          <p className="dash-empty-state__body">
            Start a topic and your recent study sessions will show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {list.map((s) => {
            const Icon = subjectIcon(s.subject);
            const color = subjectHex(s.subject);
            const title =
              (s.attempts || 1) > 1 ? `${s.topicName} (${s.attempts}×)` : s.topicName;
            const pct = Math.min(100, Math.max(0, s.completionPercentage));
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onOpen(s.topicId)}
                className="group text-left rounded-2xl border p-3.5 transition-all"
                style={{
                  background: `linear-gradient(155deg, ${color}12 0%, var(--dash-surface-0) 55%)`,
                  borderColor: `${color}2a`,
                  boxShadow: 'var(--dash-shadow-1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = `${color}55`;
                  e.currentTarget.style.boxShadow = `0 12px 28px ${color}22`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.borderColor = `${color}2a`;
                  e.currentTarget.style.boxShadow = 'var(--dash-shadow-1)';
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(145deg, ${color}30, ${color}12)`,
                      color,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-[13px] font-semibold leading-snug line-clamp-2"
                        style={{ color: 'var(--dash-text)' }}
                      >
                        {title}
                      </p>
                      <ChevronRight
                        className="w-4 h-4 shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                        style={{ color }}
                      />
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: 'var(--dash-text-3)' }}>
                      {s.subject} · {s.durationMinutes} min
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'var(--dash-surface-2)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(pct, 2)}%`,
                            background: `linear-gradient(90deg, ${color}, var(--dash-brand))`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--dash-text-2)' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
