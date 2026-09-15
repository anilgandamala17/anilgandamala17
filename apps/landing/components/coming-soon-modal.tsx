'use client'

import { useState, type FormEvent } from 'react'
import { Briefcase, Sparkles, Bell, CheckCircle2 } from 'lucide-react'
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
import { BRAND } from '@/lib/site'
import { joinWaitlist } from '@/lib/services/waitlistService'
import { checkEmailQuality } from '@/lib/email-quality'

type ComingSoonModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ComingSoonModal({ open, onOpenChange }: ComingSoonModalProps) {
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
      await joinWaitlist({
        email: emailCheck.email,
        courseId: 'professional-learning',
        courseName: 'Professional Learning',
      })
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
      <DialogContent className="overflow-hidden border-border/80 p-0 sm:max-w-md">
        <div
          className="relative px-6 pt-8 pb-5"
          style={{
            background:
              'radial-gradient(ellipse 90% 80% at 10% 0%, rgb(29 78 216 / 0.12), transparent 55%), radial-gradient(ellipse 70% 60% at 100% 20%, rgb(15 118 110 / 0.1), transparent 50%), linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          }}
        >
          <div
            className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-blue-800 text-white shadow-[var(--shadow-md)] ring-4 ring-white"
            aria-hidden
          >
            <Briefcase className="size-6" strokeWidth={1.75} />
          </div>

          <DialogHeader className="space-y-2 text-center sm:text-center">
            <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-amber-900 ring-1 ring-amber-200/80">
              <Sparkles className="size-3" aria-hidden />
              Coming soon
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
              Professional Learning is almost here
            </DialogTitle>
            <DialogDescription className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              Career tracks for web, AI, design, data, and security are in final
              polish. {BRAND.name} for professionals will open soon — leave your
              email and we&apos;ll notify you first.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="border-t border-border bg-card px-6 py-5">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <CheckCircle2
                className="size-10 text-teal-600"
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="text-sm font-semibold text-foreground">
                You&apos;re on the list
              </p>
              <p className="text-sm text-muted-foreground">
                We&apos;ll email you as soon as Professional Learning launches.
              </p>
              <Button
                type="button"
                className="mt-1 rounded-[var(--radius-btn)]"
                onClick={() => handleOpenChange(false)}
              >
                Got it
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pro-waitlist-email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="pro-waitlist-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-[var(--radius-btn)]"
                />
              </div>

              {error ? (
                <p role="alert" className="text-sm font-medium text-[var(--error)]">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-[var(--radius-btn)] gap-2"
              >
                <Bell className="size-4" aria-hidden />
                {loading ? 'Saving…' : 'Notify me when it launches'}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
