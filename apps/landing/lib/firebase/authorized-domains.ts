/** Hostnames that must appear in Firebase Auth → Settings → Authorized domains. */

export const FIREBASE_PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'aira-landingpage'

/** Always keep Firebase defaults plus every hostname this app is served from. */
export const REQUIRED_AUTH_DOMAINS = [
  'localhost',
  '127.0.0.1',
  `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
  `${FIREBASE_PROJECT_ID}.web.app`,
  // Production & preview deployments
  'aira-landing-page-elite.vercel.app',
  process.env.VERCEL_URL,
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
  process.env.NEXT_PUBLIC_VERCEL_URL,
]
  .filter((d): d is string => typeof d === 'string' && d.length > 0)
  .map((d) => d.toLowerCase())

export function normalizeHostname(host: string): string {
  return host.split(':')[0]?.toLowerCase() ?? host.toLowerCase()
}

/** Dev-only hostnames that should redirect to localhost (Firebase allows localhost by default). */
export const REDIRECT_TO_LOCALHOST_HOSTS = new Set(['127.0.0.1'])

export function shouldRedirectToLocalhost(hostname: string): boolean {
  return REDIRECT_TO_LOCALHOST_HOSTS.has(normalizeHostname(hostname))
}

export function localhostRedirectUrl(requestUrl: URL): string {
  const url = new URL(requestUrl.toString())
  url.hostname = 'localhost'
  return url.toString()
}
