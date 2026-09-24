/** Cache-first curriculum content pipeline types (mirrors landing Firestore schema). */

export type TeachingStyle =
  | 'encouraging'
  | 'friendly'
  | 'disciplined'
  | 'professional'
  | 'interactive'

export const TEACHING_STYLES: TeachingStyle[] = [
  'encouraging',
  'friendly',
  'disciplined',
  'professional',
  'interactive',
]

export type ContentStatus =
  | 'REGISTERED'
  | 'QUEUED'
  | 'PENDING'
  | 'GENERATING_SCRIPT'
  | 'SCRIPT_READY'
  | 'GENERATING_TTS'
  | 'GENERATING_AUDIO'
  | 'VALIDATING'
  | 'READY'
  | 'FAILED'
  | 'STALE'

export type VisualActionType = 'highlight' | 'show' | 'clear'

export interface VisualActionEntry {
  highlightTarget: string
  action: VisualActionType
  startOffsetMs: number
  endOffsetMs?: number
}

export interface VisualRegistrySnapshot {
  topicId: string
  diagramKeys: string[]
  visualRegistryVersion: number
}

export interface CachedTeachingSegment {
  segmentId: string
  sequence: number
  stepId: string
  narration: string
  text?: string
  visualMarker?: string
  visualAction?: VisualActionType
  highlightTarget?: string
  visualActions?: VisualActionEntry[]
  audioUrl?: string
  audioStoragePath?: string
  audioDuration?: number
  duration?: number
  status: 'PENDING' | 'READY' | 'FAILED'
}

export interface CachedLessonPayload {
  status: ContentStatus
  topicId: string
  language: string
  teachingStyle: TeachingStyle
  contentVersion: number
  cacheKey?: string
  steps: import('@/types').TeachingStep[]
  segments: CachedTeachingSegment[]
  greetingTemplate: string
  visualRegistry?: VisualRegistrySnapshot
  message?: string
}

export interface LessonPosition {
  style: TeachingStyle
  language: string
  segmentIndex: number
  audioPosition: number
  contentVersion: number
  visualMarker?: string
  highlightTarget?: string
}

/** Map legacy profile teaching styles to pipeline styles. */
export function normalizeTeachingStyle(raw: string | undefined): TeachingStyle {
  const map: Record<string, TeachingStyle> = {
    encouraging: 'encouraging',
    friendly: 'friendly',
    disciplined: 'disciplined',
    professional: 'professional',
    interactive: 'interactive',
    mentor: 'encouraging',
    strict: 'disciplined',
  }
  return map[raw || ''] || 'friendly'
}

export const USE_CACHED_CURRICULUM = false
// FRONTEND-ONLY: forced off so courseRegistry uses curated local steps (EXTRACTION_REPORT.md)
