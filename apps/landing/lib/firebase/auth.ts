// FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md
/**
 * Mock auth API matching the former Firebase auth surface used by login/signup/social.
 * Any email/password succeeds; session persists in localStorage.
 */

import { normalizeAppRole, type AppRole } from '@/lib/auth-redirect'
import { assertEmailQuality } from '@/lib/email-quality'
import { clearRoleHint, readRoleHint, writeRoleHint } from '@/lib/session-hints'
import { analytics, type AuthMethod } from '@/lib/analytics'
import {
  clearDemoSession,
  createDemoSession,
  readDemoSession,
  sessionToMockUser,
  writeDemoSession,
  type MockUser,
  type MockUserCredential,
} from '@/lib/mock-auth-session'
import { mockAdapter } from '@/lib/services/mockAdapter'

/**
 * FUTURE BACKEND:
 * POST /api/auth/login  { email, password, role } → { token, user }
 * POST /api/auth/signup { name, email, password, role, dateOfBirth? } → { token, user }
 * NOW: mockAdapter + localStorage demo session
 */

export type { MockUser as User }
export type { MockUserCredential as UserCredential }

/** Demo mode: accounts are always treated as verified. */
export function needsEmailVerification(_user: MockUser | null | undefined): boolean {
  return false
}

export async function sendVerificationEmail(): Promise<void> {
  // FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md
  console.info('[auth] FRONTEND-ONLY: verification email stubbed (Demo mode)')
}

export async function reloadCurrentUser(): Promise<MockUser | null> {
  const session = readDemoSession()
  return session ? sessionToMockUser(session) : null
}

export type SignUpInput = {
  name: string
  email: string
  password: string
  dateOfBirth?: string
  role?: AppRole
}

export async function requestWelcomeEmail(_user: MockUser, _name?: string): Promise<void> {
  // FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md
  console.info('[auth] FRONTEND-ONLY: welcome email stubbed (Backend not connected)')
}

export async function maybeSendWelcomeEmail(user: MockUser, name?: string): Promise<void> {
  await requestWelcomeEmail(user, name)
}

export async function retryWelcomeEmailIfPending(user: MockUser, name?: string): Promise<void> {
  await maybeSendWelcomeEmail(user, name)
}

export async function shouldRequestWelcomeEmail(_user: MockUser): Promise<boolean> {
  return false
}

export async function getUserAppRole(uid: string): Promise<AppRole> {
  const session = readDemoSession()
  if (session?.uid === uid) return session.role
  return readRoleHint() ?? 'student'
}

export async function resolveRoleForRedirect(
  uid: string,
  cachedRole: AppRole | null,
): Promise<AppRole> {
  const session = readDemoSession()
  if (session?.uid === uid) return session.role
  return cachedRole ?? 'student'
}

function persistLogin(input: {
  email: string
  displayName?: string
  role?: AppRole
  providerId?: string
  method: AuthMethod
  isNew: boolean
}): MockUserCredential {
  const session = createDemoSession({
    email: input.email,
    displayName: input.displayName,
    role: input.role,
    providerId: input.providerId,
  })
  writeDemoSession(session)
  writeRoleHint(session.role)
  if (input.isNew) analytics.signUp(input.method)
  else analytics.login(input.method)
  void analytics.setUser(session.uid)
  void analytics.setUserProperties({ user_role: session.role })
  return { user: sessionToMockUser(session) }
}

export async function signUpWithEmail(input: SignUpInput): Promise<MockUserCredential> {
  const email = assertEmailQuality(input.email)
  void input.password
  void input.dateOfBirth
  analytics.signupStarted('email')
  const role =
    normalizeAppRole(input.role) === 'admin' ? 'student' : normalizeAppRole(input.role)
  await mockAdapter.signup({
    name: input.name.trim(),
    email,
    password: input.password,
    role,
    dateOfBirth: input.dateOfBirth,
  })
  return persistLogin({
    email,
    displayName: input.name.trim(),
    role,
    providerId: 'password',
    method: 'email',
    isNew: true,
  })
}

