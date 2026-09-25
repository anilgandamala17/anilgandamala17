'use client'

import type { AssistantMessage } from '../types/assistant'
import { AssistantMessageBubble } from './AssistantMessage'
import { AssistantTypingIndicator } from './AssistantTypingIndicator'

export function AssistantMessages({
  messages,
  isBusy,
  onRetry,
  containerRef,
  onScroll,
}: {
  messages: AssistantMessage[]
  isBusy: boolean
  onRetry?: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
  onScroll: () => void
}) {
  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Conversation"
    >
      {messages.map((m) => (
        <AssistantMessageBubble
          key={m.id}
          message={m}
          onRetry={m.isError ? onRetry : undefined}
        />
      ))}
      {isBusy ? <AssistantTypingIndicator /> : null}
    </div>
  )
}
