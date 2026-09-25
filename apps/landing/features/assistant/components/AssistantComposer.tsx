'use client'

import {
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { Loader2, Mic, MicOff, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MicState } from '../types/assistant'

export function AssistantComposer({
  value,
  onChange,
  onSend,
  disabled,
  isBusy,
  micState,
  onMicToggle,
  showMic,
}: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled?: boolean
  isBusy?: boolean
  micState: MicState
  onMicToggle: () => void
  showMic?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const canSend = Boolean(value.trim()) && !disabled && !isBusy

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [value])

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSend) onSend()
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (canSend) onSend()
  }

  const micListening = micState === 'listening'
  const micLabel =
    micState === 'unsupported'
      ? 'Voice input not supported'
      : micListening
        ? 'Stop listening'
        : micState === 'error'
          ? 'Microphone error — try again'
          : 'Speak to AIra'

  return (
    <form
      onSubmit={onSubmit}
      className="shrink-0 border-t border-border/80 bg-card px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5"
    >
      <div
        className={cn(
          'flex items-end gap-1.5 rounded-[var(--radius-card)] border border-border bg-background p-1.5 shadow-[var(--shadow-sm)]',
          'focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-ring/20',
        )}
      >
        <label className="sr-only" htmlFor="aira-assistant-input">
          Message AIra Assistant
        </label>
        <textarea
          id="aira-assistant-input"
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled || micListening}
          placeholder={micListening ? 'Listening…' : 'Ask about AIra…'}
          className="max-h-[120px] min-h-[40px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
        {showMic ? (
          <button
            type="button"
            onClick={onMicToggle}
            disabled={disabled || micState === 'unsupported' || isBusy}
            aria-label={micLabel}
            aria-pressed={micListening}
            className={cn(
              'inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              micListening
                ? 'bg-rose-500 text-white'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              'disabled:opacity-40',
            )}
          >
            {micListening ? (
              <MicOff className="size-4" aria-hidden />
            ) : (
              <Mic className="size-4" aria-hidden />
            )}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={!canSend}
          aria-label={isBusy ? 'Sending' : 'Send message'}
          className={cn(
            'inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors',
            'hover:bg-accent/90 active:scale-[0.96]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:active:scale-100',
          )}
        >
          {isBusy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </form>
  )
}