export async function signInWithEmail(
  email: string,
  password: string,
  roleOverride?: AppRole,
): Promise<MockUserCredential> {
  const normalized = assertEmailQuality(email)
  void password
  analytics.loginStarted('email')
  const existing = readDemoSession()
  const displayName =
    existing?.email === normalized ? existing.displayName : normalized.split('@')[0]
  const role =
    roleOverride != null
      ? normalizeAppRole(roleOverride) === 'admin'
        ? 'student'
        : normalizeAppRole(roleOverride)
      : existing?.email === normalized
        ? existing.role
        : readRoleHint() ?? 'student'
  await mockAdapter.login({ email: normalized, password, role })
  return persistLogin({
    email: normalized,
    displayName,
    role,
    providerId: 'password',
    method: 'email',
    isNew: false,
  })
}

async function mockOAuth(providerKey: 'google' | 'apple' | 'microsoft'): Promise<MockUserCredential> {
  const method = providerKey as AuthMethod
  analytics.loginStarted(method)
  const labels: Record<typeof providerKey, { email: string; name: string; providerId: string }> = {
    google: { email: 'demo.google@aira.local', name: 'Google Demo', providerId: 'google.com' },
    apple: { email: 'demo.apple@aira.local', name: 'Apple Demo', providerId: 'apple.com' },
    microsoft: {
      email: 'demo.microsoft@aira.local',
      name: 'Microsoft Demo',
      providerId: 'microsoft.com',
    },
  }
  const picked = labels[providerKey]
  const hinted = readRoleHint()
  const role = hinted === 'teacher' ? 'teacher' : 'student'
  await mockAdapter.login({ email: picked.email, password: 'oauth', role })
  return persistLogin({
    email: picked.email,
    displayName: picked.name,
    role,
    providerId: picked.providerId,
    method,
    isNew: false,
  })
}

export async function signInWithGoogle(): Promise<MockUserCredential> {
  return mockOAuth('google')
}

export async function signInWithMicrosoft(): Promise<MockUserCredential> {
  return mockOAuth('microsoft')
}

export async function signInWithApple(): Promise<MockUserCredential> {
  return mockOAuth('apple')
}

/**
 * Demo phone auth: any valid-looking number + any 6-digit OTP succeeds.
 * FUTURE BACKEND: Firebase Phone Auth / SMS OTP verification.
 */
export async function signInWithPhone(
  phone: string,
  otp: string,
): Promise<MockUserCredential> {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) {
    throw new Error('Enter a valid phone number with at least 10 digits.')
  }
  const code = otp.replace(/\D/g, '')
  if (code.length !== 6) {
    throw new Error('Enter the 6-digit verification code.')
  }
  analytics.loginStarted('phone')
  const last4 = digits.slice(-4)
  const email = `demo.phone.${last4}@aira.local`
  const hinted = readRoleHint()
  const role = hinted === 'teacher' ? 'teacher' : 'student'
  await mockAdapter.login({ email, password: 'phone-otp', role })
  return persistLogin({
    email,
    displayName: `Phone ···${last4}`,
    role,
    providerId: 'phone',
    method: 'phone',
    isNew: false,
  })
}

/** Demo: pretend an SMS OTP was sent (no network). */
export async function sendPhoneOtp(phone: string): Promise<void> {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) {
    throw new Error('Enter a valid phone number with at least 10 digits.')
  }
  // FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md
  console.info(
    '[auth] FRONTEND-ONLY: phone OTP stubbed (Demo mode — use any 6-digit code)',
  )
}

export async function resetPassword(email: string): Promise<void> {
  assertEmailQuality(email)
  // FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md
  console.info('[auth] FRONTEND-ONLY: password reset stubbed (Demo mode — Backend not connected)')
}

export async function logOut(): Promise<void> {
  clearDemoSession()
  clearRoleHint()
  analytics.logout()
}
