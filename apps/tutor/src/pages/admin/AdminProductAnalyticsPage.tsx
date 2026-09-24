import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Globe2,
  Loader2,
  MonitorSmartphone,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import PageTransition from '@/components/common/PageTransition'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import { adminRoutes } from '@/utils/routes'
import { analytics } from '@/services/analyticsService'
import {
  fetchAdminProductAnalytics,
  type AnalyticsDatePreset,
} from '@/services/adminAnalyticsApi'
import type { AdminAnalyticsReport, KpiValue, NamedCount } from '@/services/adminAnalyticsTypes'

const PRESETS: Array<{ id: AnalyticsDatePreset; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 days' },
  { id: '28d', label: 'Last 28 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
]

function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-IN').format(Math.round(n))
}

function formatPercent(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return `${n > 0 ? '+' : ''}${n}%`
}

function KpiCard({
  label,
  kpi,
  tip,
  suffix = '',
}: {
  label: string
  kpi?: KpiValue
  tip?: string
  suffix?: string
}) {
  const value = kpi?.value
  const change = kpi?.changePercent
  const up = (change ?? 0) > 0
  const down = (change ?? 0) < 0
  return (
    <div
      className="rounded-2xl border border-white/30 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-slate-700/50 dark:bg-slate-900/50"
      title={tip}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
        {value == null ? 'No data available' : `${formatNumber(value)}${suffix}`}
      </p>
      {change != null && value != null ? (
        <p
          className={`mt-1 flex items-center gap-1 text-xs font-medium ${
            up ? 'text-emerald-600' : down ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
          {down ? <ArrowDownRight className="h-3.5 w-3.5" /> : null}
          {formatPercent(change)} vs previous period
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-400">Historical comparison unavailable</p>
      )}
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-white/30 bg-white/50 p-5 shadow-sm backdrop-blur dark:border-slate-700/40 dark:bg-slate-900/40 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

function Empty({ label = 'No data available' }: { label?: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
      {label}
    </div>
  )
}

function SimpleBars({
  points,
  color = '#4f46e5',
}: {
  points: Array<{ label: string; value: number }>
  color?: string
}) {
  if (!points.length) return <Empty />
  const max = Math.max(...points.map((p) => p.value), 1)
  return (
    <div className="flex h-40 items-end gap-1 overflow-x-auto pb-6">
      {points.map((p) => (
        <div key={p.label} className="flex min-w-[18px] flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md"
            style={{
              height: `${Math.max(4, (p.value / max) * 100)}%`,
              background: color,
              opacity: 0.85,
            }}
            title={`${p.label}: ${p.value}`}
          />
          <span className="max-w-[40px] truncate text-[9px] text-slate-400">{p.label.slice(-4)}</span>
        </div>
      ))}
    </div>
  )
}

function NamedTable({ rows, nameHeader }: { rows: NamedCount[]; nameHeader: string }) {
  if (!rows.length) return <Empty />
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700">
            <th className="py-2 pr-4 font-semibold">{nameHeader}</th>
            <th className="py-2 pr-4 font-semibold">Count</th>
            <th className="py-2 font-semibold">Users</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-slate-100 dark:border-slate-800">
              <td className="max-w-[220px] truncate py-2 pr-4 font-medium text-slate-800 dark:text-slate-100">
                {r.name}
              </td>
              <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{formatNumber(r.count)}</td>
              <td className="py-2 text-slate-600 dark:text-slate-300">
                {formatNumber(r.users ?? null)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminProductAnalyticsPage() {
  const [preset, setPreset] = useState<AnalyticsDatePreset>('7d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<AdminAnalyticsReport | null>(null)

  useEffect(() => {
    analytics.dashboardView('admin_product_analytics', 'admin')
    analytics.featureUsed('admin_analytics_open')
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminProductAnalytics({
        preset: preset === 'custom' ? 'custom' : preset,
        start: preset === 'custom' ? customStart : undefined,
        end: preset === 'custom' ? customEnd : undefined,
      })
      setReport(data)
    } catch (err) {
      setReport(null)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [preset, customStart, customEnd])

  useEffect(() => {
    void load()
  }, [load])

  const userSeries = useMemo(
    () =>
      (report?.timeseries.users || []).map((p) => ({
        label: p.date,
        value: p.value,
      })),
    [report],
  )

  const sessionSeries = useMemo(
    () =>
      (report?.timeseries.sessions || []).map((p) => ({
        label: p.date,
        value: p.value,
      })),
    [report],
  )

  return (
    <PageTransition>
      <div className="relative min-h-screen min-h-[100dvh] overflow-x-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute right-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-400/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[35%] w-[35%] rounded-full bg-emerald-400/15 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6">
          <header className="sticky top-0 z-20 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/40 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
              <Link
                to={adminRoutes.dashboard}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Back to admin dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-600 shadow-lg shadow-indigo-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">
                  Aɪra Product Analytics
                </h1>
                <Breadcrumbs
                  role="admin"
                  homePath={adminRoutes.dashboard}
                  items={[
                    { label: 'Admin', path: adminRoutes.dashboard },
                    { label: 'Product Analytics' },
                  ]}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </header>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  preset === p.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/70 text-slate-600 hover:bg-white dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPreset('custom')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                preset === 'custom'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/70 text-slate-600 hover:bg-white dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Custom
            </button>
            {preset === 'custom' ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            ) : null}
          </div>

          {report?.realtime ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-3 text-sm dark:border-emerald-800/40 dark:bg-emerald-950/30"
            >
              <Activity className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                Real-time · {report.realtime.label}
              </span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-200">
                {report.realtime.activeUsers == null
                  ? 'No data available'
                  : formatNumber(report.realtime.activeUsers)}
              </span>
            </motion.div>
          ) : null}

          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-sm">Loading analytics…</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-5 w-5" />
                Could not load analytics
              </div>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          ) : (
            <div className="space-y-6 pb-16">
              {!report?.configured ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="font-semibold">GA4 reporting not fully configured</p>
                  <p className="mt-1">
                    {report?.message ||
                      'Set GA4_PROPERTY_ID on the landing server and grant Analytics Viewer to the service account. Registered user count may still appear from Firestore.'}
                  </p>
                </div>
              ) : null}

              <Section title="Overview" subtitle="Historical GA4 metrics for the selected range">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <KpiCard
                    label="Registered users (Firestore)"
                    kpi={report?.kpis.registeredUsers}
                    tip="Count of users/{uid} documents — not a GA4 metric"
                  />
                  <KpiCard label="Active users" kpi={report?.kpis.activeUsers} tip="GA4 activeUsers" />
                  <KpiCard label="New users" kpi={report?.kpis.newUsers} tip="GA4 newUsers" />
                  <KpiCard label="Sessions" kpi={report?.kpis.sessions} />
                  <KpiCard label="Page views" kpi={report?.kpis.pageViews} />
                  <KpiCard
                    label="Engagement rate"
                    kpi={report?.kpis.engagementRate}
                    suffix="%"
                    tip="GA4 engagementRate × 100"
                  />
                  <KpiCard
                    label="Avg session duration"
                    kpi={report?.kpis.avgEngagementSec}
                    suffix="s"
                    tip="GA4 averageSessionDuration (seconds)"
                  />
                  <KpiCard label="Lessons started" kpi={report?.kpis.lessonsStarted} tip="event: lesson_started" />
                  <KpiCard
                    label="Lessons completed"
                    kpi={report?.kpis.lessonsCompleted}
                    tip="event: lesson_completed"
                  />
                  <KpiCard label="Tests started" kpi={report?.kpis.testsStarted} tip="event: test_started" />
                  <KpiCard
                    label="Tests completed"
                    kpi={report?.kpis.testsCompleted}
                    tip="event: test_completed"
                  />
                </div>
              </Section>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Section title="Users over time" subtitle="Daily active users">
                  <SimpleBars points={userSeries} color="#4f46e5" />
                </Section>
                <Section title="Sessions over time" subtitle="Daily sessions">
                  <SimpleBars points={sessionSeries} color="#059669" />
                </Section>
              </div>

              <Section title="Product funnel" subtitle="Unique users per stage (from event totals)">
                {!report?.funnel?.length ? (
                  <Empty />
                ) : (
                  <ol className="space-y-3">
                    {report.funnel.map((step) => (
                      <li
                        key={step.stage}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/70 px-4 py-3 dark:bg-slate-800/50"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{step.stage}</p>
                          <p className="text-xs text-slate-500">event: {step.event}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-indigo-600 dark:text-indigo-300">
                            {formatNumber(step.users)}
                          </p>
                          {step.dropOffPercent != null ? (
                            <p className="text-xs text-rose-500">
                              {step.dropOffPercent}% drop-off from previous
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Section>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Section title="Top pages" subtitle="GA4 pagePath">
                  {!report?.topPages?.length ? (
                    <Empty />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700">
                            <th className="py-2 pr-4">Page</th>
                            <th className="py-2 pr-4">Views</th>
                            <th className="py-2">Users</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.topPages.map((p) => (
                            <tr key={p.page} className="border-b border-slate-100 dark:border-slate-800">
                              <td className="max-w-[280px] truncate py-2 pr-4 font-medium">{p.page}</td>
                              <td className="py-2 pr-4">{formatNumber(p.views)}</td>
                              <td className="py-2">{formatNumber(p.users)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Section>

                <Section title="Mode usage" subtitle="mode_selected · selected_mode (custom dim)">
                  <NamedTable rows={report?.modeUsage || []} nameHeader="Mode" />
                </Section>
              </div>

              <Section title="Curriculum" subtitle="From class/subject/topic events">
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-950/40">
                    <p className="text-xs font-semibold text-indigo-600">Lessons started</p>
                    <p className="text-xl font-black">{formatNumber(report?.curriculum.lessonStarted ?? null)}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
                    <p className="text-xs font-semibold text-emerald-600">Lessons completed</p>
                    <p className="text-xl font-black">{formatNumber(report?.curriculum.lessonCompleted ?? null)}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/40">
                    <p className="text-xs font-semibold text-amber-700">Lesson exits</p>
                    <p className="text-xl font-black">{formatNumber(report?.curriculum.lessonExit ?? null)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Classes</h3>
                    <NamedTable rows={report?.curriculum.classes || []} nameHeader="Class" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Subjects</h3>
                    <NamedTable rows={report?.curriculum.subjects || []} nameHeader="Subject" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Topics</h3>
                    <NamedTable rows={report?.curriculum.topics || []} nameHeader="Topic" />
                  </div>
                </div>
              </Section>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Section title="Authentication" subtitle="sign_up / login / login_failed / logout">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Sign-ups', report?.auth?.signUps],
                      ['Logins', report?.auth?.logins],
                      ['Login failed', report?.auth?.loginFailed],
                      ['Logouts', report?.auth?.logouts],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-xl bg-white/70 p-3 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-lg font-black">{formatNumber(value as number)}</p>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Cache & performance" subtitle="content_loaded / cache_* / page_performance / api_performance">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Content loaded', report?.cache?.contentLoaded],
                      ['Cache hits', report?.cache?.cacheHits],
                      ['Cache misses', report?.cache?.cacheMisses],
                      ['Page perf events', report?.performance?.pagePerformanceEvents],
                      ['API perf events', report?.performance?.apiPerformanceEvents],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-xl bg-white/70 p-3 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-lg font-black">{formatNumber(value as number)}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Section title="AI Teacher" subtitle="Teaching + doubt events (no chat text)">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Teaching views', report?.aiTeacher.teachingPageViews],
                      ['Lessons started', report?.aiTeacher.lessonsStarted],
                      ['Lessons completed', report?.aiTeacher.lessonsCompleted],
                      ['Questions asked', report?.aiTeacher.questionsAsked],
                      ['Answers received', report?.aiTeacher.answersReceived],
                      ['AI errors', report?.aiTeacher.errors],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-xl bg-white/70 p-3 dark:bg-slate-800/50">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-lg font-black">{formatNumber(value as number)}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              <Section title="Competitive Mode" subtitle="Exam / quiz / explanation events (IDs & scores only)">
                  {(() => {
                    const c = report?.competitive
                    const started = c?.testsStarted ?? 0
                    const completed = c?.testsCompleted ?? 0
                    const abandoned = c?.testsAbandoned ?? 0
                    const correct = c?.answersCorrect ?? 0
                    const incorrect = c?.answersIncorrect ?? 0
                    const answered = correct + incorrect
                    const completionPct =
                      started > 0 ? Math.round((completed / started) * 1000) / 10 : null
                    const abandonPct =
                      started > 0 ? Math.round((abandoned / started) * 1000) / 10 : null
                    const accuracyPct =
                      answered > 0 ? Math.round((correct / answered) * 1000) / 10 : null
                    return (
                      <>
                        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {[
                            ['Tests started', c?.testsStarted],
                            ['Tests completed', c?.testsCompleted],
                            ['Tests abandoned', c?.testsAbandoned],
                            ['Questions attempted', c?.questionsAttempted],
                            ['Correct answers', c?.answersCorrect],
                            ['Incorrect answers', c?.answersIncorrect],
                          ].map(([label, value]) => (
                            <div key={String(label)} className="rounded-xl bg-white/70 p-3 dark:bg-slate-800/50">
                              <p className="text-xs text-slate-500">{label}</p>
                              <p className="text-lg font-black">{formatNumber(value as number)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
                            <p className="text-xs font-semibold text-emerald-600">Completion %</p>
                            <p className="text-xl font-black">
                              {completionPct == null ? '—' : `${completionPct}%`}
                            </p>
                          </div>
                          <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-950/40">
                            <p className="text-xs font-semibold text-rose-600">Abandon %</p>
                            <p className="text-xl font-black">
                              {abandonPct == null ? '—' : `${abandonPct}%`}
                            </p>
                          </div>
                          <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/40">
                            <p className="text-xs font-semibold text-amber-700">Accuracy %</p>
                            <p className="text-xl font-black">
                              {accuracyPct == null ? '—' : `${accuracyPct}%`}
                            </p>
                          </div>
                        </div>
                        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                          {[
                            ['Mode opened', c?.modeOpened],
                            ['Exam selected', c?.examSelected],
                            ['Explanations started', c?.explanationsStarted],
                            ['Explanations completed', c?.explanationsCompleted],
                            ['Explanations exit', c?.explanationsExit],
                            ['Performance views', c?.performanceViews],
                          ].map(([label, value]) => (
                            <div key={String(label)} className="rounded-xl bg-orange-50/80 p-3 dark:bg-orange-950/30">
                              <p className="text-xs text-slate-500">{label}</p>
                              <p className="text-lg font-black">{formatNumber((value as number | undefined) ?? null)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                          <div>
                            <h3 className="mb-2 text-sm font-semibold">Sections</h3>
                            <NamedTable rows={c?.sectionViews || []} nameHeader="Section" />
                          </div>
                          <div>
                            <h3 className="mb-2 text-sm font-semibold">Flow types</h3>
                            <NamedTable rows={c?.byFlowType || []} nameHeader="Flow" />
                          </div>
                          <div>
                            <h3 className="mb-2 text-sm font-semibold">Top exams</h3>
                            <NamedTable rows={c?.topExams || []} nameHeader="Exam" />
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </Section>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Section title="Devices" subtitle="deviceCategory">
                  <NamedTable rows={report?.devices || []} nameHeader="Device" />
                </Section>
                <Section title="Browsers">
                  <NamedTable rows={report?.browsers || []} nameHeader="Browser" />
                </Section>
                <Section title="Operating systems">
                  <NamedTable rows={report?.os || []} nameHeader="OS" />
                </Section>
              </div>

              <Section title="Geography" subtitle="Country (aggregated)">
                <div className="flex items-start gap-2">
                  <Globe2 className="mt-1 h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                    <NamedTable rows={report?.countries || []} nameHeader="Country" />
                  </div>
                </div>
              </Section>

              <Section title="Errors" subtitle="Error-like event counts">
                <NamedTable rows={report?.errors || []} nameHeader="Error event" />
              </Section>

              <Section title="Event activity" subtitle="All events in range">
                {!report?.events?.length ? (
                  <Empty />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700">
                          <th className="py-2 pr-4">Event</th>
                          <th className="py-2 pr-4">Count</th>
                          <th className="py-2 pr-4">Users</th>
                          <th className="py-2">Per user</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.events.map((e) => (
                          <tr key={e.event} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-2 pr-4 font-medium">{e.event}</td>
                            <td className="py-2 pr-4">{formatNumber(e.count)}</td>
                            <td className="py-2 pr-4">{formatNumber(e.users)}</td>
                            <td className="py-2">
                              {e.eventsPerUser == null ? '—' : e.eventsPerUser}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              <Section
                title="Retention / returning users"
                subtitle="Detailed cohort retention requires GA4 Explore or BigQuery"
              >
                <Empty label="1/7/30-day cohort retention is not available via this API yet — use GA4 Explore, or enable BigQuery export." />
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/70 p-3 dark:bg-slate-800/50">
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <Users className="h-3.5 w-3.5" /> New users (range)
                    </p>
                    <p className="text-lg font-black">{formatNumber(report?.kpis.newUsers?.value ?? null)}</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3 dark:bg-slate-800/50">
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <TrendingUp className="h-3.5 w-3.5" /> Active users (range)
                    </p>
                    <p className="text-lg font-black">{formatNumber(report?.kpis.activeUsers?.value ?? null)}</p>
                  </div>
                </div>
              </Section>

              <Section title="User directory" subtitle="Admin-only identity list is not mirrored from GA4">
                <Empty label="Per-user session detail is not exposed from GA4 here (privacy). Use Firebase Auth / Firestore admin tools for account ops — never for private chat content." />
              </Section>

              <p className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <BarChart3 className="h-3.5 w-3.5" /> Source: {report?.source || 'none'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" /> Range: {report?.range.startDate} →{' '}
                  {report?.range.endDate}
                </span>
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> Events written by analyticsService → GA4
                </span>
                <span className="inline-flex items-center gap-1">
                  <MonitorSmartphone className="h-3.5 w-3.5" /> No passwords, tokens, or chat text
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
