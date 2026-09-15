/**
 * Auth service façade used by login / signup / social UI.
 *
 * FUTURE BACKEND:
 * POST /api/auth/login   { email, password, role } → { token, user }
 * POST /api/auth/signup  { name, email, password, role, dateOfBirth? } → { token, user }
 * POST /api/auth/logout
 * NOW: mockAdapter + localStorage demo session (lib/firebase/auth.ts)
 *
 * Prefer importing from here in new code. Existing `@/lib/firebase/auth` re-exports
 * remain for compatibility.
 */

export {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithApple,
  signInWithMicrosoft,
  logOut,
  resetPassword,
  resolveRoleForRedirect,
  getUserAppRole,
  needsEmailVerification,
  sendVerificationEmail,
  reloadCurrentUser,
  retryWelcomeEmailIfPending,
  type SignUpInput,
  type User,
  type UserCredential,
} from '@/lib/firebase/auth'
