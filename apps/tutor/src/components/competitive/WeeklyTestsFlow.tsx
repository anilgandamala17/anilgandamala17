import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Clock3,
  Lock,
  Play,
  Loader2,
  BookOpen,
  Timer,
} from 'lucide-react';
import { COMPETITIVE_EXAMS } from '../../data/mockData';
import ExamFlow from './ExamFlow';
import type { WeeklyExamSession } from '../../types/weeklyExam';
import {
  formatWindowLabel,
  getIsoWeekKeyIst,
  getSessionWindowState,
  listPublishedForWeek,
} from '../../services/weeklyExamSchedule';

interface WeeklyTestsFlowProps {
  onExamStateChange?: (active: boolean) => void;
}

type WeekendDay = 'saturday' | 'sunday';

/** Keep one session per weekend day — prefer the newest published copy. */
function dedupeWeekendSessions(sessions: WeeklyExamSession[]): WeeklyExamSession[] {
  const byDay = new Map<string, WeeklyExamSession>();
  for (const s of sessions) {
    const prev = byDay.get(s.day);
    if (!prev || s.updatedAt >= prev.updatedAt) byDay.set(s.day, s);
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

function WeekendSessionCard({
  session,
  day,
  index,
  nowTick,
  onLaunch,
}: {
  session: WeeklyExamSession | null;
  day: WeekendDay;
  index: number;
  nowTick: number;
  onLaunch: (session: WeeklyExamSession) => void;
}) {
  const dayLabel = day === 'saturday' ? 'Saturday' : 'Sunday';

  if (!session) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white/60 dark:border-slate-700 dark:bg-slate-900/30"
      >
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {dayLabel}
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-slate-400">
            Not scheduled
          </h3>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-8 text-center">
          <Lock className="h-6 w-6 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            Admin has not published a {dayLabel.toLowerCase()} exam yet.
          </p>
        </div>
      </motion.article>
    );
  }

  const exam = COMPETITIVE_EXAMS.find((e) => e.id === session.examId);
  const state = getSessionWindowState(session, new Date(nowTick));
  const subject = exam?.subjects.find((s) => s.id === session.subjectId);
  const isLive = state === 'live';
  const statusLabel =
    state === 'live'
      ? 'Live now'
      : state === 'upcoming'
        ? 'Opens soon'
        : state === 'ended'
          ? 'Ended'
          : 'Locked';
  const statusClass =
    state === 'live'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800'
      : state === 'upcoming'
        ? 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800'
        : 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700';

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-900 ${
        isLive
          ? 'border-emerald-200 dark:border-emerald-800/60'
          : 'border-slate-200/90 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {dayLabel}
          </p>
          <h3 className="mt-1 line-clamp-2 text-lg font-black leading-snug tracking-tight text-slate-900 dark:text-white">
            {session.title}
          </h3>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-4">
        <div className="grid grid-cols-3 gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-orange-500" />
            <span className="truncate">{exam?.name || session.examId}</span>
          </span>
          <span className="inline-flex min-w-0 items-center justify-center rounded-lg bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span className="truncate">{subject?.name || 'All subjects'}</span>
          </span>
          <span className="inline-flex min-w-0 items-center justify-center rounded-lg bg-orange-50 px-2.5 py-2 text-xs font-black uppercase tracking-wide text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
            {session.mode}
          </span>
        </div>

        <div className="mt-auto grid gap-1.5 rounded-xl bg-slate-50/80 px-3 py-2.5 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <Timer className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Opens
            </span>
            <span className="min-w-0 truncate">{formatWindowLabel(session.startsAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Closes
            </span>
            <span className="min-w-0 truncate">{formatWindowLabel(session.endsAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-slate-100 px-5 py-3.5 dark:border-slate-800">
        <button
          type="button"
          disabled={!isLive}
          onClick={() => onLaunch(session)}
          className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
            isLive
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25 hover:bg-orange-500'
              : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
          }`}
        >
          {isLive ? (
            <>
              <Play className="h-4 w-4" /> Start exam
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              {state === 'upcoming' ? 'Not open yet' : 'Unavailable'}
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

export default function WeeklyTestsFlow({ onExamStateChange }: WeeklyTestsFlowProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<WeeklyExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [keepExamOpen, setKeepExamOpen] = useState(false);

  const weekKey = useMemo(() => getIsoWeekKeyIst(), []);
  const rawChallenge = searchParams.get('weeklySession') || searchParams.get('challenge');

  const activeSession = useMemo(() => {
    if (!rawChallenge) return null;
    const found = sessions.find((s) => s.id === rawChallenge);
    if (found) return found;
    if (!rawChallenge.startsWith('wes_')) return null;
    return null;
  }, [sessions, rawChallenge]);

  const weeklySessionId = activeSession?.id ?? null;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    void listPublishedForWeek(weekKey)
      .then((list) => {
        if (!alive) return;
        setSessions(dedupeWeekendSessions(list));
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Could not load weekly exams');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [weekKey]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!weeklySessionId) setKeepExamOpen(false);
  }, [weeklySessionId]);

  const launchSession = useCallback(
    (session: WeeklyExamSession) => {
      const state = getSessionWindowState(session, new Date(nowTick));
      if (state !== 'live') return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('weeklySession', session.id);
        next.set('challenge', session.id);
        next.set('exam', session.examId);
        if (session.subjectId) next.set('subject', session.subjectId);
        else next.delete('subject');
        next.set('step', session.subjectId ? (session.mode === 'pyq' ? 'paper' : 'subject') : 'exam');
        if (session.subjectId && session.mode === 'mock') {
          next.set('step', 'subject');
        }
        return next;
      });
    },
    [nowTick, setSearchParams],
  );

  const weekLabel = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    return start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, []);

  const saturday = sessions.find((s) => s.day === 'saturday') ?? null;
  const sunday = sessions.find((s) => s.day === 'sunday') ?? null;

  // Once launched, keep ExamFlow mounted even if the IST window ends mid-attempt.
  // Launch itself remains gated to live in launchSession / ExamFlow.
  const sessionLive =
    !!activeSession && getSessionWindowState(activeSession, new Date(nowTick)) === 'live';
  if (weeklySessionId && activeSession && (sessionLive || keepExamOpen)) {
    return (
      <ExamFlow
        isDashboardView
        onExamStateChange={(active) => {
          if (active) setKeepExamOpen(true);
          onExamStateChange?.(active);
        }}
        flowType="weekly"
        weeklySession={activeSession}
      />
    );
  }

  const nextOpen = sessions
    .map((s) => ({ s, state: getSessionWindowState(s, new Date(nowTick)) }))
    .filter((x) => x.state === 'upcoming')
    .sort((a, b) => a.s.startsAt.localeCompare(b.s.startsAt))[0];

  return (
    <div className="w-full space-y-5">
      <header className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-orange-50/80 to-white p-5 sm:p-6 dark:border-amber-900/30 dark:from-amber-950/40 dark:via-orange-950/25 dark:to-slate-900">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="mb-1.5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              Week of {weekLabel} · {weekKey}
            </p>
            <h2 className="font-display text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Weekly assessments
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm font-medium text-slate-600 dark:text-slate-300">
              Saturday &amp; Sunday exams published by admin. Open only in the live IST window.
            </p>
          </div>
          <div className="flex w-full items-center gap-3 rounded-xl border border-white/70 bg-white/80 px-4 py-3 lg:w-[260px] dark:border-white/10 dark:bg-slate-900/60">
            <Clock3 className="h-7 w-7 shrink-0 text-orange-500" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Weekend window
              </div>
              <div className="truncate text-sm font-black text-slate-900 dark:text-white">
                {nextOpen
                  ? `Opens ${formatWindowLabel(nextOpen.s.startsAt)}`
                  : sessions.some((s) => getSessionWindowState(s, new Date(nowTick)) === 'live')
                    ? 'Exams live now'
                    : 'No live exam right now'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <Lock className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">No weekend exam published</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
            An admin will publish Saturday and Sunday exams here. Check back this weekend.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-5">
          <WeekendSessionCard
            session={saturday}
            day="saturday"
            index={0}
            nowTick={nowTick}
            onLaunch={launchSession}
          />
          <WeekendSessionCard
            session={sunday}
            day="sunday"
            index={1}
            nowTick={nowTick}
            onLaunch={launchSession}
          />
        </div>
      )}
    </div>
  );
}
