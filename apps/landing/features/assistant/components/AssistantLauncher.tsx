'use client'

import { forwardRef } from 'react'
import { BrandIcon } from '@/components/brand'
import { cn } from '@/lib/utils'

type LauncherProps = {
  open: boolean
  onToggle: () => void
  showTip?: boolean
  onDismissTip?: () => void
  className?: string
}

export const AssistantLauncher = forwardRef<HTMLButtonElement, LauncherProps>(
  function AssistantLauncher(
    { open, onToggle, showTip, onDismissTip, className },
    ref,
  ) {
    return (
      <div
        className={cn(
          'pointer-events-none fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-2.5 sm:right-6',
          className,
        )}
      >
        {showTip && !open ? (
          <div className="pointer-events-auto flex max-w-[min(280px,calc(100vw-5.5rem))] items-center gap-2 rounded-full border border-border bg-card py-2 pl-3.5 pr-2 text-xs font-medium text-foreground shadow-[var(--shadow-md)]">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inset-0 rounded-full bg-emerald-400/70 motion-safe:animate-ping" />
              <span className="relative size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="leading-snug">AIra Assistant — Ask anything</span>
            <button
              type="button"
              onClick={onDismissTip}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label="Dismiss tip"
            >
              <span aria-hidden className="block size-3.5 text-center text-[11px] leading-none">
                ×
              </span>
            </button>
          </div>
        ) : null}

        <button
          ref={ref}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="aira-assistant-panel"
          aria-label={open ? 'Close AIra Assistant' : 'Open AIra Assistant'}
          title="AIra Assistant"
          className={cn(
            'pointer-events-auto relative flex size-14 items-center justify-center rounded-full border border-border bg-card shadow-[var(--shadow-lg)] transition-transform',
            'hover:scale-[1.04] active:scale-[0.97]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            open && 'ring-2 ring-primary/30',
          )}
        >
          <BrandIcon size={36} className="size-9" priority />
          <span
            className="absolute right-0.5 top-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500"
            aria-hidden
          />
        </button>
      </div>
    )
  },
)
