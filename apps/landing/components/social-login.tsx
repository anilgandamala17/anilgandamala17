'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AppleMark,
  GoogleMark,
  MicrosoftMark,
  PhoneMark,
} from '@/components/brand-icons'
import {
  authInputClassName,
  authLabelClassName,
  authPrimaryBtnClassName,
} from '@/components/auth-shell'
import {
  sendPhoneOtp,
  signInWithApple,
  signInWithGoogle,
  signInWithMicrosoft,
  signInWithPhone,
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
function isProviderEnabled(provider: Provider | 'phone'): boolean {
  const envKey =
    provider === 'google'
      ? 'NEXT_PUBLIC_AUTH_GOOGLE'
      : provider === 'apple'
        ? 'NEXT_PUBLIC_AUTH_APPLE'
        : provider === 'microsoft'
          ? 'NEXT_PUBLIC_AUTH_MICROSOFT'
          : 'NEXT_PUBLIC_AUTH_PHONE'

  const raw = process.env[envKey]
  if (raw === undefined || raw === '') {
    // Google + phone on by default; Apple/Microsoft opt-in via env.
    return provider === 'google' || provider === 'phone'
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
  const [busy, setBusy] = useState<Provider | 'phone' | null>(null)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [phoneHint, setPhoneHint] = useState<string | null>(null)

  const oauthEnabled = PROVIDERS.filter((p) => isProviderEnabled(p.id))
  const phoneEnabled = isProviderEnabled('phone')
  const googleEntry = oauthEnabled.find((p) => p.id === 'google')
  const otherOAuth = oauthEnabled.filter((p) => p.id !== 'google')

  const finishSignIn = async (uid: string) => {
    if (onSignedIn) {
      await onSignedIn(uid)
      return
    }
    if (/^https?:\/\//i.test(redirectTo)) {
      window.location.assign(redirectTo)
      return
    }
    router.replace(redirectTo)
    router.refresh()
  }

  const handle = (provider: Provider) => {
    if (busy) return
    const entry = PROVIDERS.find((p) => p.id === provider)
    if (!entry) return
    setBusy(provider)
    setPhoneOpen(false)

    void entry
      .signIn()
      .then(async (cred) => {
        await finishSignIn(cred.user.uid)
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

  const openPhone = () => {
    if (busy) return
    setPhoneHint(null)
    setPhoneOpen((open) => {
      if (open) {
        setPhoneStep('phone')
        setOtp('')
        return false
      }
      return true
    })
  }

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy('phone')
    setPhoneHint(null)
    try {
      await sendPhoneOtp(phone)
      setPhoneStep('otp')
      setPhoneHint('Demo mode: enter any 6-digit code to continue.')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not send verification code.'
      onError?.(message)
    } finally {
      setBusy(null)
    }
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy('phone')
    setPhoneHint(null)
    try {
      const cred = await signInWithPhone(phone, otp)
      await finishSignIn(cred.user.uid)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Phone sign-in failed.'
      onError?.(message)
    } finally {
      setBusy(null)
    }
  }

  if (oauthEnabled.length === 0 && !phoneEnabled) return null

  return (
    <div className="grid w-full grid-cols-1 gap-3">
      {/* Google + Phone share a row when both are enabled */}
      {(googleEntry || phoneEnabled) && (
        <div
          className={
            googleEntry && phoneEnabled
              ? 'grid grid-cols-1 gap-3 sm:grid-cols-2'
              : 'grid grid-cols-1 gap-3'
          }
        >
          {googleEntry && (
            <Button
              type="button"
              variant="outline"
              disabled={!!busy}
              onClick={() => handle('google')}
              className={btnClass}
            >
              <GoogleMark className="size-[18px] shrink-0" />
              <span>
                {busy === 'google'
                  ? googleEntry.busyLabel
                  : phoneEnabled
                    ? 'Google'
                    : googleEntry.label}
              </span>
            </Button>
          )}
          {phoneEnabled && (
            <Button
              type="button"
              variant="outline"
              disabled={!!busy && busy !== 'phone'}
              onClick={openPhone}
              aria-expanded={phoneOpen}
              className={btnClass}
            >
              <PhoneMark className="size-[18px] shrink-0" />
              <span>
                {phoneOpen
                  ? 'Hide phone'
                  : googleEntry
                    ? 'Phone'
                    : 'Continue with Phone'}
              </span>
            </Button>
          )}
        </div>
      )}

      {phoneEnabled && phoneOpen && (
        <form
          onSubmit={phoneStep === 'phone' ? handleSendOtp : handleVerifyOtp}
          className="space-y-3 rounded-[var(--radius-btn)] border border-border bg-muted/40 p-3"
        >
          {phoneStep === 'phone' ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="social-phone" className={authLabelClassName}>
                  Phone number
                </Label>
                <Input
                  id="social-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your number"
                  required
                  disabled={busy === 'phone'}
                  className={authInputClassName}
                />
              </div>
              <button
                type="submit"
                disabled={busy === 'phone'}
                className={authPrimaryBtnClassName}
              >
                {busy === 'phone' ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Sending…
                  </span>
                ) : (
                  'Send code'
                )}
              </button>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="social-otp" className={authLabelClassName}>
                  Verification code
                </Label>
                <Input
                  id="social-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="6-digit code"
                  required
                  maxLength={6}
                  disabled={busy === 'phone'}
                  className={authInputClassName}
                />
              </div>
              {phoneHint && (
                <p className="text-xs text-muted-foreground">{phoneHint}</p>
              )}
              <button
                type="submit"
                disabled={busy === 'phone'}
                className={authPrimaryBtnClassName}
              >
                {busy === 'phone' ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Verifying…
                  </span>
                ) : (
                  'Verify & continue'
                )}
              </button>
              <button
                type="button"
                disabled={busy === 'phone'}
                onClick={() => {
                  setPhoneStep('phone')
                  setOtp('')
                  setPhoneHint(null)
                }}
                className="text-center text-xs font-medium text-primary hover:underline"
              >
                Change number
              </button>
            </>
          )}
        </form>
      )}

      {otherOAuth.map(({ id, label, busyLabel, Icon }) => (
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
