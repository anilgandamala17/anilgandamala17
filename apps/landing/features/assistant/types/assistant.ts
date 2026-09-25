export type AssistantRole = 'user' | 'assistant' | 'system'

export type AssistantMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  /** When true, message is an error bubble with retry affordance */
  isError?: boolean
}

export type AssistantAction = {
  id: string
  label: string
  description?: string
  /** Query to send when clicked (chat) */
  query?: string
  /** In-app path from centralized routes */
  href?: string
}

export type AssistantStatus =
  | 'ready'
  | 'thinking'
  | 'listening'
  | 'speaking'
  | 'error'
  | 'offline'

export type MicState = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported'
