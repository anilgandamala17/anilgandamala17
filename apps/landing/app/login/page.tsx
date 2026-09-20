'use client'

import { Suspense, useState, useEffect, useRef, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SocialLogin } from '@/components/social-login'
import {
  AuthShell,
  authInputClassName,
  authLabelClassName,
  authPrimaryBtnClassName,
} from '@/components/auth-shell'
import { logOut, resolveRoleForRedirect, signInWithEmail, reloadCurrentUser, retryWelcomeEmailIfPending } from '@/lib/firebase/auth'
import { useAuth } from '@/components/auth-provider'
import { LOGIN_INTENT_COPY, portalHrefForIntent } from '@/lib/site'
import { resolvePostAuthPath } from '@/lib/auth-redirect'
import { navigateAfterAuth } from '@/lib/navigation'
import { checkEmailQuality } from '@/lib/email-quality'
import {
  clearRoleHint,
  readRoleHint,
  writeRoleHint,
} from '@/lib/session-hints'

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--neutral-50)]">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const searchParams = useSearchParams()
  const intent = searchParams.get('intent')
  const redirectParam = searchParams.get('redirect')
  // Set by the tutor when it sends the user here after a sign-out.
  // Capture once so a later URL cleanup (removing signedOut) cannot re-enable auto-continue.
  const [fromSignOut] = useState(
    () => searchParams.get('signedOut') === '1',
  )
  const intentCopy =
    intent && LOGIN_INTENT_COPY[intent] ? LOGIN_INTENT_COPY[intent] : null
  const externalPortal = portalHrefForIntent(intent)
  const { user, loading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const goAfterAuth = async (uid: string, opts?: { retryWelcome?: boolean; user?: typeof user }) => {
    if (intent === 'professional') {
      window.location.assign('/')
      return
    }
    if (externalPortal) {
      window.location.assign(externalPortal)
      return
    }
    if (opts?.retryWelcome && opts.user) {
      await retryWelcomeEmailIfPending(
        opts.user,
        opts.user.displayName?.trim() || opts.user.email?.split('@')[0],
      )
    }
    const role = await resolveRoleForRedirect(uid, readRoleHint())
    writeRoleHint(role)
    const dest = resolvePostAuthPath({
      redirect: redirectParam,
      role,
    })
    navigateAfterAuth(dest)
  }

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  /**
   * The tutor may run on a different origin than the landing app, in which case
   * its sign-out cannot clear the session Firebase persisted here — the login
   * page would then auto-continue and bounce the user straight back into the
   * app. Honour the explicit signal instead of trusting local auth state.
   */
  const [signOutSettled, setSignOutSettled] = useState(!fromSignOut)
  useEffect(() => {
    if (!fromSignOut) return
    clearRoleHint()
    void logOut()
      .catch(() => {})
      .finally(() => {
        setSignOutSettled(true)
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          params.delete('signedOut')
          const qs = params.toString()
          window.history.replaceState(null, '', qs ? `/login?${qs}` : '/login')
        }
      })
  }, [fromSignOut])

  // Auto-continue only when already signed in on arrival (not after form submit —
  // handleLogin already navigates, avoiding a double full-page load — and never
  // right after a sign-out, where the user asked for this form).
  const autoContinued = useRef(false)
  useEffect(() => {
    if (fromSignOut) return
    if (authLoading || !user || autoContinued.current || loading) return
    autoContinued.current = true
    void (async () => {
      let current = user
      const fromVerifyLink = searchParams.get('verified') === '1'
      if (fromVerifyLink) {
        try {
          const next = await reloadCurrentUser()
          if (next) current = next
        } catch {
          /* continue with current user */
        }
      }
      await goAfterAuth(current.uid, {
        retryWelcome: fromVerifyLink,
        user: current,
      })
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, loading, fromSignOut])

  /**
   * Warm the destination document while the user is still typing, so the
   * post-login navigation does not start from a cold cache.
   */
  useEffect(() => {
    if (!mounted || externalPortal) return
    const hint = readRoleHint() ?? 'student'
    const href = resolvePostAuthPath({
      redirect: redirectParam,
      role: hint === 'admin' ? 'student' : hint,
    })
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'document'
    link.href = href
    document.head.appendChild(link)
    return () => link.remove()
  }, [mounted, externalPortal, redirectParam])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const emailCheck = checkEmailQuality(email)
    if (!emailCheck.ok) {
      setError(emailCheck.error)
      return
    }

    setLoading(true)
    try {
      const cred = await signInWithEmail(emailCheck.email, password)
      await goAfterAuth(cred.user.uid, {
        retryWelcome: true,
        user: cred.user,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || authLoading || !signOutSettled) return <LoginFallback />
  // After a sign-out we always show the form, even if clearing the session
  // failed — an endless spinner would be worse than a stale auth flag.
  if (user && !fromSignOut) return <LoginFallback />

  return (
    <AuthShell
      panelHeadline="Welcome back"
      panelSupport="Sign in to continue learning with personalized AI paths for exams and careers."
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Sign in
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {intentCopy ?? 'Enter your credentials to continue.'}
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className={authLabelClassName}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            autoComplete="email"
            className={authInputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password" className={authLabelClassName}>
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className={`${authInputClassName} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="size-4 stroke-[1.75]" />
              ) : (
                <Eye className="size-4 stroke-[1.75]" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-[var(--error)]">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={authPrimaryBtnClassName}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground">
          <span className="bg-card px-3">or</span>
        </div>
      </div>

      <SocialLogin
        onError={setError}
        onSignedIn={async (uid) => {
          await goAfterAuth(uid)
        }}
      />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href={(() => {
            const params = new URLSearchParams()
            if (redirectParam) params.set('redirect', redirectParam)
            if (intent) params.set('intent', intent)
            const q = params.toString()
            return q ? `/signup?${q}` : '/signup'
          })()}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create account
        </Link>
      </p>

      <Link
        href="/"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5 stroke-[1.75]" aria-hidden />
        Back to home
      </Link>
    </AuthShell>
  )
}
