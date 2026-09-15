/**
 * FUTURE BACKEND:
 * POST /api/tts  { text, language? } → audio/mpeg
 * NOW: mockAdapter.tts(...) → callers use browser speech
 */

import { mockAdapter } from './mockAdapter'

export async function fetchLandingTtsAudio(opts: {
  text: string
  language?: string
}): Promise<Blob> {
  return mockAdapter.tts(opts)
}
