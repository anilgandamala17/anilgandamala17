/**
 * Weekly exam schedule service.
 *
 * FUTURE BACKEND:
 * GET  /api/weekly-exams → WeeklyExamSession[]
 * POST /api/weekly-exams → create/update (admin)
 * NOW: static `/weekly-exam-schedules.json` + localStorage (Firestore client is null in demo)
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import type {
  WeeklyExamDay,
  WeeklyExamSession,
  WeeklyExamSessionInput,
  WeeklyExamStatus,
  WeeklyExamWindowState,
} from '@/types/weeklyExam';

export const WEEKLY_EXAM_COLLECTION = 'weeklyExamSchedules';
const LOCAL_KEY = 'aira-weekly-exam-schedules-v1';
const IST = 'Asia/Kolkata';
const FIRESTORE_TIMEOUT_MS = 8000;

async function fetchStaticSeed(all = false): Promise<WeeklyExamSession[]> {
  try {
    const res = await fetch('/weekly-exam-schedules.json', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as WeeklyExamSession[];
    if (!Array.isArray(data)) return [];
    const list = data.map((s) => normalizeSession(s as unknown as Record<string, unknown>, s.id));
    return all ? list : list.filter((s) => s.status === 'published');
  } catch {
    return [];
  }
}

async function fetchJsonStore(all = false): Promise<WeeklyExamSession[]> {
  // FRONTEND-ONLY: backend call removed, see EXTRACTION_REPORT.md
  // Former: GET /api/weekly-exams — use static seed + Firestore client only.
  return fetchStaticSeed(all)
}

async function postJsonStore(_session: WeeklyExamSession): Promise<boolean> {
  // FRONTEND-ONLY: POST /api/weekly-exams removed
  console.info('[weeklyExamSchedule] FRONTEND-ONLY: weekly-exams API stubbed')
  return false
}

function assertAdmin(): void {
  const { role } = useAuthStore.getState();
  if (role !== 'admin') {
    throw new Error('Only admins can manage weekly exam schedules.');
  }
}

function withTimeout<T>(promise: Promise<T>, ms = FIRESTORE_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Firestore operation timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/** Shorter budget when JSON/API already returned sessions — keep the weekly tab snappy. */
const FIRESTORE_LIST_FAST_MS = 2500;

function nowIso(): string {
  return new Date().toISOString();
}

/** Format a Date as YYYY-MM-DD in IST. */
export function formatDateInIst(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Parts of "now" in IST. */
export function getIstParts(date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
} {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === '24' ? '0' : parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: parts.weekday || '',
  };
}

/**
 * Build an ISO UTC string for an IST civil datetime.
 * Example: istToUtcIso(2026, 8, 9, 0, 0, 0) → Saturday Aug 9 2026 00:00 IST
 */
export function istToUtcIso(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): string {
  const asUtcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  return new Date(asUtcGuess - (5 * 60 + 30) * 60 * 1000).toISOString();
}

/** Robust ISO week key for an IST civil Y-M-D (Mon-based ISO weeks). */
export function getIsoWeekKeyFromIstCivil(year: number, month: number, day: number): string {
  const target = new Date(Date.UTC(year, month - 1, day));
  // ISO: Monday = 0 … Sunday = 6
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const isoYear = target.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);
  const weekNo = 1 + Math.round((target.getTime() - firstThursday.getTime()) / 604800000);
  return `${isoYear}-W${String(weekNo).padStart(2, '0')}`;
}

/** ISO week key in IST for a Date, e.g. "2026-W32". */
export function getIsoWeekKeyIst(date = new Date()): string {
  const parts = getIstParts(date);
  return getIsoWeekKeyFromIstCivil(parts.year, parts.month, parts.day);
}

/** Derive week key from a UTC ISO timestamp using its IST calendar day. */
export function getIsoWeekKeyFromUtcIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return getIsoWeekKeyIst();
  const parts = getIstParts(d);
  return getIsoWeekKeyFromIstCivil(parts.year, parts.month, parts.day);
}

