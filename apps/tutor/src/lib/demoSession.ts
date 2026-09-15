// FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md
/**
 * Shared demo session key with Landing (same origin via Next rewrite / proxy).
 */

import type { AppRole, User } from '../types';

export const DEMO_SESSION_KEY = 'aira:demo-session';
export const DEMO_SESSION_EVENT = 'aira:demo-session-changed';

function normalizeAppRole(role: unknown): AppRole {
  if (role === 'teacher' || role === 'admin') return role;
  return 'student';
}

export type DemoSession = {
  uid: string;
  email: string;
  displayName: string;
  role: AppRole;
  emailVerified: true;
  photoURL: string | null;
  providerId: string;
  createdAt: string;
};

function safeParse(raw: string | null): DemoSession | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<DemoSession>;
    if (!data || typeof data.uid !== 'string' || typeof data.email !== 'string') return null;
    return {
      uid: data.uid,
      email: data.email,
      displayName:
        typeof data.displayName === 'string' ? data.displayName : data.email.split('@')[0],
      role: normalizeAppRole(data.role),
      emailVerified: true,
      photoURL: data.photoURL ?? null,
      providerId: typeof data.providerId === 'string' ? data.providerId : 'password',
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function readDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null;
  try {
    return safeParse(window.localStorage.getItem(DEMO_SESSION_KEY));
  } catch {
    return null;
  }
}

export function writeDemoSession(session: DemoSession): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new Event(DEMO_SESSION_EVENT));
  } catch {
    /* ignore */
  }
}

export function clearDemoSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new Event(DEMO_SESSION_EVENT));
  } catch {
    /* ignore */
  }
}

export function mapDemoSessionToUser(session: DemoSession): User {
  let authMethod: User['authMethod'] = 'email';
  if (session.providerId.includes('google')) authMethod = 'google';
  else if (session.providerId.includes('apple')) authMethod = 'apple';

  return {
    id: session.uid,
    email: session.email,
    name: session.displayName,
    displayName: session.displayName,
    avatar: session.photoURL || undefined,
    authMethod,
    isVerified: true,
    createdAt: session.createdAt,
  };
}

export function subscribeDemoSession(listener: (session: DemoSession | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const notify = () => listener(readDemoSession());
  const onStorage = (e: StorageEvent) => {
    if (e.key === DEMO_SESSION_KEY || e.key === null) notify();
  };
  window.addEventListener(DEMO_SESSION_EVENT, notify);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(DEMO_SESSION_EVENT, notify);
    window.removeEventListener('storage', onStorage);
  };
}

export function createDemoSession(input: {
  email: string;
  displayName?: string;
  role?: AppRole;
  providerId?: string;
}): DemoSession {
  const email = input.email.trim().toLowerCase();
  const role = normalizeAppRole(input.role);
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (Math.imul(31, hash) + email.charCodeAt(i)) | 0;
  }
  return {
    uid: `demo_${Math.abs(hash).toString(36)}_${email.length}`,
    email,
    displayName: input.displayName?.trim() || email.split('@')[0] || 'Demo Student',
    role,
    emailVerified: true,
    photoURL: null,
    providerId: input.providerId ?? 'password',
    createdAt: new Date().toISOString(),
  };
}
