'use client'

import type { ReactNode } from 'react'
import { GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FilterPill({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        active
          ? 'bg-foreground text-background shadow-[var(--shadow-sm)]'
          : 'bg-secondary text-secondary-foreground hover:bg-border/60',
      )}
    >
      {children}
    </button>
  )
}

export function CoursesEmptyState({
  onReset,
  message = 'Try another filter combination, or reset to see the full catalog.',
}: {
  onReset: () => void
  message?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-card/60 px-6 py-16 text-center">
      <GraduationCap
        className="mb-3 size-10 text-muted-foreground"
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="text-base font-semibold text-foreground">
        No courses match these filters
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Reset filters
      </button>
    </div>
  )
}
