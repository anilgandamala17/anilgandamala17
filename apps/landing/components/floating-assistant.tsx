'use client'

import { lazy, Suspense } from 'react'

const AssistantRoot = lazy(() =>
  import('@/features/assistant').then((m) => ({ default: m.AssistantRoot })),
)

/**
 * Landing floating assistant — lazy-loaded so it does not inflate first paint.
 */
export function FloatingAssistant() {
  return (
    <Suspense fallback={null}>
      <AssistantRoot />
    </Suspense>
  )
}
