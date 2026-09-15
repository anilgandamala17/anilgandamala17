/**
 * Centralized navigation for the landing Next.js app.
 * Tutor routes use same-origin navigation (proxied to Vite :5173).
 */

/** Navigate to a tutor-owned route on the unified origin. */
export function navigateToApp(path: string): void {
  if (typeof window === 'undefined') return
  const normalized = path.startsWith('/') ? path : `/${path}`
  window.location.assign(normalized)
}

/** Navigate to a landing-owned route (marketing, auth). */
export function navigateToLanding(path: string): void {
  if (typeof window === 'undefined') return
  const normalized = path.startsWith('/') ? path : `/${path}`
  window.location.assign(normalized)
}

/** Post-authentication destination navigation. */
export function navigateAfterAuth(path: string): void {
  navigateToApp(path)
}
