/** Pre-Firebase email checks: format, common typos, disposable inboxes. */

export type EmailQualityResult =
  | { ok: true; email: string }
  | { ok: false; error: string }

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i

/** Mistyped consumer domains → the address the student almost certainly meant. */
const DOMAIN_TYPOS: Record<string, string> = {
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'googlemail.con': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yaho.co.in': 'yahoo.co.in',
  'outlok.com': 'outlook.com',
  'outllok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'iclod.com': 'icloud.com',
  'icould.com': 'icloud.com',
  'icloud.con': 'icloud.com',
  'redifmail.com': 'rediffmail.com',
  'rediffmail.con': 'rediffmail.com',
}

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'mailinator.net',
  'tempmail.com',
  'temp-mail.org',
  'tempmailo.com',
  '10minutemail.com',
  '10minmail.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'sharklasers.com',
  'grr.la',
  'yopmail.com',
  'trashmail.com',
  'getnada.com',
  'throwawaymail.com',
  'fakeinbox.com',
  'dispostable.com',
  'maildrop.cc',
  'mailnesia.com',
  'moakt.com',
  'emailondeck.com',
  'tempr.email',
  'discard.email',
  'guerrillamailblock.com',
])

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

export function checkEmailQuality(raw: string): EmailQualityResult {
  const email = normalizeEmail(raw)
  if (!email) {
    return { ok: false, error: 'Please enter your email address.' }
  }
  if (!EMAIL_RE.test(email) || email.includes('..')) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }

  const at = email.lastIndexOf('@')
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  if (!local || !domain) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }

  const suggested = DOMAIN_TYPOS[domain]
  if (suggested) {
    return {
      ok: false,
      error: `That looks like a typo. Did you mean ${local}@${suggested}?`,
    }
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      ok: false,
      error: 'Please use a permanent email address, not a temporary or disposable inbox.',
    }
  }

  return { ok: true, email }
}

export function assertEmailQuality(raw: string): string {
  const result = checkEmailQuality(raw)
  if (!result.ok) throw new Error(result.error)
  return result.email
}
