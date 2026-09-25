import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Clock,
  Crosshair,
  Lightbulb,
  Target,
  Trophy,
  BookMarked,
} from 'lucide-react';
import { useCompetitiveDashboardData } from '@/features/dashboard/hooks/useCompetitiveDashboardData';
import { studentRoutes } from '@/utils/routes';
import { analytics } from '@/services/analyticsService';
import EmptyState from '@/components/common/EmptyState';

function formatWhen(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function MetricTile({
  label,
  value,
  emptyHint,
}: {
  label: string;
  value: string | null;
  emptyHint?: string;
}) {
  return (
    <div
      className="rounded-[var(--dash-radius-sm)] px-3 py-3 border min-w-0"
      style={{ borderColor: 'var(--dash-border)', background: 'var(--dash-surface-1)' }}
    >
      <p className="dash-type-label mb-1">{label}</p>
      {value != null ? (
        <p className="dash-type-metric text-xl sm:text-2xl truncate">{value}</p>
      ) : (
        <p className="dash-type-caption mt-1">{emptyHint ?? '—'}</p>
      )}
    </div>
  );
}

/**
 * Competitive overview mode — same AIra shell, scoped orange accent on primary rail.
 */
export default function CompetitiveModeDashboard() {
  const navigate = useNavigate();
  const data = useCompetitiveDashboardData();

  const goHub = (path?: string) => {
    analytics.dashboardFeatureUsed('student_dashboard', 'open_competitive_mode');
    navigate(path || studentRoutes.competitive);
  };

  return (
    <div
      id="dash-panel-competitive"
      role="tabpanel"
      aria-labelledby="dash-mode-competitive"
      className="dash-stack dash-panel--competitive"
    >
      {/* P1 — Continue preparation */}
      <section className="dash-surface-primary" aria-label="Continue preparation">
        <div className="relative z-[1] flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-[var(--dash-radius-sm)] flex items-center justify-center shrink-0"
            style={{
              background: 'var(--dash-comp-accent-soft, var(--dash-info-soft))',
              color: 'var(--dash-comp-accent, var(--dash-info))',
            }}
          >
            <Crosshair className="w-6 h-6" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="dash-eyebrow mb-1"
              style={{ color: 'var(--dash-comp-accent, var(--dash-brand))' }}
            >
              Continue preparation
            </p>
            {data.continueSession ? (
              <>
                <h2 className="dash-type-h2 truncate">{data.continueSession.title}</h2>
                <p className="dash-type-caption mt-1">
                  {data.continueSession.subjectLabel} · {data.continueSession.progressLabel}
                </p>
                <div
                  className="mt-3 h-2 rounded-full overflow-hidden max-w-md"
                  style={{ background: 'var(--dash-surface-2)' }}
                  role="progressbar"
                  aria-valuenow={data.continueSession.progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                    style={{
                      width: `${data.continueSession.progressPct}%`,
                      background: 'var(--dash-comp-accent, var(--dash-brand))',
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <h2 className="dash-type-h2">Ready for your next practice session?</h2>
                <p className="dash-type-caption mt-1 max-w-lg">
                  Choose an exam and start preparing. Unfinished papers will resume here.
                </p>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto">
            {data.continueSession ? (
              <button
                type="button"
                className="dash-btn dash-btn--primary w-full sm:w-auto"
                onClick={() => goHub(data.continueSession!.href)}
              >
                Continue exam
                <ChevronRight className="w-4 h-4" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                className="dash-btn dash-btn--primary w-full sm:w-auto"
                onClick={() => goHub()}
              >
                Start practice
                <ChevronRight className="w-4 h-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Overview stats — only meaningful when activity exists */}
      <section className="dash-surface-support" aria-label="Competitive overview">
        <div className="dash-section-head">
          <h2 className="dash-section-title">Overview</h2>
          <p className="dash-section-head__sub">From your recorded exam attempts</p>
        </div>
        {!data.hasActivity ? (
          <EmptyState
            title="No competitive exams attempted yet"
            description="Complete a mock, year practice, or available exam to unlock overview metrics."
            actionLabel="Open competitive hub"
            onAction={() => goHub()}
            icon={<Trophy className="w-6 h-6" />}
            className="border-0 bg-transparent p-4"
          />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <MetricTile
              label="Exams attempted"
              value={
                data.overview.examsAttempted != null
                  ? String(data.overview.examsAttempted)
                  : null
              }
            />
            <MetricTile
              label="Completed"
              value={
                data.overview.examsCompleted != null
                  ? String(data.overview.examsCompleted)
                  : null
              }
            />
            <MetricTile
              label="Practice tests"
              value={
                data.overview.practiceTests != null
                  ? String(data.overview.practiceTests)
                  : null
              }
            />
            <MetricTile
              label="Average score"
              value={
                data.overview.averageScore != null
                  ? `${data.overview.averageScore}`
                  : null
              }
              emptyHint="Not enough scored attempts"
            />
          </div>
        )}
      </section>

      {/* Performance + Exam progress */}
      <div className="dash-grid-row">
        <div className="lg:col-span-6 min-w-0">
          <section className="dash-surface-support h-full" aria-label="Exam performance">
            <div className="dash-section-head">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: 'var(--dash-brand)' }} aria-hidden />
                <h2 className="dash-section-title">Exam performance</h2>
              </div>
              <p className="dash-section-head__sub">Accuracy and question totals</p>
            </div>
            {!data.hasActivity ? (
              <div className="dash-empty-state">
                <p className="dash-empty-state__title">Performance unlocks after attempts</p>
                <p className="dash-empty-state__body">
                  Accuracy and score metrics appear once you finish an exam or quiz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <MetricTile
                  label="Avg score"
                  value={
                    data.performance.averageScore != null
                      ? String(data.performance.averageScore)
                      : null
                  }
                />
                <MetricTile
                  label="Best score"
                  value={
                    data.performance.bestScore != null
                      ? String(data.performance.bestScore)
                      : null
                  }
                />
                <MetricTile
                  label="Accuracy"
                  value={
                    data.performance.accuracy != null
                      ? `${data.performance.accuracy}%`
                      : null
                  }
                />
                <MetricTile
                  label="Questions"
                  value={
                    data.performance.questionsAttempted != null
                      ? String(data.performance.questionsAttempted)
                      : null
                  }
                />
                <MetricTile
                  label="Correct"
                  value={
                    data.performance.correct != null
                      ? String(data.performance.correct)
                      : null
                  }
                />
                <MetricTile
                  label="Incorrect"
                  value={
                    data.performance.incorrect != null
                      ? String(data.performance.incorrect)
                      : null
                  }
                />
                {data.performance.skipped != null ? (
                  <MetricTile label="Skipped" value={String(data.performance.skipped)} />
                ) : null}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-6 min-w-0">
          <section className="dash-surface-support h-full" aria-label="Exam progress">
            <div className="dash-section-head">
              <h2 className="dash-section-title">Exam progress</h2>
              <p className="dash-section-head__sub">Configured exams in your catalog</p>
            </div>
            <ul className="flex flex-col gap-2">
              {data.examProgress.map((exam) => (
                <li key={exam.id}>
                  <button
                    type="button"
                    onClick={() =>
                      goHub(
                        `${studentRoutes.competitive}?section=exams&exam=${encodeURIComponent(exam.id)}`,
                      )
                    }
                    className="w-full flex items-center justify-between gap-3 rounded-[var(--dash-radius-sm)] px-3 py-2.5 text-left border transition-colors min-h-[44px] focus-visible:outline-none focus-visible:shadow-[var(--dash-focus-ring)] hover:border-[var(--dash-brand)]"
                    style={{
                      borderColor: 'var(--dash-border)',
                      background: 'var(--dash-surface-1)',
                    }}
                  >
                    <span className="min-w-0">
                      <span
                        className="block font-bold text-sm truncate"
                        style={{ color: 'var(--dash-text)' }}
                      >
                        {exam.name}
                      </span>
                      <span className="dash-type-caption">
                        {exam.attemptCount
                          ? `${exam.attemptCount} attempt${exam.attemptCount === 1 ? '' : 's'}`
                          : 'Not attempted yet'}
                      </span>
                    </span>
                    <span
                      className="shrink-0 tabular-nums text-sm font-bold"
                      style={{ color: 'var(--dash-text-2)' }}
                    >
                      {exam.accuracy != null ? `${exam.accuracy}%` : '—'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Subject performance */}
      <section className="dash-surface-support" aria-label="Subject performance">
        <div className="dash-section-head">
          <h2 className="dash-section-title">Subject performance</h2>
          <p className="dash-section-head__sub">From subjects in your attempts</p>
        </div>
        {data.subjectPerformance.length === 0 ? (
          <div className="dash-empty-state">
            <p className="dash-empty-state__title">No subject data yet</p>
            <p className="dash-empty-state__body">
              Subject accuracy appears after you complete competitive attempts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.subjectPerformance.map((s) => (
              <div
                key={s.id}
                className="rounded-[var(--dash-radius-sm)] px-3 py-3 border"
                style={{ borderColor: 'var(--dash-border)', background: 'var(--dash-surface-1)' }}
              >
                <p className="font-bold text-sm truncate" style={{ color: 'var(--dash-text)' }}>
                  {s.name}
                </p>
                <p className="dash-type-metric text-lg mt-1">
                  {s.accuracy != null ? `${s.accuracy}%` : '—'}
                </p>
                <p className="dash-type-caption mt-0.5">
                  {s.questions} question{s.questions === 1 ? '' : 's'}
                  {s.avgSecondsPerQ != null ? ` · ${s.avgSecondsPerQ}s/q` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent attempts — list, not BI table */}
      <section className="dash-surface-support" aria-label="Recent attempts">
        <div className="dash-section-head">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: 'var(--dash-text-3)' }} aria-hidden />
            <h2 className="dash-section-title">Recent attempts</h2>
          </div>
        </div>
        {data.recentAttempts.length === 0 ? (
          <EmptyState
            title="No attempts yet"
            description="Finished exams will list here with score and accuracy."
            actionLabel="Start practice"
            onAction={() => goHub()}
            className="border-0 bg-transparent p-4"
          />
        ) : (
          <ul className="flex flex-col divide-y" style={{ borderColor: 'var(--dash-border)' }}>
            {data.recentAttempts.map((a) => (
              <li
                key={a.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--dash-text)' }}>
                    {a.exam}
                    {a.year ? ` · ${a.year}` : ''}
                  </p>
                  <p className="dash-type-caption">
                    {formatWhen(a.date)} · {a.mode} · {a.status}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-sm font-bold tabular-nums">
                  <span style={{ color: 'var(--dash-text)' }}>{a.scoreLabel}</span>
                  {a.accuracy != null ? (
                    <span style={{ color: 'var(--dash-text-2)' }}>{a.accuracy}% acc</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Year practice + Recommendations */}
      <div className="dash-grid-row">
        <div className="lg:col-span-6 min-w-0">
          <section className="dash-surface-support h-full" aria-label="Year practice">
            <div className="dash-section-head">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4" style={{ color: 'var(--dash-brand)' }} aria-hidden />
                <h2 className="dash-section-title">Year practice</h2>
              </div>
              <p className="dash-section-head__sub">
                Year-tagged practice in exam pattern — not official archived papers
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              {data.pyqExams.map((exam) => (
                <li key={exam.id}>
                  <button
                    type="button"
                    onClick={() => goHub(exam.href)}
                    className="w-full flex items-center justify-between gap-2 rounded-[var(--dash-radius-sm)] px-3 py-2.5 text-left border min-h-[44px] focus-visible:outline-none focus-visible:shadow-[var(--dash-focus-ring)]"
                    style={{
                      borderColor: 'var(--dash-border)',
                      background: 'var(--dash-surface-1)',
                    }}
                  >
                    <span className="font-bold text-sm truncate" style={{ color: 'var(--dash-text)' }}>
                      {exam.name}
                      {exam.latestYear ? ` · ${exam.latestYear}` : ''}
                    </span>
                    <ChevronRight
                      className="w-4 h-4 shrink-0"
                      style={{ color: 'var(--dash-text-3)' }}
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="lg:col-span-6 min-w-0">
          <section className="dash-surface-support h-full" aria-label="Recommended practice">
            <div className="dash-section-head">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" style={{ color: 'var(--dash-warning)' }} aria-hidden />
                <h2 className="dash-section-title">Recommended practice</h2>
              </div>
              <p className="dash-section-head__sub">Based on your attempt history</p>
            </div>
            {data.recommendations.length === 0 ? (
              <EmptyState
                title="No recommendations yet"
                description="Complete a few attempts and AIra will suggest focused next steps."
                actionLabel="Practice in hub"
                onAction={() => goHub()}
                className="border-0 bg-transparent p-4"
              />
            ) : (
              <>
                <ul className="flex flex-col gap-2 mb-3">
                  {data.recommendations.map((tip, i) => (
                    <li
                      key={`${i}-${tip.slice(0, 24)}`}
                      className="rounded-[var(--dash-radius-sm)] px-3 py-2.5 text-sm border"
                      style={{
                        borderColor: 'var(--dash-border)',
                        background: 'var(--dash-surface-1)',
                        color: 'var(--dash-text-2)',
                      }}
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="dash-btn dash-btn--primary dash-btn--sm"
                  onClick={() => goHub()}
                >
                  Practice in competitive hub
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden />
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