/** Next Saturday and Sunday (IST civil dates) for the week containing `date`. */
export function getWeekendDatesIst(date = new Date()): {
  saturday: { y: number; m: number; d: number };
  sunday: { y: number; m: number; d: number };
} {
  const parts = getIstParts(date);
  const utcNoon = Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0);
  const ref = new Date(utcNoon);
  const dow = ref.getUTCDay(); // 0 Sun … 6 Sat
  const toSat = dow === 6 ? 0 : dow === 0 ? -1 : 6 - dow;
  const sat = new Date(ref);
  sat.setUTCDate(ref.getUTCDate() + toSat);
  const sun = new Date(sat);
  sun.setUTCDate(sat.getUTCDate() + 1);
  return {
    saturday: { y: sat.getUTCFullYear(), m: sat.getUTCMonth() + 1, d: sat.getUTCDate() },
    sunday: { y: sun.getUTCFullYear(), m: sun.getUTCMonth() + 1, d: sun.getUTCDate() },
  };
}

export function defaultWeekendWindowsIst(date = new Date()): {
  saturday: { startsAt: string; endsAt: string };
  sunday: { startsAt: string; endsAt: string };
  weekKey: string;
} {
  const { saturday, sunday } = getWeekendDatesIst(date);
  return {
    weekKey: getIsoWeekKeyFromIstCivil(saturday.y, saturday.m, saturday.d),
    saturday: {
      startsAt: istToUtcIso(saturday.y, saturday.m, saturday.d, 0, 0, 0),
      endsAt: istToUtcIso(saturday.y, saturday.m, saturday.d, 23, 59, 59),
    },
    sunday: {
      startsAt: istToUtcIso(sunday.y, sunday.m, sunday.d, 0, 0, 0),
      endsAt: istToUtcIso(sunday.y, sunday.m, sunday.d, 23, 59, 59),
    },
  };
}

export function getSessionWindowState(
  session: Pick<WeeklyExamSession, 'startsAt' | 'endsAt' | 'status'>,
  now = new Date(),
): WeeklyExamWindowState {
  if (session.status !== 'published') return 'locked';
  const t = now.getTime();
  const start = new Date(session.startsAt).getTime();
  const end = new Date(session.endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 'locked';
  if (t < start) return 'upcoming';
  if (t > end) return 'ended';
  return 'live';
}

export function isSessionLive(session: WeeklyExamSession, now = new Date()): boolean {
  return getSessionWindowState(session, now) === 'live';
}

function readLocal(): WeeklyExamSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WeeklyExamSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(sessions: WeeklyExamSession[]): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(sessions));
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[weeklyExam] localStorage write failed', err);
    }
  }
}

function saveLocalSession(session: WeeklyExamSession): void {
  const local = readLocal().filter((s) => s.id !== session.id);
  local.push(session);
  writeLocal(local);
}

function normalizeSession(data: Record<string, unknown>, id: string): WeeklyExamSession {
  const startsAt = String(data.startsAt || '');
  const weekKey =
    String(data.weekKey || '') ||
    (startsAt ? getIsoWeekKeyFromUtcIso(startsAt) : getIsoWeekKeyIst());
  return {
    id,
    weekKey,
    day: (data.day === 'sunday' ? 'sunday' : 'saturday') as WeeklyExamDay,
    title: String(data.title || 'Weekly Exam'),
    examId: String(data.examId || 'jee-main'),
    subjectId: data.subjectId ? String(data.subjectId) : undefined,
    mode: data.mode === 'pyq' ? 'pyq' : 'mock',
    startsAt,
    endsAt: String(data.endsAt || ''),
    status: (['draft', 'published', 'archived'].includes(String(data.status))
      ? data.status
      : 'draft') as WeeklyExamStatus,
    createdBy: String(data.createdBy || 'unknown'),
    updatedAt: String(data.updatedAt || nowIso()),
  };
}

