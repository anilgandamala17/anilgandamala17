/**
 * FUTURE BACKEND:
 * POST /api/tts  { text, language?, speaker?, pace? } → audio/mpeg
 * GET  /api/tts/health → { ok: boolean }
 * NOW: mockAdapter.fetchTtsAudio → callers use browser SpeechSynthesis
 */

import { mockAdapter } from '../services/adapters/mockAdapter'

export type TtsFetchOptions = {
  text: string
  language?: string
  speaker?: string
  pace?: number
  signal?: AbortSignal
}

/** Normalize a /api/tts Response into a playable audio Blob (future backend). */
export async function parseTtsResponseToBlob(_res: Response): Promise<Blob> {
  throw new Error('TTS response parsing reserved for future backend /api/tts')
}

export async function fetchTtsAudioBlob(opts: TtsFetchOptions): Promise<Blob> {
  const text = typeof opts.text === 'string' ? opts.text.trim() : ''
  if (!text) throw new Error('Missing TTS text')
  if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return mockAdapter.fetchTtsAudio({
    text,
    language: opts.language,
    speaker: opts.speaker,
    pace: opts.pace,
  })
}
