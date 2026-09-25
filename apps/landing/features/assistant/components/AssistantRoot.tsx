'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AssistantLauncher } from './AssistantLauncher'
import { AssistantPanel } from './AssistantPanel'

/**
 * Landing-page floating AIra Assistant entry point.
 * Heavy chat UI is code-split via dynamic import from FloatingAssistant wrapper.
 */
export function AssistantRoot() {
  const [open, setOpen] = useState(false)
  const [showTip, setShowTip] = useState(true)
  const launcherRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setShowTip(false), 12000)
    return () => window.clearTimeout(t)
  }, [])

  const toggle = useCallback(() => {
    setOpen((v) => {
      const next = !v
      if (next) setShowTip(false)
      return next
    })
  }, [])

  return (
    <>
      {/* Mobile backdrop */}
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] sm:hidden"
          aria-label="Close assistant overlay"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div id="aira-assistant-panel">
        <AssistantPanel
          open={open}
          onClose={() => setOpen(false)}
          variant="floating"
          returnFocusRef={launcherRef}
        />
      </div>

      <AssistantLauncher
        ref={launcherRef}
        open={open}
        onToggle={toggle}
        showTip={showTip}
        onDismissTip={() => setShowTip(false)}
      />
    </>
  )
}