/** Firestore rejects `undefined` field values. */
function toFirestorePayload(session: WeeklyExamSession): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: session.id,
    weekKey: session.weekKey,
    day: session.day,
    title: session.title,
    examId: session.examId,
    mode: session.mode,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    status: session.status,
    createdBy: session.createdBy,
    updatedAt: session.updatedAt,
  };
  if (session.subjectId) payload.subjectId = session.subjectId;
  return payload;
}

async function tryFirestoreWrite(session: WeeklyExamSession): Promise<boolean> {
  if (!db) return false
  try {
    await withTimeout(
      setDoc(doc(db, WEEKLY_EXAM_COLLECTION, session.id), toFirestorePayload(session), {
        merge: true,
      }),
    );
    return true;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[weeklyExam] Firestore write failed, using local fallback', err);
    }
    return false;
  }
}

async function tryFirestoreListAll(): Promise<WeeklyExamSession[] | null> {
  if (!db) return null
  // Frontend-only: auth is null — use published public query only.
  void auth
  try {
    const q = query(collection(db, WEEKLY_EXAM_COLLECTION), where('status', '==', 'published'));
    const snap = await withTimeout(getDocs(q));
    return snap.docs.map((d) => normalizeSession(d.data() as Record<string, unknown>, d.id));
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[weeklyExam] Firestore published list failed', err);
    }
    return null;
  }
}

async function tryFirestoreListPublished(
  weekKey: string,
  timeoutMs = FIRESTORE_TIMEOUT_MS,
): Promise<WeeklyExamSession[] | null> {
  if (!db) return null
  try {
    // Prefer week-scoped query; fall back if composite index is missing.
    let snap;
    try {
      const scoped = query(
        collection(db, WEEKLY_EXAM_COLLECTION),
        where('status', '==', 'published'),
        where('weekKey', '==', weekKey),
      );
      snap = await withTimeout(getDocs(scoped), timeoutMs);
    } catch {
      const broad = query(
        collection(db, WEEKLY_EXAM_COLLECTION),
        where('status', '==', 'published'),
      );
      snap = await withTimeout(getDocs(broad), timeoutMs);
    }
    const all = snap.docs.map((d) => normalizeSession(d.data() as Record<string, unknown>, d.id));
    return filterSessionsForStudentWeek(all, weekKey);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[weeklyExam] Firestore published list failed', err);
    }
    return null;
  }
}

/**
 * Show sessions for the student weekly tab:
 * - matching weekKey, OR
 * - start date falls in that ISO week (fixes bad manual week keys), OR
 * - currently live / upcoming within the next 7 days
 */
export function filterSessionsForStudentWeek(
  sessions: WeeklyExamSession[],
  weekKey: string,
  now = new Date(),
): WeeklyExamSession[] {
  const nowMs = now.getTime();
  const weekAhead = nowMs + 7 * 24 * 60 * 60 * 1000;
  return sessions.filter((s) => {
    if (s.status !== 'published') return false;
    if (s.weekKey === weekKey) return true;
    if (s.startsAt && getIsoWeekKeyFromUtcIso(s.startsAt) === weekKey) return true;
    const state = getSessionWindowState(s, now);
    if (state === 'live') return true;
    if (state === 'upcoming') {
      const start = Date.parse(s.startsAt);
      return !Number.isNaN(start) && start <= weekAhead;
    }
    return false;
  });
}

