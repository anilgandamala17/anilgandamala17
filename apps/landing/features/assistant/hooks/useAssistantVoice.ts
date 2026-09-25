'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MicState } from '../types/assistant'

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: ((ev: Event) => void) | null
  onend: ((ev: Event) => void) | null
  onerror: ((ev: Event) => void) | null
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null
}

function detectSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

/**
 * Opt-in microphone: only starts after explicit user gesture.
 * Unsupported state is derived lazily on first toggle — no setState in effects.
 */
export function useAssistantVoice(onTranscript: (text: string) => void) {
  const [micState, setMicState] = useState<MicState>('idle')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const supportedRef = useRef<boolean | null>(null)
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  const ensureRecognition = useCallback((): boolean => {
    if (supportedRef.current === false) return false
    if (recognitionRef.current) return true

    const SR = detectSpeechRecognition()
    if (!SR) {
      supportedRef.current = false
      return false
    }

    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-IN'

    rec.onstart = () => setMicState('listening')
    rec.onend = () =>
      setMicState((s) => (s === 'listening' || s === 'processing' ? 'idle' : s))
    rec.onerror = () => setMicState('error')
    rec.onresult = (event) => {
      setMicState('processing')
      const text = event.results[0]?.[0]?.transcript?.trim()
      if (text) onTranscriptRef.current(text)
      setMicState('idle')
    }

    recognitionRef.current = rec
    supportedRef.current = true
    return true
  }, [])

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const toggle = useCallback(() => {
    if (!ensureRecognition() || !recognitionRef.current) {
      setMicState('unsupported')
      return
    }
    if (micState === 'listening') {
      recognitionRef.current.stop()
      setMicState('idle')
      return
    }
    try {
      recognitionRef.current.start()
    } catch {
      setMicState('error')
    }
  }, [ensureRecognition, micState])

  return {
    micState,
    toggle,
    isSupported: micState !== 'unsupported',
  }
}
