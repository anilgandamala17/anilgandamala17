/**
 * FUTURE BACKEND:
 * GET  /api/curriculum/topics/:topicId/resources?type=video
 * GET  /api/videos/:videoId
 * GET  /api/videos/:videoId/languages
 * POST /api/videos/:videoId/translate  { target_language }
 * POST /api/v1/curriculum/grade12/biology/ch1-reproduction/topic2-fertilization/resources
 * NOW: mockAdapter.*(…) — pages must not fetch those URLs directly.
 */

import { mockAdapter, VIDEO_TRACK_STATUS_EVENT, type VideoLanguageDto, type VideoTranslateDto } from './adapters/mockAdapter'
import {
  catalogAudioTrack,
  getPublishedVideoById,
  getPublishedVideoForTopic,
  isVideoOnlyTopic,
  type CurriculumVideoAudioTrack,
  type CurriculumVideoResource,
} from '../data/curriculumVideoResources'
import { isEnglishTtsLanguage, type TtsLanguageCode } from '../constants/ttsLanguages'

export type { CurriculumVideoResource, CurriculumVideoAudioTrack, VideoLanguageDto, VideoTranslateDto }
export { isVideoOnlyTopic }

/** Synchronous lookup for teaching-panel first paint. */
export function getTopicVideoResource(topicId: string): CurriculumVideoResource | null {
  return getPublishedVideoForTopic(topicId)
}

export function getVideoResourceById(videoId: string): CurriculumVideoResource | null {
  return getPublishedVideoById(videoId)
}

export function getCatalogAudioTrack(
  resource: CurriculumVideoResource,
  language: TtsLanguageCode,
): CurriculumVideoAudioTrack | null {
  return catalogAudioTrack(resource, language)
}

export async function fetchTopicVideoResources(
  topicId: string,
): Promise<CurriculumVideoResource[]> {
  return mockAdapter.listTopicVideoResources(topicId)
}

export async function fetchVideo(videoId: string): Promise<CurriculumVideoResource | null> {
  return mockAdapter.getVideo(videoId)
}

export async function fetchVideoLanguages(videoId: string): Promise<VideoLanguageDto[]> {
  const { languages } = await mockAdapter.getVideoLanguages(videoId)
  return languages
}

export async function requestVideoTranslate(
  videoId: string,
  targetLanguage: TtsLanguageCode,
): Promise<VideoTranslateDto> {
  return mockAdapter.translateVideo(videoId, { target_language: targetLanguage })
}

export function subscribeVideoTrackStatus(
  videoId: string,
  onChange: (detail: { videoId: string; language: string; status: string }) => void,
): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (event: Event) => {
    const detail = (event as CustomEvent).detail as
      | { videoId?: string; language?: string; status?: string }
      | undefined
    if (!detail?.videoId || detail.videoId !== videoId) return
    onChange({
      videoId: detail.videoId,
      language: detail.language || '',
      status: detail.status || '',
    })
  }
  window.addEventListener(VIDEO_TRACK_STATUS_EVENT, handler)
  return () => window.removeEventListener(VIDEO_TRACK_STATUS_EVENT, handler)
}

export function englishTrackForResource(resource: CurriculumVideoResource): CurriculumVideoAudioTrack | null {
  return (
    resource.video_audio_tracks.find((t) => isEnglishTtsLanguage(t.language)) ??
    resource.video_audio_tracks[0] ??
    null
  )
}

const PROGRESS_KEY = (id: string) => `aira:video-progress:${id}`

export function readVideoProgress(resourceId: string): number {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY(resourceId))
    const n = raw ? Number(raw) : 0
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function writeVideoProgress(resourceId: string, timeSeconds: number): void {
  try {
    localStorage.setItem(PROGRESS_KEY(resourceId), String(Math.max(0, timeSeconds)))
  } catch {
    /* ignore */
  }
}
