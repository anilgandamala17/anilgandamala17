/** Map Firebase Auth error codes to human-readable copy. */

export function getAuthErrorCode(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string'
  ) {
    return (err as { code: string }).code
  }
  return ''
}

export function mapAuthError(err: unknown, providerKey?: string): string {
  const code = getAuthErrorCode(err)
  const providerLabel =
    providerKey === 'apple'
      ? 'Apple'
      : providerKey === 'microsoft'
        ? 'Microsoft'
        : providerKey === 'google'
          ? 'Google'
          : null

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support for help.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password. Please try again.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/invalid-continue-uri':
    case 'auth/unauthorized-continue-uri':
      return 'Email verification could not be sent because this site is not authorized yet. Add the domain in Firebase Authentication → Settings → Authorized domains.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled. You can try again anytime.'
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Allow pop-ups for this site, then try again.'
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method. Try that method instead.'
    case 'auth/operation-not-allowed':
      if (providerLabel) {
        return `${providerLabel} sign-in is not fully configured in Firebase yet. In Firebase Console → Authentication → Sign-in method → ${providerLabel}, enable it and add the required OAuth credentials (for Apple: Services ID, Team ID, Key ID, and private key).`
      }
      return 'This sign-in method is not enabled in Firebase Console. Enable Email/Password or the social provider under Authentication → Sign-in method.'
    case 'auth/unauthorized-domain': {
      const host =
        typeof window !== 'undefined' ? window.location.hostname : 'this site'
      if (host === '127.0.0.1') {
        return 'Redirecting to localhost for sign-in… If this persists, reload using http://localhost:3000 instead of 127.0.0.1.'
      }
      return `Sign-in is not enabled for "${host}" yet. Run "pnpm auth:sync-domains" once (see README) or add this domain in Firebase Console → Authentication → Settings → Authorized domains.`
    }
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.'
    case 'auth/missing-email':
      return 'Please enter your email address.'
    case 'auth/internal-error':
      return 'Sign-in failed due to a configuration issue. Confirm Email/Password or Google is enabled in Firebase Authentication.'
    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not set up for this project yet. Enable it in the Firebase Console.'
    default: {
      // Surface useful Firebase messages when code is missing
      if (typeof err === 'object' && err !== null && 'message' in err) {
        const raw = String((err as { message: unknown }).message)
        if (raw.includes('CONFIGURATION_NOT_FOUND')) {
          return 'Firebase Authentication is not set up for this project yet. Enable it in the Firebase Console.'
        }
        if (raw.includes('unauthorized-domain') || raw.includes('UNAUTHORIZED_DOMAIN')) {
          return 'This domain is not authorized. Add it under Firebase Authentication → Settings → Authorized domains.'
        }
      }
      if (err instanceof Error && err.message && !err.message.startsWith('Firebase:')) {
        return err.message
      }
      console.warn('[auth]', code || 'unknown')
      return 'Something went wrong signing in. Please try again.'
    }
  }
}
