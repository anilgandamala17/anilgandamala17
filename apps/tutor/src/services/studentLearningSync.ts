// FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md
/**
 * Local-only student learning sync. Never imports or calls Firestore.
 */
import type { CurriculumProgress, SessionAnalytics } from '../types';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { useCurriculumStore } from '../stores/curriculumStore';
import {
  beginRemoteLearningApply,
  endRemoteLearningApply,
  registerStudentLearningFlush,
} from './studentLearningNotify';

export const LEARNING_DOC_ID = 'state';
export const MAX_SYNCED_SESSIONS = 80;

export type StudentLearningState = {
  progressMap: Record<string, CurriculumProgress>;
  sessions: SessionAnalytics[];
  likedTopicIds: string[];
  updatedAt: string;
};

const LOCAL_PREFIX = 'aira-student-learning-';

let activeOwnerKey: string | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;

/** Always false — cloud/Firestore learning sync is disabled in frontend-only mode. */
export function isCloudLearningUid(_input: {
  userId?: string | null;
  isGuest?: boolean;
  isDemo?: boolean;
}): boolean {
  return false;
}

export function learningOwnerKey(input: {
  userId?: string | null;
  isGuest?: boolean;
  isDemo?: boolean;
}): string {
  const id = input.userId?.trim() || '';
  if (!id) return 'anon';
  if (input.isGuest || id.startsWith('guest_')) return 'guest';
  if (input.isDemo || id.startsWith('demo_')) return `demo:${id}`;
  return id;
}

function localKey(owner: string): string {
  return `${LOCAL_PREFIX}${owner}`;
}

function sanitizeState(raw: Partial<StudentLearningState> | null | undefined): StudentLearningState {
  const progressMap =
    raw?.progressMap && typeof raw.progressMap === 'object' && !Array.isArray(raw.progressMap)
      ? (raw.progressMap as Record<string, CurriculumProgress>)
      : {};
  const sessions = Array.isArray(raw?.sessions)
    ? raw!.sessions
        .filter((s) => s && typeof s.sessionId === 'string' && typeof s.topicId === 'string')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-MAX_SYNCED_SESSIONS)
    : [];
  const likedTopicIds = Array.isArray(raw?.likedTopicIds)
    ? [...new Set(raw!.likedTopicIds.filter((id) => typeof id === 'string' && id))]
    : [];
  return {
    progressMap,
    sessions,
    likedTopicIds,
    updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

function readLocal(owner: string): StudentLearningState | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(localKey(owner));
    if (!raw) return null;
    return sanitizeState(JSON.parse(raw) as Partial<StudentLearningState>);
  } catch {
    return null;
  }
}

function writeLocal(owner: string, state: StudentLearningState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(localKey(owner), JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

function snapshotFromStores(): StudentLearningState {
  return sanitizeState({
    progressMap: useCurriculumStore.getState().progressMap,
    sessions: useAnalyticsStore.getState().sessions,
    likedTopicIds: useCurriculumStore.getState().likedTopicIds,
    updatedAt: new Date().toISOString(),
  });
}

function applyToStores(state: StudentLearningState): void {
  beginRemoteLearningApply();
  try {
    useCurriculumStore.getState().applyLearningProgress(state.progressMap, state.likedTopicIds);
    useAnalyticsStore.getState().replaceSessions(state.sessions);
  } finally {
    endRemoteLearningApply();
  }
}

function resetStores(): void {
  beginRemoteLearningApply();
  try {
    useCurriculumStore.getState().resetLearningData();
    useAnalyticsStore.getState().resetSessions();
  } finally {
    endRemoteLearningApply();
  }
}

function flushNow(): void {
  if (!activeOwnerKey) return;
  const state = snapshotFromStores();
  writeLocal(activeOwnerKey, state);
}

function scheduleFlush(): void {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = null;
    flushNow();
  }, 400);
}

registerStudentLearningFlush(scheduleFlush);

export function stopStudentLearningSync(): void {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
    flushNow();
  }
  activeOwnerKey = null;
  resetStores();
}

/**
 * Bind Zustand learning stores to uid-scoped localStorage only (no cloud).
 */
export function startStudentLearningSync(input: {
  userId?: string | null;
  isGuest?: boolean;
  isDemo?: boolean;
}): void {
  const owner = learningOwnerKey(input);

  if (owner === activeOwnerKey) {
    return;
  }

  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }

  activeOwnerKey = owner;
  resetStores();

  const cached = readLocal(owner);
  if (cached) applyToStores(cached);
}
