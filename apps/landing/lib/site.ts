/** Shared site constants — keep CTAs and stats consistent everywhere. */

export const CTAS = {
  primary: {
    label: 'Start Free Trial',
    href: '/signup',
  },
  secondary: {
    label: 'Book a Demo',
    href: '/contact',
  },
} as const

/**
 * Canonical stats used across the site.
 * Prefer product truths over unverified vanity metrics.
 */
export const STATS = {
  coverage: {
    value: 'Grades 6–12',
    label: 'curriculum ready',
    note: 'School learning grade bands',
  },
  exams: {
    value: 'JEE · NEET',
    label: 'exam prep',
    note: 'Competitive exam focus',
  },
  support: {
    value: '24/7',
    label: 'AI support',
    note: 'Product capability claim',
  },
} as const

/** Short trust line under hero CTAs */
export const HERO_TRUST =
  'Free to start · Boards, JEE, NEET & career skills' as const

export const EXTERNAL = {
  schools: {
    label: 'For Schools',
    /** Role home is resolved after login — do not force /teacher (causes student bounce). */
    loginHref: '/login?intent=school',
    /** Safe fallback while role loads — never dump into student mode-selection. */
    href: '/login?intent=school',
  },
  professionals: {
    label: 'For Professionals',
    loginHref: '/login?intent=professional',
    href: '/login?intent=professional',
  },
} as const

/** Official social profiles — @aira_ai_tutor */
export const SOCIAL = {
  instagram: {
    label: 'Instagram',
    href: 'https://www.instagram.com/aira_ai_tutor',
  },
  x: {
    label: 'X',
    href: 'https://x.com/aira_ai_tutor',
  },
} as const

/** Subtle copy on /login when arriving via For Schools / For Professionals */
export const LOGIN_INTENT_COPY: Record<string, string> = {
  school: 'Signing in to access school tools',
  professional: 'Signing in to access professional tools',
}

/**
 * External (cross-origin) post-login destinations only.
 * School / default users use Firestore role → /student|/teacher|/admin (same origin).
 */
export function portalHrefForIntent(
  intent: string | null | undefined,
): string | null {
  void intent
  return null
}

/** Public inbox used on contact, careers, terms, and privacy. */
export const CONTACT_INBOX = 'Contact@airaeds.com' as const

export const BRAND = {
  name: 'Aɪra',
  tagline: 'The AI tutor that turns effort into results',
  /** Official brand mark — PNG in /public */
  iconSrc: '/aira-logo.png',
} as const
