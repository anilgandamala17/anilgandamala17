'use client'

import { AssistantPanel } from '@/features/assistant'

/**
 * Full-page / embeddable assistant shell (e.g. `/assistant`).
 * Preserves the previous `AiAssistant` export name for consumers.
 */
export function AiAssistant({
  standalone = false,
  isModal = false,
  onClose,
}: {
  standalone?: boolean
  isModal?: boolean
  onClose?: () => void
}) {
  void isModal
  return (
    <div
      className={
        standalone
          ? 'flex h-full min-h-0 w-full flex-col overflow-hidden bg-background'
          : 'flex h-full min-h-0 w-full flex-col'
      }
    >
      <AssistantPanel
        open
        onClose={onClose ?? (() => undefined)}
        variant="page"
      />
    </div>
  )
}
