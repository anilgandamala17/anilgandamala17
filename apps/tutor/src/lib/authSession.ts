// FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md

import type { AppRole, User } from '../types';
import { studentRoutes, teacherRoutes, adminRoutes } from '../utils/routes';
import { readDemoSession } from './demoSession';

export function normalizeAppRole(role: unknown): AppRole {
  if (role === 'teacher' || role === 'admin') return role;
  return 'student';
}

/**
 * Post-auth login redirect target. Students always return to Mode Selection
 * so deep links never skip the mode picker after sign-in.
 */
export function loginReturnPathForRole(role: AppRole | null): string {
  if (role === 'teacher') return teacherRoutes.dashboard;
  if (role === 'admin') return adminRoutes.dashboard;
  return studentRoutes.modeSelection;
}

/**
 * Role home for in-app navigation.
 * Students: Mode Selection is the post-auth entry point.
 */
export function homeForRole(role: AppRole | null): string {
  if (role === 'teacher') return teacherRoutes.dashboard;
  if (role === 'admin') return adminRoutes.dashboard;
  return studentRoutes.modeSelection;
}

export async function fetchUserAppRole(uid: string): Promise<AppRole> {
  // FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md
  const session = readDemoSession();
  if (session?.uid === uid) return session.role;
  return 'student';
}

/** @deprecated Firebase mapping removed — kept for call-site compatibility. */
export function mapFirebaseUser(fb: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
  providerData?: Array<{ providerId: string }>;
  metadata?: { creationTime?: string };
}): User {
  const fallback = fb.email?.split('@')[0] || 'User';
  const providerId = fb.providerData?.[0]?.providerId ?? '';
  let authMethod: User['authMethod'] = 'email';
  if (providerId.includes('google')) authMethod = 'google';
  else if (providerId.includes('apple')) authMethod = 'apple';

  return {
    id: fb.uid,
    email: fb.email || '',
    name: fb.displayName || fallback,
    displayName: fb.displayName || fallback,
    avatar: fb.photoURL || undefined,
    authMethod,
    isVerified: true,
    createdAt: fb.metadata?.creationTime || new Date().toISOString(),
  };
}

const PROD_LANDING = 'https://aira-landing-page-elite.vercel.app';

export const TUTOR_STANDALONE_PORTS = [
  '5173',
  '5183',
  '4173',
  '5193',
  '5203',
  '5213',
  '5223',
] as const;

export interface LandingLoginOptions {
  signedOut?: boolean;
}

function isTutorStandalonePort(port: string): boolean {
  return (TUTOR_STANDALONE_PORTS as readonly string[]).includes(port);
}

export function getLandingOrigin(): string {
  const configured = (import.meta.env.VITE_LANDING_ORIGIN as string | undefined)?.replace(/\/$/, '') ?? '';
  if (configured) return configured;

  if (typeof window !== 'undefined') {
    const { hostname, port, origin } = window.location;
    const tutorStandalone =
      hostname.includes('ai-ra-app') ||
      isTutorStandalonePort(port);
    if (tutorStandalone) {
      return hostname === 'localhost' || hostname === '127.0.0.1'
        ? 'http://localhost:3010'
        : PROD_LANDING;
    }
    return origin;
  }

  return PROD_LANDING;
}

export function getLandingLoginUrl(returnPath: string, options: LandingLoginOptions = {}): string {
  const redirect = encodeURIComponent(returnPath || homeForRole('student'));
  const path = `/login?redirect=${redirect}${options.signedOut ? '&signedOut=1' : ''}`;

  if (typeof window !== 'undefined') {
    const { hostname, port } = window.location;
    const tutorStandalone =
      hostname.includes('ai-ra-app') ||
      isTutorStandalonePort(port);
    if (tutorStandalone || (import.meta.env.VITE_LANDING_ORIGIN as string | undefined)?.trim()) {
      return `${getLandingOrigin()}${path}`;
    }
  }

  return path;
}

export function redirectToLandingLogin(
  returnPath: string,
  options: LandingLoginOptions = {},
): void {
  const pathRole =
    typeof window !== 'undefined'
      ? returnPath.startsWith('/teacher')
        ? ('teacher' as const)
        : returnPath.startsWith('/admin')
          ? ('admin' as const)
          : returnPath.startsWith('/student')
            ? ('student' as const)
            : null
      : null;
  const normalized = pathRole === 'student' ? loginReturnPathForRole('student') : returnPath;
  window.location.assign(getLandingLoginUrl(normalized, options));
}

/** After logout: clear session and go to the marketing Landing Page (never login). */
export function redirectAfterSignOut(): void {
  const origin = getLandingOrigin();
  const port = typeof window !== 'undefined' ? window.location.port : '';
  const target =
    typeof window !== 'undefined' &&
    (isTutorStandalonePort(port) ||
      window.location.hostname.includes('ai-ra-app') ||
      Boolean((import.meta.env.VITE_LANDING_ORIGIN as string | undefined)?.trim()))
      ? `${origin}/`
      : '/';
  window.location.replace(target);
}

/** Demo mode: never require email verification. */
export function needsEmailVerification(_opts: {
  isDemo: boolean;
  isGuest: boolean;
  user: User | null;
}): boolean {
  return false;
}

export function getLandingVerifyEmailUrl(returnPath: string): string {
  const configured = (import.meta.env.VITE_LANDING_ORIGIN as string | undefined)?.replace(/\/$/, '') ?? '';
  const redirect = encodeURIComponent(returnPath || homeForRole('student'));
  const path = `/verify-email?redirect=${redirect}`;

  if (configured) return `${configured}${path}`;

  if (typeof window !== 'undefined') {
    const { hostname, port } = window.location;
    const tutorStandalone =
      hostname.includes('ai-ra-app') ||
      isTutorStandalonePort(port);
    if (tutorStandalone) {
      const fallback =
        hostname === 'localhost' || hostname === '127.0.0.1'
          ? 'http://localhost:3010'
          : PROD_LANDING;
      return `${fallback}${path}`;
    }
  }

  return path;
}

export function redirectToLandingVerifyEmail(returnPath: string): void {
  const normalized = returnPath.startsWith('/student')
    ? loginReturnPathForRole('student')
    : returnPath;
  window.location.assign(getLandingVerifyEmailUrl(normalized));
}
