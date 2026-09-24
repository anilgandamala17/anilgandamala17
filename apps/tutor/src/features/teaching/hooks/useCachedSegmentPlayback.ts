import { useCallback, useEffect, useRef } from 'react'
import { emitVisualMarker } from '@/utils/visualSyncEngine'
import type { CachedTeachingSegment, LessonPosition, VisualActionEntry } from '@/types/contentPipeline'
import { analytics } from '@/services/analyticsService'
import type { ContentSource } from '@/services/analyticsTypes'

export type CachedPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error'

const POSITION_SAVE_INTERVAL_MS = 2000

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function segmentMarkerTarget(seg: CachedTeachingSegment): string {
  return seg.highlightTarget || seg.visualMarker || ''
}

function applyVisualClear(): void {
  window.dispatchEvent(new CustomEvent('visual-clear-highlight'))
  window.dispatchEvent(new CustomEvent('visual-clear-diagram'))
}

function applyVisualAction(action: CachedTeachingSegment['visualAction'], target: string): void {
  if (action === 'clear') {
    applyVisualClear()
    return
  }
  if (target) emitVisualMarker(target)
}

function waitForAudioReady(audio: HTMLAudioElement): Promise<void> {
  return new Promise((resolve) => {
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      resolve()
      return
    }
    audio.addEventListener('loadedmetadata', () => resolve(), { once: true })
    audio.addEventListener('error', () => resolve(), { once: true })
  })
}

interface PlayOptions {
  segments: CachedTeachingSegment[]
  topicId: string
  style: LessonPosition['style']
  language: string
  contentVersion: number
  stepId?: string
  /** Playback rate from accessibility TTS speed (0.5–2). */
  playbackRate?: number
  savedPosition?: LessonPosition
  isPausedRef: React.MutableRefObject<boolean>
  isStale: () => boolean
  userStoppedRef: React.MutableRefObject<boolean>
  onSpeakingChange: (speaking: boolean) => void
  saveLessonPosition: (topicId: string, position: LessonPosition) => void
}

