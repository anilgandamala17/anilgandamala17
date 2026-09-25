'use client'

import { BookOpen, Compass, Sparkles, Trophy } from 'lucide-react'
import type { AssistantAction } from '../types/assistant'
import { cn } from '@/lib/utils'

const CARD_ICONS = [Sparkles, Compass, BookOpen, Trophy] as const

export function AssistantWelcome({
  actions,
  disabled,
  onAction,
}: {
  actions: AssistantAction[]
  disabled?: boolean
  onAction: (action: AssistantAction) => void
}) {
  return (
    <div className="space-y-3 px-4 pb-1 pt-1">
      <p className="text-xs font-medium text-muted-foreground">Try asking about</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {actions.slice(0, 4).map((action, i) => {
          const Icon = CARD_ICONS[i % CARD_ICONS.length]
          return (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              onClick={() => onAction(action)}
              className={cn(
                'flex min-h-[3.25rem] items-start gap-2.5 rounded-[var(--radius-card)] border border-border bg-card p-3 text-left shadow-[var(--shadow-sm)] transition-colors',
                'hover:border-primary/25 hover:bg-primary-muted/60',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                'disabled:pointer-events-none disabled:opacity-50',
              )}
            >
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-btn)] bg-primary/10 text-primary">
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-foreground">
                  {action.label}
                </span>
                {action.description ? (
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {action.description}
                  </span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
