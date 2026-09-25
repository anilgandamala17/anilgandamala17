import { Focus, Sparkles, Target } from 'lucide-react';
import { subjectHex, subjectIcon } from './theme/subjectColors';

export type InsightSubject = {
  id: string;
  name: string;
  accuracy: number;
  topicCount: number;
};

type LearningInsightsCardProps = {
  strengths: InsightSubject[];
  focusAreas: InsightSubject[];
  empty?: boolean;
};

function InsightRow({
  item,
  tone,
}: {
  item: InsightSubject;
  tone: 'strength' | 'focus';
}) {
  const Icon = subjectIcon(item.id);
  const color = subjectHex(item.id);
  return (
    <li
      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 border"
      style={{
        borderColor: 'var(--dash-border)',
        background: 'var(--dash-surface-1)',
      }}
    >
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
      >
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate" style={{ color: 'var(--dash-text)' }}>
          {item.name}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--dash-text-3)' }}>
          {item.topicCount} scored · {item.accuracy}% accuracy
        </p>
      </div>
      <span className={`dash-badge ${tone === 'strength' ? 'dash-badge--success' : 'dash-badge--warning'}`}>
        {tone === 'strength' ? 'Strong' : 'Focus'}
      </span>
    </li>
  );
}

/**
 * Strengths and focus areas — empty until enough scored sessions exist.
 */
export default function LearningInsightsCard({
  strengths,
  focusAreas,
  empty,
}: LearningInsightsCardProps) {
  const hasData = strengths.length > 0 || focusAreas.length > 0;

  return (
    <section className="dash-surface-support h-full flex flex-col" aria-label="Learning insights">
      <div className="dash-section-head mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-lg inline-flex items-center justify-center"
            style={{ background: 'var(--dash-brand-soft)' }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--dash-brand)' }} />
          </span>
          <h2 className="dash-section-title">Learning insights</h2>
        </div>
        <p className="dash-section-head__sub">Strengths and focus areas from your quizzes</p>
      </div>

      {empty || !hasData ? (
        <div className="dash-empty-state flex-1">
          <Target className="w-5 h-5" style={{ color: 'var(--dash-brand-2)' }} />
          <p className="dash-empty-state__title">Insights unlock with practice</p>
          <p className="dash-empty-state__body">
            Finish a few scored quizzes and we&apos;ll highlight your strongest and weakest subjects.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          <div>
            <p className="dash-type-label mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" style={{ color: 'var(--dash-success)' }} />
              Strengths
            </p>
            {strengths.length === 0 ? (
              <p className="dash-type-caption">Keep practicing to reveal strengths.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {strengths.map((s) => (
                  <InsightRow key={s.id} item={s} tone="strength" />
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="dash-type-label mb-2 flex items-center gap-1.5">
              <Focus className="w-3 h-3" style={{ color: 'var(--dash-warning)' }} />
              Focus areas
            </p>
            {focusAreas.length === 0 ? (
              <p className="dash-type-caption">No weak spots flagged yet — nice work.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {focusAreas.map((s) => (
                  <InsightRow key={s.id} item={s} tone="focus" />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
