/**
 * FUTURE BACKEND:
 * GET  /api/content/lesson?topicId&language&style&version → CachedLessonPayload
 * POST /api/content/greeting-tts { firstName, language, style } → { text, audioUrl }
 * NOW: mockAdapter (cache miss → curated local scripts in courseRegistry)
 */

import type { CachedLessonPayload, TeachingStyle } from '../types/contentPipeline'
import { normalizeTeachingStyle } from '../types/contentPipeline'
import { mockAdapter } from './adapters/mockAdapter'

const memoryCache = new Map<string, CachedLessonPayload>()

export type CacheFetchFailureReason =
  | 'auth-failure'
  | 'not-ready'
  | 'network-error'
  | 'cache-miss'
  | 'no-ready-steps'

export interface CachedLessonFetchResult {
  lesson: CachedLessonPayload | null
  httpStatus?: number
  failureReason?: CacheFetchFailureReason
}

function cacheKey(topicId: string, language: string, style: TeachingStyle, version?: number) {
  return `${topicId}:${language}:${style}:v${version ?? 'latest'}`
}

export async function fetchCachedLessonDetailed(
  topicId: string,
  language: string,
  teachingStyle: TeachingStyle | string,
  contentVersion?: number,
): Promise<CachedLessonFetchResult> {
  const style = normalizeTeachingStyle(teachingStyle)
  const key = cacheKey(topicId, language, style, contentVersion)
  const cached = memoryCache.get(key)
  if (cached?.status === 'READY') return { lesson: cached }

  const result = await mockAdapter.fetchCachedLesson(topicId, language, style, contentVersion)
  return { lesson: result.lesson, failureReason: result.failureReason }
}

export async function fetchCachedLesson(
  topicId: string,
  language: string,
  teachingStyle: TeachingStyle | string,
  contentVersion?: number,
): Promise<CachedLessonPayload | null> {
  const { lesson } = await fetchCachedLessonDetailed(
    topicId,
    language,
    teachingStyle,
    contentVersion,
  )
  return lesson
}

export async function fetchGreetingAudio(
  firstName: string,
  language: string,
  teachingStyle: TeachingStyle | string,
): Promise<{ text: string; audioUrl: string | null } | null> {
  const style = normalizeTeachingStyle(teachingStyle)
  return mockAdapter.fetchGreetingAudio(firstName, language, style)
}

export function clearLessonMemoryCache(): void {
  memoryCache.clear()
}

export function clearLessonMemoryCacheForTopic(topicId: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(`${topicId}:`)) memoryCache.delete(key)
  }
}

export function cachedSegmentsToSpokenContent(
  segments: CachedLessonPayload['segments'],
): string {
  return segments
    .sort((a, b) => a.sequence - b.sequence)
    .map((s) => {
      const markerKey = s.highlightTarget || s.visualMarker
      if (markerKey && !s.narration?.trim()) {
        return `[VISUAL:${markerKey}]`
      }
      const marker = markerKey ? `[VISUAL:${markerKey}] ` : ''
      return `${marker}${s.narration || ''}`.trim()
    })
    .filter(Boolean)
    .join('\n\n')
}
