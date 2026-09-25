'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Auto-scroll to latest message unless the user has scrolled up to read history.
 */
export function useAssistantScroll(
  deps: unknown[],
  enabled = true,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)

  const onScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distance < 72
  }, [])

  useEffect(() => {
    if (!enabled) return
    const el = containerRef.current
    if (!el || !stickToBottomRef.current) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional deps array from caller
  }, deps)

  return { containerRef, onScroll }
}
