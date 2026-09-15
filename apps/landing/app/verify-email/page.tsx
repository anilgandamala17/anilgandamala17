'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/auth-shell'
import { useAuth } from '@/components/auth-provider'
import {
  normalizeAppRole,
  resolvePostAuthPath,
} from '@/lib/auth-redirect'
import { resolveRoleForRedirect } from '@/lib/firebase/auth'
import { readRoleHint, writeRoleHint } from '@/lib/session-hints'

function VerifyFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--neutral-50)]">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const { user, loading: authLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const continued = useRef(false)

  const goAfterAuth = useCallback(async (uid: string) => {
    const role = normalizeAppRole(await resolveRoleForRedirect(uid, readRoleHint()))
    writeRoleHint(role)
    const dest = resolvePostAuthPath({
      redirect: redirectParam,
      role,
    })
    window.location.assign(dest)
  }, [redirectParam])

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (authLoading || continued.current) return
    if (!user) {
      const q = redirectParam
        ? `/login?redirect=${encodeURIComponent(redirectParam)}`
        : '/login'
      window.location.assign(q)
      return
    }
    continued.current = true
    void goAfterAuth(user.uid)
  }, [authLoading, user, goAfterAuth, redirectParam])

  if (!mounted || authLoading) {
    return <VerifyFallback />
  }

  return (
    <AuthShell
      panelHeadline="Opening your account"
      panelSupport="Demo accounts are already verified — continuing to Aɪra."
    >
      <div className="mb-6 flex flex-col items-center text-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">
          Continuing…
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          You do not need to verify email in this demo.
        </p>
      </div>
      <Link
        href={
          redirectParam
            ? `/login?redirect=${encodeURIComponent(redirectParam)}`
            : '/login'
        }
        className="block text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Continue to sign in
      </Link>
    </AuthShell>
  )
}
