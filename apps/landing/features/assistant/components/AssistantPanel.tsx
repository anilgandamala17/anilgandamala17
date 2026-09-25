'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAssistant } from '../hooks/useAssistant'
import { useAssistantScroll } from '../hooks/useAssistantScroll'
import { useAssistantVoice } from '../hooks/useAssistantVoice'
import { INITIAL_ACTIONS } from '../data/assistantSuggestions'
import type { AssistantAction } from '../types/assistant'
import { AssistantHeader } from './AssistantHeader'
import { AssistantWelcome } from './AssistantWelcome'
import { AssistantMessages } from './AssistantMessages'
import { AssistantQuickActions } from './AssistantQuickActions'
import { AssistantComposer } from './AssistantComposer'
import { cn } from '@/lib/utils'

export function AssistantPanel({
  open,
  onClose,
  variant = 'floating',
  returnFocusRef,
}: {
  open: boolean
  onClose: () => void
  variant?: 'floating' | 'page'
  returnFocusRef?: React.RefObject<HTMLElement | null>
}) {
  const router = useRouter()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const wasOpenRef = useRef(false)
  const [input, setInput] = useState('')
  const {
    messages,
    status,
    actions,
    isBusy,
    send,
    retry,
    resetConversation,
  } = useAssistant()

  const onlyWelcome =
    messages.length === 1 && messages[0]?.id === 'welcome' && !isBusy

  const { containerRef, onScroll } = useAssistantScroll(
    [messages.length, isBusy],
    open,
  )

  const onVoiceTranscript = useCallback(
    (text: string) => {
      setInput('')
      void send(text)
    },
    [send],
  )
  const { micState, toggle: toggleMic } = useAssistantVoice(onVoiceTranscript)

  const handleAction = useCallback(
    (action: AssistantAction) => {
      if (action.href) {
        onClose()
        router.push(action.href)
        return
      }
      if (action.query) {
        setInput('')
        void send(action.query)
      }
    },
    [onClose, router, send],
  )

  // Escape to close + focus trap entry
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      const inputEl = panelRef.current?.querySelector<HTMLTextAreaElement>(
        '#aira-assistant-input',
      )
      inputEl?.focus()
    }, 40)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true
      return
    }
    if (!wasOpenRef.current) return
    wasOpenRef.current = false
    returnFocusRef?.current?.focus()
  }, [open, returnFocusRef])

  if (!open && variant === 'floating') return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal={variant === 'floating'}
      aria-labelledby={titleId}
      className={cn(
        'flex flex-col overflow-hidden bg-background text-foreground',
        variant === 'floating' &&
          'fixed z-50 border border-border shadow-[var(--shadow-lg)] motion-safe:transition motion-safe:duration-200',
        variant === 'floating' &&
          'inset-0 h-[100dvh] w-full rounded-none sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(640px,calc(100dvh-7rem))] sm:w-[min(420px,calc(100vw-2rem))] sm:rounded-[var(--radius-card)]',
        variant === 'page' && 'h-full min-h-0 w-full rounded-none border-0',
      )}
    >
      <span id={titleId} className="sr-only">
        AIra Assistant
      </span>
      <AssistantHeader
        status={
          micState === 'listening'
            ? 'listening'
            : status
        }
        onClose={onClose}
        onReset={() => {
          resetConversation()
          setInput('')
        }}
      />

      {onlyWelcome ? (
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 pt-4">
            <div className="rounded-[var(--radius-card)] border border-border/80 bg-card p-3.5 shadow-[var(--shadow-sm)]">
              <p className="text-[13px] leading-relaxed text-foreground/90">
                {messages[0]?.content}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <AssistantWelcome
              actions={INITIAL_ACTIONS}
              disabled={isBusy}
              onAction={handleAction}
            />
          </div>
        </div>
      ) : (
        <>
          <AssistantMessages
            messages={messages}
            isBusy={isBusy}
            onRetry={retry}
            containerRef={containerRef}
            onScroll={onScroll}
          />
          <AssistantQuickActions
            actions={actions}
            disabled={isBusy}
            onAction={handleAction}
          />
        </>
      )}

      <AssistantComposer
        value={input}
        onChange={setInput}
        onSend={() => {
          const t = input
          setInput('')
          void send(t)
        }}
        disabled={micState === 'listening'}
        isBusy={isBusy}
        micState={micState}
        onMicToggle={toggleMic}
        showMic
      />
    </div>
  )
}
