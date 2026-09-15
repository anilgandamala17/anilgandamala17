// FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md
/** Former Firebase client bootstrap — no-ops in demo mode. */

export async function ensureAuthReady(): Promise<null> {
  return null
}

export function getFirebaseAuth(): null {
  return null
}

export async function initFirebaseAnalytics(): Promise<null> {
  return null
}
