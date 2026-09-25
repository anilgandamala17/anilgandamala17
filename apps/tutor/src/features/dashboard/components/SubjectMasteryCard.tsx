import { BarChart3 } from 'lucide-react';
import { subjectHex, subjectIcon } from './theme/subjectColors';

export type SubjectMasteryItem = {
  id: string;
  name: string;
  accuracy: number;
  topicCount: number;
};

type SubjectMasteryCardProps = {
  items: SubjectMasteryItem[];
  empty?: boolean;
};

/**
 * Subject mastery matrix from real conceptMastery / quiz scores only.
 */
export default function SubjectMasteryCard({ items, empty }: SubjectMasteryCardProps) {
  const list = items.slice(0, 6);

  return (
    <section className="dash-surface-support h-full flex flex-col" aria-label="Subject mastery">
      <div className="dash-section-head mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-lg inline-flex items-center justify-center"
            style={{ background: 'var(--dash-brand-soft)' }}
          >
            <BarChart3 className="w-3.5 h-3.5" style={{ color: 'var(--dash-brand)' }} />
          </span>
          <h2 className="dash-section-title">Subject mastery</h2>
        </div>
        <p className="dash-section-head__sub">Accuracy from scored topics</p>
      </div>

      {empty || list.length === 0 ? (
        <div className="dash-empty-state flex-1">
          <BarChart3 className="w-5 h-5" style={{ color: 'var(--dash-brand-2)' }} />
          <p className="dash-empty-state__title">No mastery data yet</p>
          <p className="dash-empty-state__body">
            Complete quizzes in a subject and mastery bars will appear here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 flex-1 justify-center">
          {list.map((s) => {
            const Icon = subjectIcon(s.id);
            const color = subjectHex(s.id);
            const pct = Math.min(100, Math.max(0, s.accuracy));
            return (
              <li key={s.id} className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--dash-text)' }}>
                      {s.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium" style={{ color: 'var(--dash-text-3)' }}>
                      {s.topicCount} topic{s.topicCount === 1 ? '' : 's'}
                    </span>
                    <span className="text-xs font-bold tabular-nums" style={{ color }}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--dash-surface-2)' }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${s.name} mastery ${pct}%`}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: color, minWidth: pct > 0 ? 4 : 0 }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