export function useCachedSegmentPlayback() {
  const playbackGenRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const preloadRef = useRef<HTMLAudioElement | null>(null)
  const preloadUrlRef = useRef<string | null>(null)
  const positionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const firedActionsRef = useRef<Set<number>>(new Set())
  const endedActionsRef = useRef<Set<number>>(new Set())
  const stateRef = useRef<CachedPlaybackState>('idle')

  const clearPositionTimer = () => {
    if (positionTimerRef.current) {
      clearInterval(positionTimerRef.current)
      positionTimerRef.current = null
    }
  }

  const cleanupAudio = useCallback(() => {
    clearPositionTimer()
    firedActionsRef.current.clear()
    endedActionsRef.current.clear()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
      audioRef.current = null
    }
    if (preloadRef.current) {
      preloadRef.current.removeAttribute('src')
      preloadRef.current = null
      preloadUrlRef.current = null
    }
  }, [])

  const stopPlayback = useCallback(() => {
    playbackGenRef.current++
    cleanupAudio()
    stateRef.current = 'idle'
  }, [cleanupAudio])

  useEffect(() => {
    const onStop = () => stopPlayback()
    window.addEventListener('stop-speech', onStop)
    return () => {
      window.removeEventListener('stop-speech', onStop)
      stopPlayback()
    }
  }, [stopPlayback])

  const preloadNext = (url: string | undefined) => {
    if (!url || preloadUrlRef.current === url) return
    if (preloadRef.current) {
      preloadRef.current.removeAttribute('src')
      preloadRef.current = null
    }
    const pre = new Audio()
    pre.preload = 'auto'
    pre.src = url
    preloadRef.current = pre
    preloadUrlRef.current = url
  }

  const takeAudioForUrl = (url: string): HTMLAudioElement => {
    if (preloadRef.current && preloadUrlRef.current === url) {
      const pre = preloadRef.current
      preloadRef.current = null
      preloadUrlRef.current = null
      return pre
    }
    return new Audio(url)
  }

  const handleVisualActions = (seg: CachedTeachingSegment, ms: number) => {
    if (!seg.visualActions?.length) return
    seg.visualActions.forEach((va: VisualActionEntry, idx) => {
      if (!firedActionsRef.current.has(idx) && ms >= va.startOffsetMs) {
        firedActionsRef.current.add(idx)
        applyVisualAction(va.action, va.highlightTarget)
      }
      if (
        va.endOffsetMs != null &&
        ms >= va.endOffsetMs &&
        firedActionsRef.current.has(idx) &&
        !endedActionsRef.current.has(idx)
      ) {
        endedActionsRef.current.add(idx)
        applyVisualClear()
      }
    })
  }

  const playCachedSegments = useCallback(async (opts: PlayOptions): Promise<void> => {
    const runId = ++playbackGenRef.current
    cleanupAudio()
    stateRef.current = 'loading'

    const sorted = [...opts.segments].sort((a, b) => a.sequence - b.sequence)
    const isRunStale = () => runId !== playbackGenRef.current || opts.isStale()

    const saved = opts.savedPosition
    const versionMatch = !saved || saved.contentVersion === opts.contentVersion
    const langMatch = !saved || saved.language === opts.language
    const styleMatch = !saved || saved.style === opts.style

    let startIdx = versionMatch && langMatch && styleMatch ? (saved?.segmentIndex ?? 0) : 0
    let startAt = versionMatch && langMatch && styleMatch ? (saved?.audioPosition ?? 0) : 0

    if (startIdx >= sorted.length) {
      startIdx = 0
      startAt = 0
    }

    if (saved?.highlightTarget && versionMatch && langMatch && styleMatch) {
      applyVisualAction('highlight', saved.highlightTarget)
    }

    // Do not set speaking / speech-start until audio actually plays (autoplay may be blocked).
    stateRef.current = 'playing'
    let autoplayBlocked = false
    let didStartAny = false

    const savePosition = (segIndex: number, audioPos: number, seg: CachedTeachingSegment) => {
      opts.saveLessonPosition(opts.topicId, {
        style: opts.style,
        language: opts.language,
        segmentIndex: segIndex,
        audioPosition: audioPos,
        contentVersion: opts.contentVersion,
        visualMarker: seg.visualMarker,
        highlightTarget: seg.highlightTarget,
      })
    }

    for (let i = startIdx; i < sorted.length; i++) {
      if (isRunStale()) return
      if (opts.userStoppedRef.current) {
        opts.userStoppedRef.current = false
        opts.onSpeakingChange(false)
        window.dispatchEvent(new CustomEvent('speech-end', { detail: { stepId: opts.stepId } }))
        return
      }

      while (opts.isPausedRef.current && !isRunStale() && !opts.userStoppedRef.current) {
        stateRef.current = 'paused'
        await sleep(80)
      }
      if (isRunStale()) return

      stateRef.current = 'playing'
      const seg = sorted[i]
      const target = segmentMarkerTarget(seg)

      if (i > 0) {
        const prevTarget = segmentMarkerTarget(sorted[i - 1])
        if (prevTarget && prevTarget !== target) {
          applyVisualClear()
        }
      }

      if (target && seg.visualAction !== 'clear') {
        applyVisualAction(seg.visualAction || 'highlight', target)
      } else if (seg.visualAction === 'clear') {
        applyVisualClear()
      }

      const nextSeg = sorted[i + 1]
      if (nextSeg?.audioUrl) preloadNext(nextSeg.audioUrl)

      if (!seg.narration?.trim() && !seg.audioUrl) continue

      if (seg.audioUrl) {
        await new Promise<void>((resolve) => {
          if (isRunStale()) {
            resolve()
            return
          }

          const audio = takeAudioForUrl(seg.audioUrl!)
          audioRef.current = audio
          firedActionsRef.current.clear()
          endedActionsRef.current.clear()

          const startOffset = i === startIdx ? startAt : 0

          const beginPlayback = () => {
            analytics.audioLoadStarted(opts.topicId, 'cached', i)
            audio.currentTime = startOffset
            const rate = Math.min(2, Math.max(0.5, opts.playbackRate ?? 1))
            audio.playbackRate = rate
            const captionSource = seg.narration?.trim() || ''

            audio.onplay = () => {
              if (!didStartAny) {
                didStartAny = true
                window.dispatchEvent(new CustomEvent('speech-start', { detail: { stepId: opts.stepId } }))
                analytics.audioPlayStarted(opts.topicId, 'cached' as ContentSource, i)
              }
              opts.onSpeakingChange(true)
              if (captionSource) {
                window.dispatchEvent(new CustomEvent('speech-active-chunk', { detail: { chunkText: captionSource } }))
                window.dispatchEvent(new CustomEvent('speech-caption-progress', {
                  detail: { chunkText: captionSource, progress: 0 },
                }))
              }
            }
            audio.onpause = () => {
              if (opts.isPausedRef.current) {
                opts.onSpeakingChange(false)
                analytics.audioPaused(opts.topicId, i)
              }
            }
            audio.ontimeupdate = () => {
              handleVisualActions(seg, audio.currentTime * 1000)
              if (!captionSource || !Number.isFinite(audio.duration) || audio.duration <= 0) return
              const progress = Math.min(1, Math.max(0, audio.currentTime / audio.duration))
              window.dispatchEvent(new CustomEvent('speech-caption-progress', {
                detail: { chunkText: captionSource, progress },
              }))
            }
            audio.onended = () => {
              clearPositionTimer()
              savePosition(i + 1, 0, seg)
              analytics.audioCompleted(opts.topicId, 'cached' as ContentSource, i)
              resolve()
            }
            audio.onerror = () => {
              clearPositionTimer()
              console.warn('[cachedPlayback] audio error for segment', seg.segmentId)
              analytics.audioLoadFailed(opts.topicId, 'audio_decode', 'cached', i)
              resolve()
            }

            positionTimerRef.current = setInterval(() => {
              if (!audioRef.current || audio.paused) return
              savePosition(i, audio.currentTime, seg)
            }, POSITION_SAVE_INTERVAL_MS)

            const playPromise = audio.play()
            if (playPromise) {
              playPromise.catch((err: unknown) => {
                clearPositionTimer()
                const name = err && typeof err === 'object' && 'name' in err ? String((err as { name?: string }).name) : ''
                const message = err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message) : String(err ?? '')
                const blocked =
                  name === 'NotAllowedError' ||
                  /not allowed|user (gesture|didn't interact|interaction)/i.test(message)
                if (blocked) {
                  autoplayBlocked = true
                  opts.onSpeakingChange(false)
                  analytics.audioLoadFailed(opts.topicId, 'not_allowed', 'cached', i)
                  window.dispatchEvent(
                    new CustomEvent('speech-autoplay-blocked', { detail: { topicId: opts.topicId } }),
                  )
                } else {
                  console.warn('[cachedPlayback] audio play rejected:', message)
                  analytics.audioLoadFailed(opts.topicId, 'network', 'cached', i)
                }
                resolve()
              })
            }
          }

          void waitForAudioReady(audio).then(beginPlayback)
        })
        startAt = 0
        if (autoplayBlocked) break
      } else if (seg.narration?.trim()) {
        savePosition(i + 1, 0, seg)
      }

      if (isRunStale()) return
    }

    cleanupAudio()
    if (autoplayBlocked) {
      // Leave idle so a later gesture / Start listening can retry from the same position.
      stateRef.current = 'idle'
      opts.onSpeakingChange(false)
      return
    }

    stateRef.current = 'completed'
    opts.onSpeakingChange(false)
    if (didStartAny) {
      window.dispatchEvent(new CustomEvent('speech-end', { detail: { stepId: opts.stepId } }))
    }
  }, [cleanupAudio])

  return { playCachedSegments, stopPlayback, stateRef, audioRef }
}
