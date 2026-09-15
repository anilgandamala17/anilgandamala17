'use client'

import { useState, type FormEvent } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { analytics } from '@/lib/analytics'
import { joinWaitlist } from '@/lib/services/waitlistService'
import { checkEmailQuality } from '@/lib/email-quality'

type WaitlistModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  courseName: string
}

export function WaitlistModal({
  open,
  onOpenChange,
  courseId,
  courseName,
}: WaitlistModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const emailCheck = checkEmailQuality(email)
    if (!emailCheck.ok) {
      setError(emailCheck.error)
      setLoading(false)
      return
    }

    try {
      await joinWaitlist({ email: emailCheck.email, courseId, courseName })
      analytics.featureUsed('waitlist')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join waitlist.')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setEmail('')
      setError(null)
      setDone(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="size-4 text-primary" aria-hidden />
            Notify me
          </DialogTitle>
          <DialogDescription>
            Be the first to know when <strong>{courseName}</strong> launches.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="rounded-[var(--radius-card)] border border-border bg-muted/40 p-4 text-sm">
            <p className="font-semibold text-foreground">You&apos;re on the list!</p>
            <p className="mt-1 text-muted-foreground">
              We&apos;ll email you when {courseName} is available.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="waitlist-email">Email</Label>
              <Input
                id="waitlist-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-[var(--radius-btn)]"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Joining…' : 'Notify Me'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
