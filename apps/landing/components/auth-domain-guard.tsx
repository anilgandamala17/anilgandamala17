'use client'

import { useEffect } from 'react'
import {
  localhostRedirectUrl,
  shouldRedirectToLocalhost,
} from '@/lib/firebase/authorized-domains'

/**
 * Client-side fallback: middleware handles SSR redirects; this catches client navigations.
 */
export function AuthDomainGuard() {
  useEffect(() => {
    if (shouldRedirectToLocalhost(window.location.hostname)) {
      window.location.replace(localhostRedirectUrl(new URL(window.location.href)))
    }
  }, [])

  return null
}
