'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { submitContactMessage } from '@/lib/services/contactService'
import { checkEmailQuality } from '@/lib/email-quality'

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const organization = String(data.get('org') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()

    if (!name) {
      setError('Please enter your name.')
      setLoading(false)
      return
    }
    const emailCheck = checkEmailQuality(email)
    if (!emailCheck.ok) {
      setError(emailCheck.error)
      setLoading(false)
      return
    }
    if (!message) {
      setError('Please enter a message.')
      setLoading(false)
      return
    }

    try {
      await submitContactMessage({
        name,
        email: emailCheck.email,
        organization: organization || undefined,
        message,
      })
      setSubmitted(true)
    } catch (err) {
      console.error('[contact]', err)
      setError(err instanceof Error ? err.message : 'Could not send message.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-[var(--radius-card)] border border-border bg-card p-8 shadow-sm"
        role="status"
      >
        <h2 className="text-xl font-bold text-foreground">
          Message saved for this demo session
        </h2>
        <p className="mt-2 text-muted-foreground">
          In this frontend demo build, your note is stored locally so we can show the flow.
          For a real reply, email us at{' '}
          <a className="underline" href="mailto:Contact@airaeds.com">
            Contact@airaeds.com
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-sm md:p-8"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          required
          autoComplete="name"
          className="h-11 rounded-[var(--radius-btn)]"
          placeholder="Your name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-11 rounded-[var(--radius-btn)]"
          placeholder="you@school.edu"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org">Organization</Label>
        <Input
          id="org"
          name="org"
          autoComplete="organization"
          className="h-11 rounded-[var(--radius-btn)]"
          placeholder="School / institute / company"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">How can we help?</Label>
        <Textarea
          id="message"
          name="message"
          required
          rows={4}
          className="rounded-[var(--radius-btn)]"
          placeholder="Demo request, school rollout, pricing questions…"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-[var(--error)]">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="h-11 rounded-[var(--radius-btn)] bg-primary text-primary-foreground hover:bg-[var(--primary-hover)]"
      >
        {loading ? 'Sending…' : 'Book a Demo'}
      </Button>
      <p className="text-xs text-muted-foreground">
        By submitting, you agree to be contacted about Aɪra.
      </p>
    </form>
  )
}
