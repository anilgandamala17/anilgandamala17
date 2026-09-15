'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AppleMark, GoogleMark, MicrosoftMark } from '@/components/brand-icons'
import {
  signInWithApple,
  signInWithGoogle,
  signInWithMicrosoft,
} from '@/lib/firebase/auth'

type Provider = 'google' | 'apple' | 'microsoft'

type SocialLoginProps = {
  onError?: (message: string) => void
  /** Preferred: resolve destination after auth (role + redirect query). */
  onSignedIn?: (uid: string) => void | Promise<void>
  /** Legacy absolute/relative path when onSignedIn is not provided. */
  redirectTo?: string
}

const btnClass =
  'flex h-11 w-full items-center justify-center gap-3 rounded-[var(--radius-btn)] border border-border bg-card text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60'

/** Providers that are fully configured in Firebase (client-visible flags). */
function isProviderEnabled(provider: Provider): boolean {
  const envKey =
    provider === 'google'
      ? 'NEXT_PUBLIC_AUTH_GOOGLE'
      : provider === 'apple'
        ? 'NEXT_PUBLIC_AUTH_APPLE'
        : 'NEXT_PUBLIC_AUTH_MICROSOFT'

  const raw = process.env[envKey]
  if (raw === undefined || raw === '') {
    return provider === 'google'
  }
  return raw === '1' || raw.toLowerCase() === 'true'
}

const PROVIDERS: Array<{
  id: Provider
  label: string
  busyLabel: string
  Icon: typeof GoogleMark
  signIn: () => Promise<{ user: { uid: string } }>
}> = [
  {
    id: 'google',
    label: 'Continue with Google',
    busyLabel: 'Connecting…',
    Icon: GoogleMark,
    signIn: signInWithGoogle,
  },
  {
    id: 'apple',
    label: 'Continue with Apple',
    busyLabel: 'Connecting…',
    Icon: AppleMark,
    signIn: signInWithApple,
  },
  {
    id: 'microsoft',
    label: 'Continue with Microsoft',
    busyLabel: 'Connecting…',
    Icon: MicrosoftMark,
    signIn: signInWithMicrosoft,
  },
]

export function SocialLogin({
  onError,
  onSignedIn,
  redirectTo = '/',
}: SocialLoginProps) {
  const router = useRouter()
  const [busy, setBusy] = useState<Provider | null>(null)
  const enabled = PROVIDERS.filter((p) => isProviderEnabled(p.id))

  const handle = (provider: Provider) => {
    if (busy) return
    const entry = PROVIDERS.find((p) => p.id === provider)
    if (!entry) return
    setBusy(provider)

    void entry
      .signIn()
      .then(async (cred) => {
        if (onSignedIn) {
          await onSignedIn(cred.user.uid)
          return
        }
        if (/^https?:\/\//i.test(redirectTo)) {
          window.location.assign(redirectTo)
          return
        }
        router.replace(redirectTo)
        router.refresh()
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Sign-in failed. Please try again.'
        onError?.(message)
      })
      .finally(() => {
        setBusy(null)
      })
  }

  if (enabled.length === 0) return null

  return (
    <div className="grid w-full grid-cols-1 gap-3">
      {enabled.map(({ id, label, busyLabel, Icon }) => (
        <Button
          key={id}
          type="button"
          variant="outline"
          disabled={!!busy}
          onClick={() => handle(id)}
          className={btnClass}
        >
          <Icon className="size-[18px] shrink-0" />
          <span>{busy === id ? busyLabel : label}</span>
        </Button>
      ))}
    </div>
  )
}
