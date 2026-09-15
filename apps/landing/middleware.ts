import { NextResponse, type NextRequest } from 'next/server'
import {
  localhostRedirectUrl,
  shouldRedirectToLocalhost,
} from '@/lib/firebase/authorized-domains'

/**
 * Firebase Auth authorizes `localhost` by default but not `127.0.0.1`.
 * FRONTEND-ONLY: tutor health probe /api rewrite removed — see EXTRACTION_REPORT.md
 */
export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname

  if (shouldRedirectToLocalhost(hostname)) {
    return NextResponse.redirect(localhostRedirectUrl(request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico)$).*)',
  ],
}
