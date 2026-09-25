'use client'

import { RotateCcw, X } from 'lucide-react'
import { BrandIcon } from '@/components/brand'
import { ASSISTANT_IDENTITY } from '../data/assistantKnowledge'
import type { AssistantStatus } from '../types/assistant'
import { cn } from '@/lib/utils'

function statusLabel(status: AssistantStatus) {
  switch (status) {
    case 'thinking':
      return 'AIra is thinking'
    case 'listening':
      return 'Listening…'
    case 'speaking':
      return 'Speaking…'
    case 'error':
      return 'Something went wrong'
    case 'offline':
      return "You're offline"
    default:
      return ASSISTANT_IDENTITY.readyLabel
  }
}

function statusDot(status: AssistantStatus) {
  if (status === 'thinking') return 'bg-amber-500'
  if (status === 'listening') return 'bg-rose-500'
  if (status === 'error' || status === 'offline') return 'bg-destructive'
  return 'bg-emerald-500'
}

export function AssistantHeader({
  status,
  onClose,
  onReset,
}: {
  status: AssistantStatus
  onClose: () => void
  onReset: () => void
}) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-border/80 bg-card px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <BrandIcon size={28} className="size-7" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-foreground">
          {ASSISTANT_IDENTITY.name}
        </h2>
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              statusDot(status),
              status === 'thinking' && 'motion-safe:animate-pulse',
            )}
            aria-hidden
          />
          <span>{statusLabel(status)}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex size-9 items-center justify-center rounded-[var(--radius-btn)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label="Start new conversation"
        title="New conversation"
      >
        <RotateCcw className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex size-9 items-center justify-center rounded-[var(--radius-btn)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label="Close assistant"
      >
        <X className="size-4" aria-hidden />
      </button>
    </header>
  )
}