function sortByUpdatedDesc(sessions: WeeklyExamSession[]): WeeklyExamSession[] {
  return [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function mergeById(
  local: WeeklyExamSession[],
  remote: WeeklyExamSession[],
): WeeklyExamSession[] {
  const byId = new Map<string, WeeklyExamSession>();
  for (const s of remote) byId.set(s.id, s);
  for (const s of local) {
    const existing = byId.get(s.id);
    if (!existing || s.updatedAt >= existing.updatedAt) byId.set(s.id, s);
  }
  return [...byId.values()];
}

export async function listAllForAdmin(): Promise<WeeklyExamSession[]> {
  assertAdmin();
  const local = readLocal();
  const [remote, jsonStore] = await Promise.all([tryFirestoreListAll(), fetchJsonStore(true)]);
  let merged = local;
  if (jsonStore.length) merged = mergeById(merged, jsonStore);
  if (remote) merged = mergeById(merged, remote);
  return sortByUpdatedDesc(merged);
}

export async function listPublishedForWeek(weekKey: string): Promise<WeeklyExamSession[]> {
  const local = filterSessionsForStudentWeek(
    readLocal().filter((s) => s.status === 'published'),
    weekKey,
  );
  // Resolve JSON/API first so the UI is not blocked on a slow/hung Firestore.
  const jsonStore = filterSessionsForStudentWeek(await fetchJsonStore(false), weekKey);
  const remote = await tryFirestoreListPublished(
    weekKey,
    jsonStore.length || local.length ? FIRESTORE_LIST_FAST_MS : FIRESTORE_TIMEOUT_MS,
  );

  let merged: WeeklyExamSession[];
  if (remote) {
    // Firestore responded (including an empty unpublished week) — do not keep stale local papers.
    merged = remote;
  } else {
    merged = local;
    if (jsonStore.length) merged = mergeById(merged, jsonStore);
  }

  return merged.sort(
    (a, b) => a.day.localeCompare(b.day) || a.startsAt.localeCompare(b.startsAt),
  );
}

export async function getSessionById(id: string): Promise<WeeklyExamSession | null> {
  const localHit = readLocal().find((s) => s.id === id) ?? null;
  if (db) {
    try {
      const snap = await withTimeout(getDoc(doc(db, WEEKLY_EXAM_COLLECTION, id)));
      if (snap.exists()) {
        const remote = normalizeSession(snap.data() as Record<string, unknown>, snap.id);
        if (!localHit || remote.updatedAt >= localHit.updatedAt) return remote;
        return localHit;
      }
    } catch {
      /* fall through */
    }
  }

  try {
    const fromStore = await fetchJsonStore(true);
    const hit = fromStore.find((s) => s.id === id) ?? null;
    if (hit) {
      if (!localHit || hit.updatedAt >= localHit.updatedAt) return hit;
      return localHit;
    }
  } catch {
    /* fall through */
  }

  return localHit;
}

export async function upsertSession(input: WeeklyExamSessionInput): Promise<WeeklyExamSession> {
  assertAdmin();
  const { user, isDemo } = useAuthStore.getState();

  const startsAt = input.startsAt;
  const endsAt = input.endsAt;
  if (!startsAt || !endsAt || Number.isNaN(Date.parse(startsAt)) || Number.isNaN(Date.parse(endsAt))) {
    throw new Error('Start and end times are required.');
  }
  if (Date.parse(endsAt) <= Date.parse(startsAt)) {
    throw new Error('End time must be after start time.');
  }
  if (!input.title.trim()) {
    throw new Error('Title is required.');
  }
  if (!input.examId) {
    throw new Error('Exam is required.');
  }

  // Always derive week key from the start time so students (current week) can find it
  const weekKey = getIsoWeekKeyFromUtcIso(startsAt);

  const id = input.id || `wes_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const existing = input.id ? await getSessionById(input.id) : null;
  const session: WeeklyExamSession = {
    id,
    weekKey,
    day: input.day,
    title: input.title.trim() || 'Weekly Exam',
    examId: input.examId,
    subjectId: input.subjectId || undefined,
    mode: input.mode,
    startsAt,
    endsAt,
    status: input.status,
    createdBy: input.createdBy || existing?.createdBy || user?.id || (isDemo ? 'demo-admin' : 'admin'),
    updatedAt: nowIso(),
  };

  saveLocalSession(session);
  const [remoteOk, apiOk] = await Promise.all([tryFirestoreWrite(session), postJsonStore(session)]);
  if (!remoteOk && !apiOk && session.status === 'published') {
    throw new Error(
      'Saved on this device, but cloud sync failed. Check your connection and click Update/Publish again so students on the live site can see this exam.',
    );
  }
  return session;
}

export async function publishSession(id: string): Promise<WeeklyExamSession> {
  assertAdmin();
  const existing = await getSessionById(id);
  if (!existing) throw new Error('Session not found');
  return upsertSession({ ...existing, status: 'published' });
}

export async function unpublishSession(id: string): Promise<WeeklyExamSession> {
  assertAdmin();
  const existing = await getSessionById(id);
  if (!existing) throw new Error('Session not found');
  return upsertSession({ ...existing, status: 'draft' });
}

export async function archiveSession(id: string): Promise<WeeklyExamSession> {
  assertAdmin();
  const existing = await getSessionById(id);
  if (!existing) throw new Error('Session not found');
  return upsertSession({ ...existing, status: 'archived' });
}

export function getActiveSessions(
  sessions: WeeklyExamSession[],
  now = new Date(),
): WeeklyExamSession[] {
  return sessions.filter((s) => isSessionLive(s, now));
}

/** Seed Sat + Sun published sessions for the current IST weekend (admin only). */
export async function seedThisWeekendDefaults(): Promise<WeeklyExamSession[]> {
  assertAdmin();
  const windows = defaultWeekendWindowsIst();
  const existing = await listAllForAdmin();
  const forWeek = existing.filter((s) => s.weekKey === windows.weekKey && s.status !== 'archived');

  const ensure = async (
    day: WeeklyExamDay,
    title: string,
    examId: string,
    subjectId: string,
    mode: 'mock' | 'pyq',
    range: { startsAt: string; endsAt: string },
  ) => {
    const found = forWeek.find((s) => s.day === day);
    if (found) {
      return upsertSession({
        ...found,
        title,
        examId,
        subjectId,
        mode,
        startsAt: range.startsAt,
        endsAt: range.endsAt,
        status: 'published',
      });
    }
    return upsertSession({
      weekKey: windows.weekKey,
      day,
      title,
      examId,
      subjectId,
      mode,
      startsAt: range.startsAt,
      endsAt: range.endsAt,
      status: 'published',
    });
  };

  const sat = await ensure(
    'saturday',
    'Saturday Weekly Mock',
    'jee-main',
    'phy',
    'mock',
    windows.saturday,
  );
  const sun = await ensure(
    'sunday',
    'Sunday Weekly PYQ',
    'neet',
    'bot',
    'pyq',
    windows.sunday,
  );
  return [sat, sun];
}

/** Duplicate published sessions from a weekKey into the next ISO week. */
export async function duplicateWeekToNext(fromWeekKey: string): Promise<WeeklyExamSession[]> {
  assertAdmin();
  const all = await listAllForAdmin();
  const source = all.filter((s) => {
    const key = s.weekKey || getIsoWeekKeyFromUtcIso(s.startsAt);
    return key === fromWeekKey && s.status === 'published';
  });
  if (!source.length) throw new Error('No published sessions to duplicate for that week.');

  const nextDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const windows = defaultWeekendWindowsIst(nextDate);
  const created: WeeklyExamSession[] = [];

  for (const s of source) {
    const range = s.day === 'saturday' ? windows.saturday : windows.sunday;
    created.push(
      await upsertSession({
        weekKey: windows.weekKey,
        day: s.day,
        title: s.title,
        examId: s.examId,
        subjectId: s.subjectId,
        mode: s.mode,
        startsAt: range.startsAt,
        endsAt: range.endsAt,
        status: 'draft',
      }),
    );
  }
  return created;
}

export function formatWindowLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
