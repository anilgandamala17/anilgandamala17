import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { adminRoutes, getRoutesForRole } from '../utils/routes';
import { useSignOut } from '../hooks/useSignOut';
import { COMPETITIVE_EXAMS } from '../data/mockData';
import PageTransition from '../components/common/PageTransition';
import { UserAvatar } from '../components/common/UserAvatar';
import Breadcrumbs from '../components/common/Breadcrumbs';
import type { WeeklyExamDay, WeeklyExamMode, WeeklyExamSession } from '../types/weeklyExam';
import {
  archiveSession,
  defaultWeekendWindowsIst,
  duplicateWeekToNext,
  formatWindowLabel,
  getIsoWeekKeyFromUtcIso,
  getIsoWeekKeyIst,
  getSessionWindowState,
  listAllForAdmin,
  publishSession,
  seedThisWeekendDefaults,
  unpublishSession,
  upsertSession,
} from '../services/weeklyExamSchedule';

type DraftForm = {
  id?: string;
  weekKey: string;
  day: WeeklyExamDay;
  title: string;
  examId: string;
  subjectId: string;
  mode: WeeklyExamMode;
  startsLocal: string;
  endsLocal: string;
  status: 'draft' | 'published';
};

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // datetime-local wants local wall clock; convert IST wall via offset display
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
}

/** Interpret datetime-local as IST civil time → UTC ISO. */
function localIstInputToUtcIso(value: string): string {
  if (!value) return new Date().toISOString();
  const [datePart, timePart = '00:00'] = value.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  const asUtcGuess = Date.UTC(y, m - 1, d, hh, mm, 0);
  return new Date(asUtcGuess - (5 * 60 + 30) * 60 * 1000).toISOString();
}

function emptyDraft(day: WeeklyExamDay = 'saturday'): DraftForm {
  const windows = defaultWeekendWindowsIst();
  const range = day === 'saturday' ? windows.saturday : windows.sunday;
  const exam = COMPETITIVE_EXAMS[0];
  return {
    weekKey: windows.weekKey,
    day,
    title: day === 'saturday' ? 'Saturday Weekly Exam' : 'Sunday Weekly Exam',
    examId: exam.id,
    subjectId: exam.subjects[0]?.id || '',
    mode: 'mock',
    startsLocal: toLocalInputValue(range.startsAt),
    endsLocal: toLocalInputValue(range.endsAt),
    status: 'draft',
  };
}

function statusBadge(session: WeeklyExamSession) {
  const window = getSessionWindowState(session);
  if (session.status === 'archived') return { label: 'Archived', className: 'bg-slate-100 text-slate-600' };
  if (session.status === 'draft') return { label: 'Draft', className: 'bg-amber-50 text-amber-700' };
  if (window === 'live') return { label: 'Live now', className: 'bg-emerald-50 text-emerald-700' };
  if (window === 'upcoming') return { label: 'Scheduled', className: 'bg-sky-50 text-sky-700' };
  if (window === 'ended') return { label: 'Ended', className: 'bg-slate-100 text-slate-500' };
  return { label: 'Locked', className: 'bg-slate-100 text-slate-500' };
}

