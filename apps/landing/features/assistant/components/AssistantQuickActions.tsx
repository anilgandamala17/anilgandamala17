'use client'

import { BookOpen, Compass, GraduationCap, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssistantAction } from '../types/assistant'

const ICONS = [Compass, GraduationCap, BookOpen, Trophy] as const

export function AssistantQuickActions({
  actions,
  disabled,
  onAction,
}: {
  actions: AssistantAction[]
  disabled?: boolean
  onAction: (action: AssistantAction) => void
}) {
  if (!actions.length) return null

  return (
    <div className="px-4 pb-2" aria-label="Suggested actions">
      <div className="flex flex-wrap gap-2">
        {actions.slice(0, 4).map((action, i) => {
          const Icon = ICONS[i % ICONS.length]
          return (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              onClick={() => onAction(action)}
              className={cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs font-medium text-foreground shadow-[var(--shadow-sm)] transition-colors',
                'hover:border-primary/30 hover:bg-primary-muted',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                'disabled:pointer-events-none disabled:opacity-50',
                'min-h-9',
              )}
            >
              <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
              <span className="truncate">{action.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
