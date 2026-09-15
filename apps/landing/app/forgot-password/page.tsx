'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AuthShell,
  authInputClassName,
  authLabelClassName,
  authPrimaryBtnClassName,
} from '@/components/auth-shell'
import { resetPassword } from '@/lib/firebase/auth'
import { checkEmailQuality } from '@/lib/email-quality'

export default function ForgotPasswordPage() {
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const emailCheck = checkEmailQuality(email)
    if (!emailCheck.ok) {
      setError(emailCheck.error)
      return
    }

    setLoading(true)
    try {
      await resetPassword(emailCheck.email)
      setSent(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not send reset email.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--neutral-50)]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <AuthShell
      panelHeadline="Reset your password"
      panelSupport="Enter the email on your account and we’ll send a secure link to set a new password."
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Forgot password
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We’ll email you a reset link if an account exists.
        </p>
      </div>

      {sent ? (
        <div className="space-y-4" role="status">
          <p className="text-sm text-foreground">
            If an account exists for{' '}
            <span className="font-medium">{email}</span>, a reset link is on its
            way. Check your inbox and spam folder.
          </p>
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-btn)] bg-foreground text-sm font-semibold text-background hover:bg-foreground/90"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <p role="alert" className="text-sm font-medium text-[var(--error)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={authPrimaryBtnClassName}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Sending…
              </span>
            ) : (
              'Send reset link'
            )}
          </button>
        </form>
      )}

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5 stroke-[1.75]" aria-hidden />
        Back to sign in
      </Link>
    </AuthShell>
  )
}
