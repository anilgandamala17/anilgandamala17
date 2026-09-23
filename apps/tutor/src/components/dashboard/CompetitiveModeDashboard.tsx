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
import { useCompetitiveDashboardData } from '../../hooks/useCompetitiveDashboardData';
import { studentRoutes } from '../../utils/routes';
import { analytics } from '../../services/analyticsService';

const sectionGap = { marginBottom: 'var(--dash-section-gap)' } as const;

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
      className="rounded-xl px-3 py-3 border min-w-0"
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
 * Competitive overview mode — Curriculum dash-* visual system.
 * Start/Continue navigates to /student/competitive for live practice.
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
    >
      {/* Continue preparation */}
      <div style={sectionGap}>
        <section className="dash-card dash-card--elevated" aria-label="Continue preparation">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'var(--dash-info-soft)',
                color: 'var(--dash-info)',
              }}
            >
              <Crosshair className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="dash-eyebrow mb-1">Continue preparation</p>
              {data.continueSession ? (
                <>
                  <h2 className="dash-type-h3 truncate">{data.continueSession.title}</h2>
                  <p className="dash-type-caption mt-1">
                    {data.continueSession.subjectLabel} · {data.continueSession.progressLabel}
                  </p>
                  <div
                    className="mt-3 h-2 rounded-full overflow-hidden"
                    style={{ background: 'var(--dash-surface-2)' }}
                    role="progressbar"
                    aria-valuenow={data.continueSession.progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${data.continueSession.progressPct}%`,
                        background: 'var(--dash-brand)',
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="dash-type-h3">No session in progress</h2>
                  <p className="dash-type-caption mt-1">
                    Start a full paper, mock, or previous-year exam to resume it here.
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {data.continueSession ? (
                <button
                  type="button"
                  className="dash-btn dash-btn--primary"
                  onClick={() => goHub(data.continueSession!.href)}
                >
                  Continue exam
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className="dash-btn dash-btn--primary"
                  onClick={() => goHub()}
                >
                  Start prep
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Overview */}
      <div style={sectionGap}>
        <section className="dash-card" aria-label="Competitive overview">
          <div className="dash-section-head">
            <h2 className="dash-section-title">Competitive overview</h2>
            <p className="dash-section-head__sub">From your recorded exam attempts</p>
          </div>
          {!data.hasActivity ? (
            <div className="dash-empty-state">
              <Trophy className="w-5 h-5" style={{ color: 'var(--dash-info)' }} />
              <p className="dash-empty-state__title">No competitive exams attempted yet</p>
              <p className="dash-empty-state__body">
                Complete a mock, PYQ, or available exam to unlock overview metrics.
              </p>
              <button type="button" className="dash-btn dash-btn--primary dash-btn--sm mt-2" onClick={() => goHub()}>
                Open competitive hub
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
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
      </div>

      {/* Performance + Exam progress */}
      <div className="dash-grid-row" style={sectionGap}>
        <div className="lg:col-span-6 min-w-0">
          <section className="dash-card h-full" aria-label="Exam performance">
            <div className="dash-section-head">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: 'var(--dash-brand)' }} />
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
                  <MetricTile
                    label="Skipped"
                    value={String(data.performance.skipped)}
                  />
                ) : null}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-6 min-w-0">
          <section className="dash-card h-full" aria-label="Exam progress">
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
                    className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left border transition-colors hover:border-[var(--dash-brand)]"
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
                    <span className="shrink-0 tabular-nums text-sm font-bold" style={{ color: 'var(--dash-text-2)' }}>
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
      <div style={sectionGap}>
        <section className="dash-card" aria-label="Subject performance">
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
                  className="rounded-xl px-3 py-3 border"
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
      </div>

      {/* Recent attempts */}
      <div style={sectionGap}>
        <section className="dash-card" aria-label="Recent attempts">
          <div className="dash-section-head">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--dash-text-3)' }} />
              <h2 className="dash-section-title">Recent attempts</h2>
            </div>
          </div>
          {data.recentAttempts.length === 0 ? (
            <div className="dash-empty-state">
              <p className="dash-empty-state__title">No attempts yet</p>
              <p className="dash-empty-state__body">Finished exams will list here with score and accuracy.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.recentAttempts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl px-3 py-3 border"
                  style={{ borderColor: 'var(--dash-border)', background: 'var(--dash-surface-1)' }}
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
      </div>

      {/* PYQ + Recommendations */}
      <div className="dash-grid-row" style={sectionGap}>
        <div className="lg:col-span-6 min-w-0">
          <section className="dash-card h-full" aria-label="Previous year practice">
            <div className="dash-section-head">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4" style={{ color: 'var(--dash-brand)' }} />
                <h2 className="dash-section-title">Previous-year practice</h2>
              </div>
              <p className="dash-section-head__sub">Jump into PYQ papers</p>
            </div>
            <ul className="flex flex-col gap-2">
              {data.pyqExams.map((exam) => (
                <li key={exam.id}>
                  <button
                    type="button"
                    onClick={() => goHub(exam.href)}
                    className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left border"
                    style={{
                      borderColor: 'var(--dash-border)',
                      background: 'var(--dash-surface-1)',
                    }}
                  >
                    <span className="font-bold text-sm truncate" style={{ color: 'var(--dash-text)' }}>
                      {exam.name}
                      {exam.latestYear ? ` · ${exam.latestYear}` : ''}
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--dash-text-3)' }} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="lg:col-span-6 min-w-0">
          <section className="dash-card h-full" aria-label="Recommended practice">
            <div className="dash-section-head">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" style={{ color: 'var(--dash-warning)' }} />
                <h2 className="dash-section-title">Recommended practice</h2>
              </div>
              <p className="dash-section-head__sub">Based on your attempt history</p>
            </div>
            {data.recommendations.length === 0 ? (
              <div className="dash-empty-state">
                <p className="dash-empty-state__title">No recommendations yet</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2 mb-3">
                {data.recommendations.map((tip, i) => (
                  <li
                    key={`${i}-${tip.slice(0, 24)}`}
                    className="rounded-xl px-3 py-2.5 text-sm border"
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
            )}
            <button
              type="button"
              className="dash-btn dash-btn--primary dash-btn--sm"
              onClick={() => goHub()}
            >
              Practice in competitive hub
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
