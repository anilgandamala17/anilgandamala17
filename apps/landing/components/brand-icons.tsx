/** Official-style brand marks for social auth buttons. */

export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function AppleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.453 2.201-1.247 2.993-.837.832-2.145 1.431-3.303 1.347-.146-1.095.424-2.224 1.201-2.993C13.89 1.94 15.212 1.346 16.365 1.43zM20.82 17.49c-.54 1.23-.794 1.777-1.486 2.863-.966 1.504-2.33 3.377-4.023 3.392-1.506.014-1.895-.976-3.944-.965-2.05.01-2.48.98-3.987.966-1.693-.015-2.99-1.71-3.956-3.214C1.55 17.15.4 13.14 2.14 10.34c.99-1.59 2.56-2.59 4.08-2.59 1.61 0 2.62.98 3.95.98 1.29 0 2.08-.98 3.96-.98 1.41 0 2.9.77 3.89 2.1-3.42 1.87-2.87 6.76.8 7.64z" />
    </svg>
  )
}

/** Microsoft 4-color square mark */
export function MicrosoftMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}
