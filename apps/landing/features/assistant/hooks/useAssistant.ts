'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { sendAssistantMessage } from '../services/assistantService'
import {
  INITIAL_ACTIONS,
  WELCOME_MESSAGE,
  suggestionsForContext,
} from '../data/assistantSuggestions'
import type { AssistantAction, AssistantMessage, AssistantStatus } from '../types/assistant'

let messageSeq = 0

function uid() {
  messageSeq += 1
  return `msg-${messageSeq}`
}

function createWelcomeMessage(): AssistantMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    content: WELCOME_MESSAGE,
    createdAt: 0,
  }
}

function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

export function useAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [createWelcomeMessage()])
  const [status, setStatus] = useState<AssistantStatus>('ready')
  const [actions, setActions] = useState<AssistantAction[]>(INITIAL_ACTIONS)
  const [errorRetryText, setErrorRetryText] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const sendingRef = useRef(false)

  const resetConversation = useCallback(() => {
    abortRef.current?.abort()
    sendingRef.current = false
    setMessages([createWelcomeMessage()])
    setActions(INITIAL_ACTIONS)
    setStatus('ready')
    setErrorRetryText(null)
  }, [])

  const send = useCallback(async (raw: string) => {
    const text = raw.trim()
    if (!text || sendingRef.current) return

    if (isOffline()) {
      setStatus('offline')
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: "You're offline. Check your connection and try again.",
          createdAt: Date.now(),
          isError: true,
        },
      ])
      setErrorRetryText(text)
      return
    }

    sendingRef.current = true
    setErrorRetryText(null)
    setStatus('thinking')

    const userMsg: AssistantMessage = {
      id: uid(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    }

    let historySnapshot: AssistantMessage[] = []
    setMessages((prev) => {
      historySnapshot = [...prev, userMsg]
      return historySnapshot
    })
    setActions(suggestionsForContext(text))

    try {
      const { content, topic } = await sendAssistantMessage(text, historySnapshot)
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content,
          createdAt: Date.now(),
        },
      ])
      if (topic?.nextActions?.length) {
        setActions(
          topic.nextActions.slice(0, 4).map((a, i) => ({
            id: `${topic.id}-${i}`,
            label: a.label,
            query: a.query,
            href: a.href,
          })),
        )
      } else {
        setActions(suggestionsForContext(text))
      }
      setStatus('ready')
    } catch {
      setStatus('error')
      setErrorRetryText(text)
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          createdAt: Date.now(),
          isError: true,
        },
      ])
    } finally {
      sendingRef.current = false
    }
  }, [])

  const retry = useCallback(() => {
    if (errorRetryText) void send(errorRetryText)
  }, [errorRetryText, send])

  useEffect(() => {
    const controller = abortRef.current
    return () => controller?.abort()
  }, [])

  return {
    messages,
    status,
    actions,
    isBusy: status === 'thinking',
    send,
    retry,
    resetConversation,
    setActions,
  }
}
