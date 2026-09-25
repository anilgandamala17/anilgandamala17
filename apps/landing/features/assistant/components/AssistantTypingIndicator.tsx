'use client'

import { cn } from '@/lib/utils'

export function AssistantTypingIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-muted px-3.5 py-2.5',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="AIra is thinking"
    >
      <span className="size-1.5 rounded-full bg-muted-foreground/55 motion-safe:animate-bounce [animation-delay:0ms]" />
      <span className="size-1.5 rounded-full bg-muted-foreground/55 motion-safe:animate-bounce [animation-delay:150ms]" />
      <span className="size-1.5 rounded-full bg-muted-foreground/55 motion-safe:animate-bounce [animation-delay:300ms]" />
    </div>
  )
}
