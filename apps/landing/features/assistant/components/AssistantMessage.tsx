'use client'

import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssistantMessage } from '../types/assistant'
import { renderAssistantMarkdown } from './assistantMarkdown'

export function AssistantMessageBubble({
  message,
  onRetry,
}: {
  message: AssistantMessage
  onRetry?: () => void
}) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
      data-role={message.role}
    >
      <div
        className={cn(
          'max-w-[88%] px-3.5 py-2.5 text-[13px] leading-relaxed',
          isUser
            ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-2xl rounded-bl-md border border-border/80 bg-card text-card-foreground shadow-[var(--shadow-sm)]',
          message.isError && !isUser && 'border-destructive/30 bg-destructive/5',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          renderAssistantMarkdown(message.content)
        )}
        {message.isError && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <RefreshCw className="size-3" aria-hidden />
            Try again
          </button>
        ) : null}
      </div>
    </div>
  )
}