export default function AdminWeeklyExamsPage() {
  const { role, user } = useAuthStore();
  const signOut = useSignOut();
  const routes = getRoutesForRole(role);

  const [sessions, setSessions] = useState<WeeklyExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<DraftForm>(() => emptyDraft('saturday'));
  const [editingId, setEditingId] = useState<string | null>(null);

  const weekKey = useMemo(() => getIsoWeekKeyIst(), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listAllForAdmin();
      setSessions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedExam = COMPETITIVE_EXAMS.find((e) => e.id === form.examId) || COMPETITIVE_EXAMS[0];

  // Keep week key aligned with the start time (students filter by current week)
  useEffect(() => {
    if (!form.startsLocal) return;
    const derived = getIsoWeekKeyFromUtcIso(localIstInputToUtcIso(form.startsLocal));
    if (derived && derived !== form.weekKey) {
      setForm((f) => (f.weekKey === derived ? f : { ...f, weekKey: derived }));
    }
  }, [form.startsLocal, form.weekKey]);

  const handleLogout = () => void signOut();

  const startCreate = (day: WeeklyExamDay) => {
    setEditingId(null);
    setForm(emptyDraft(day));
    setNotice(null);
  };

  const startEdit = (session: WeeklyExamSession) => {
    setEditingId(session.id);
    setForm({
      id: session.id,
      weekKey: session.weekKey,
      day: session.day,
      title: session.title,
      examId: session.examId,
      subjectId: session.subjectId || '',
      mode: session.mode,
      startsLocal: toLocalInputValue(session.startsAt),
      endsLocal: toLocalInputValue(session.endsAt),
      status: session.status === 'published' ? 'published' : 'draft',
    });
    setNotice(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const title = form.title.trim();
      if (!title) throw new Error('Title is required.');
      if (!form.examId) throw new Error('Exam is required.');
      if (!form.startsLocal || !form.endsLocal) {
        throw new Error('Start and end times are required.');
      }
      const startsAt = localIstInputToUtcIso(form.startsLocal);
      const endsAt = localIstInputToUtcIso(form.endsLocal);
      if (Date.parse(endsAt) <= Date.parse(startsAt)) {
        throw new Error('End time must be after start time.');
      }

      const saved = await upsertSession({
        id: editingId || undefined,
        weekKey: getIsoWeekKeyFromUtcIso(startsAt),
        day: form.day,
        title,
        examId: form.examId,
        subjectId: form.subjectId || undefined,
        mode: form.mode,
        startsAt,
        endsAt,
        status: form.status,
      });
      const wasEdit = Boolean(editingId);
      setNotice(
        wasEdit
          ? 'Session updated and synced for students.'
          : form.status === 'published'
            ? 'Session published — students will see it for this weekend.'
            : 'Session created as draft. Publish it so students can see it.',
      );
      setEditingId(saved.id);
      setForm((f) => ({
        ...f,
        id: saved.id,
        title: saved.title,
        weekKey: saved.weekKey,
        status: saved.status === 'published' ? 'published' : 'draft',
      }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async (session: WeeklyExamSession) => {
    setSaving(true);
    setError(null);
    try {
      if (session.status === 'published') await unpublishSession(session.id);
      else await publishSession(session.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (session: WeeklyExamSession) => {
    if (!confirm(`Archive “${session.title}”? Students will no longer see it.`)) return;
    setSaving(true);
    try {
      await archiveSession(session.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Archive failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    setSaving(true);
    setError(null);
    try {
      await seedThisWeekendDefaults();
      setNotice('Seeded Saturday & Sunday published exams for this weekend (IST).');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Seed failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    setSaving(true);
    setError(null);
    try {
      const sourceWeek = sessions.find((s) => s.status === 'published')?.weekKey || weekKey;
      await duplicateWeekToNext(sourceWeek);
      setNotice(`Duplicated published sessions from ${sourceWeek} into next week as drafts.`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Duplicate failed');
    } finally {
      setSaving(false);
    }
  };

  const visible = sessions.filter((s) => s.status !== 'archived');

  return (
    <div className="min-h-screen min-h-[100dvh] relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[45%] h-[45%] bg-indigo-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to={adminRoutes.dashboard}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                aria-label="Back to admin dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Link to={adminRoutes.dashboard} className="flex items-center gap-2 shrink-0">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </span>
                <span className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hidden sm:inline">
                  Aɪra
                </span>
              </Link>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                Weekly exams
              </span>
            </div>
            <nav className="flex items-center gap-1.5">
              {import.meta.env.DEV ? (
                <Link
                  to="/dev/demo-roles"
                  className="hidden sm:inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  title="Switch demo role"
                >
                  Switch role
                </Link>
              ) : null}
              <Link
                to={routes.settings}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <Link to={routes.profile} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <UserAvatar user={user} size={30} />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-600"
              >
                Sign out
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <PageTransition className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
            <Breadcrumbs
              role={role}
              homePath={adminRoutes.dashboard}
              items={[
                { label: 'Governance', path: adminRoutes.dashboard },
                { label: 'Weekly exams' },
              ]}
            />

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Admin only · IST weekends
                </p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Saturday &amp; Sunday exam schedule
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 max-w-xl">
                  Publish weekend competitive exams. Students only see published sessions during their live window.
                  Current week: <span className="font-semibold text-slate-700 dark:text-slate-200">{weekKey}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSeed()}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Seed this weekend
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleDuplicate()}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-200"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicate → next week
                </button>
                <button
                  type="button"
                  onClick={() => startCreate('saturday')}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New session
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {notice}
              </div>
            ) : null}

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              {/* Form */}
              <section className="xl:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-4">
                  {editingId ? 'Edit session' : 'Create session'}
                </h2>
                <div className="space-y-3.5">
                  <label className="block text-xs font-bold text-slate-500">
                    Title
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-bold text-slate-500">
                      Day
                      <select
                        value={form.day}
                        onChange={(e) => setForm((f) => ({ ...f, day: e.target.value as WeeklyExamDay }))}
                        className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                    </label>
                    <label className="block text-xs font-bold text-slate-500">
                      Week key
                      <input
                        value={form.weekKey}
                        readOnly
                        title="Auto-set from start date (IST)"
                        className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300"
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-bold text-slate-500">
                    Exam
                    <select
                      value={form.examId}
                      onChange={(e) => {
                        const exam = COMPETITIVE_EXAMS.find((x) => x.id === e.target.value);
                        setForm((f) => ({
                          ...f,
                          examId: e.target.value,
                          subjectId: exam?.subjects[0]?.id || '',
                        }));
                      }}
                      className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950"
                    >
                      {COMPETITIVE_EXAMS.map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-bold text-slate-500">
                    Subject
                    <select
                      value={form.subjectId}
                      onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
                      className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950"
                    >
                      {selectedExam.subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-bold text-slate-500">
                    Mode
                    <select
                      value={form.mode}
                      onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as WeeklyExamMode }))}
                      className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="mock">Mock</option>
                      <option value="pyq">PYQ</option>
                    </select>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block text-xs font-bold text-slate-500">
                      Starts (IST)
                      <input
                        type="datetime-local"
                        value={form.startsLocal}
                        onChange={(e) => setForm((f) => ({ ...f, startsLocal: e.target.value }))}
                        className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950"
                      />
                    </label>
                    <label className="block text-xs font-bold text-slate-500">
                      Ends (IST)
                      <input
                        type="datetime-local"
                        value={form.endsLocal}
                        onChange={(e) => setForm((f) => ({ ...f, endsLocal: e.target.value }))}
                        className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950"
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-bold text-slate-500">
                    Status
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, status: e.target.value as 'draft' | 'published' }))
                      }
                      className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="draft">Draft (hidden from students)</option>
                      <option value="published">Published</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave()}
                    className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editingId ? 'Update session' : 'Create session'}
                  </button>
                </div>
              </section>

              {/* List */}
              <section className="xl:col-span-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">
                    All sessions
                  </h2>
                  <span className="text-xs font-semibold text-slate-400">{visible.length} active</span>
                </div>

                {loading ? (
                  <div className="py-16 flex justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : visible.length === 0 ? (
                  <div className="py-14 text-center">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No sessions yet</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Create Sat/Sun exams or seed this weekend to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visible.map((session) => {
                      const badge = statusBadge(session);
                      const exam = COMPETITIVE_EXAMS.find((e) => e.id === session.examId);
                      const subject = exam?.subjects.find((s) => s.id === session.subjectId);
                      return (
                        <motion.article
                          key={session.id}
                          layout
                          className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`inline-flex h-6 items-center rounded-md px-2 text-[10px] font-bold uppercase ${badge.className}`}>
                                  {badge.label}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  {session.day} · {session.weekKey}
                                </span>
                              </div>
                              <h3 className="font-bold text-slate-900 dark:text-white">{session.title}</h3>
                              <p className="mt-1 text-xs text-slate-500">
                                {exam?.name || session.examId}
                                {subject ? ` · ${subject.name}` : ''}
                                {' · '}
                                {session.mode.toUpperCase()}
                              </p>
                              <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                                {formatWindowLabel(session.startsAt)} → {formatWindowLabel(session.endsAt)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEdit(session)}
                                className="h-8 px-2.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => void handlePublishToggle(session)}
                                className="h-8 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200"
                              >
                                {session.status === 'published' ? (
                                  <>
                                    <EyeOff className="w-3 h-3" /> Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3" /> Publish
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => void handleArchive(session)}
                                className="h-8 px-2.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 text-rose-600 bg-rose-50 dark:bg-rose-950/30"
                              >
                                <Trash2 className="w-3 h-3" /> Archive
                              </button>
                            </div>
                          </div>
                          {getSessionWindowState(session) === 'live' ? (
                            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Students can take this exam now
                            </p>
                          ) : null}
                        </motion.article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
