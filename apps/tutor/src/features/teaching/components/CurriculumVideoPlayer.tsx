import { useCallback, useEffect, useRef, useState } from 'react'
import type { CurriculumVideoResource } from '@/data/curriculumVideoResources'
import {
  englishTrackForResource,
  fetchVideoLanguages,
  readVideoProgress,
  requestVideoTranslate,
  subscribeVideoTrackStatus,
  writeVideoProgress,
} from '@/services/curriculumVideoService'
import type { VideoLanguageDto } from '@/services/curriculumVideoService'
import {
  coerceTtsLanguage,
  isEnglishTtsLanguage,
  ttsLanguageLabel,
  type TtsLanguageCode,
} from '@/constants/ttsLanguages'

type VideoEl = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void
  webkitExitFullscreen?: () => void
  webkitDisplayingFullscreen?: boolean
  webkitSupportsFullscreen?: boolean
}

export type CurriculumVideoPlayerProps = {
  resource: CurriculumVideoResource
  /** Teaching Settings language (Zustand). Never a player-local picker. */
  ttsLanguage?: string
  /** When false the node stays mounted (hidden by parent) — pause only, never remount. */
  active?: boolean
  onUserPlay?: () => void
  onShowDiagram?: () => void
}

const SYNC_TOLERANCE_S = 0.25

function isVideoFullscreen(video: VideoEl): boolean {
  if (typeof document !== 'undefined' && document.fullscreenElement === video) return true
  return Boolean(video.webkitDisplayingFullscreen)
}

async function enterVideoFullscreen(video: VideoEl): Promise<void> {
  if (isVideoFullscreen(video)) return
  try {
    if (typeof video.webkitEnterFullscreen === 'function' && video.webkitSupportsFullscreen !== false) {
      video.webkitEnterFullscreen()
      return
    }
  } catch {
    /* fall through to Fullscreen API */
  }
  if (video.requestFullscreen) {
    await video.requestFullscreen({ navigationUI: 'hide' }).catch(async () => {
      await video.requestFullscreen()
    })
  }
}

async function lockLandscape(): Promise<void> {
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (type: string) => Promise<void>
    }
    await orientation.lock?.('landscape')
  } catch {
    /* lock only works in fullscreen on most browsers */
  }
}

function unlockOrientation(): void {
  try {
    screen.orientation?.unlock?.()
  } catch {
    /* ignore */
  }
}

function captionSrcLang(code: TtsLanguageCode): string {
  return code.split('-')[0]?.toLowerCase() || 'en'
}

function clampTime(el: HTMLMediaElement, t: number): number {
  const duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : Number.POSITIVE_INFINITY
  return Math.min(Math.max(0, t), duration)
}

function stopDubbedAudio(audio: HTMLAudioElement | null): void {
  if (!audio) return
  try {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  } catch {
    /* ignore */
  }
}

/**
 * Lesson video inside the teaching board.
 * Always plays the original MP4. Language from Teaching Settings swaps
 * dubbed <audio> + captions only — never remounts or changes video src.
 */
export default function CurriculumVideoPlayer({
  resource,
  ttsLanguage: ttsLanguageProp,
  active = true,
  onUserPlay,
  onShowDiagram,
}: CurriculumVideoPlayerProps) {
  const videoRef = useRef<VideoEl>(null)
  const dubbedAudioRef = useRef<HTMLAudioElement>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [preparingLabel, setPreparingLabel] = useState<string | null>(null)
  const englishTrack = englishTrackForResource(resource)
  const [captionSrc, setCaptionSrc] = useState(englishTrack?.captions || resource.captionsSrc)
  const [captionLang, setCaptionLang] = useState<TtsLanguageCode>(englishTrack?.language || 'en-IN')

  const ttsLanguage = coerceTtsLanguage(ttsLanguageProp)
  const usingDubRef = useRef(false)
  const nativeMutedForAutoplayRef = useRef(false)
  const syncingRef = useRef(false)
  const activeRef = useRef(active)
  activeRef.current = active

  const applyCaptions = useCallback((src: string, lang: TtsLanguageCode) => {
    setCaptionSrc(src)
    setCaptionLang(lang)
  }, [])

  const applyNativeEnglishAudio = useCallback(() => {
    const video = videoRef.current
    const audio = dubbedAudioRef.current
    usingDubRef.current = false
    stopDubbedAudio(audio)
    if (video && !nativeMutedForAutoplayRef.current) {
      video.muted = false
    }
    applyCaptions(englishTrack?.captions || resource.captionsSrc, englishTrack?.language || 'en-IN')
  }, [applyCaptions, englishTrack?.captions, englishTrack?.language, resource.captionsSrc])

  const syncAudioToVideo = useCallback((force = false) => {
    const video = videoRef.current
    const audio = dubbedAudioRef.current
    if (!video || !audio || !usingDubRef.current) return
    if (!Number.isFinite(audio.duration) || audio.readyState < 1) return
    const target = clampTime(audio, video.currentTime)
    const delta = Math.abs(audio.currentTime - target)
    if (!force && delta <= SYNC_TOLERANCE_S) return
    syncingRef.current = true
    try {
      audio.currentTime = target
    } catch {
      /* not seekable yet */
    }
    audio.playbackRate = video.playbackRate || 1
    window.setTimeout(() => {
      syncingRef.current = false
    }, 50)
  }, [])

  const playDubbedIfNeeded = useCallback(async () => {
    const video = videoRef.current
    const audio = dubbedAudioRef.current
    if (!video || !audio || !usingDubRef.current) return
    if (!activeRef.current) return
    video.muted = true
    syncAudioToVideo(true)
    audio.playbackRate = video.playbackRate || 1
    if (video.paused) {
      if (!audio.paused) audio.pause()
      return
    }
    try {
      await audio.play()
    } catch {
      /* wait for a user gesture; video can stay muted */
    }
  }, [syncAudioToVideo])

  useEffect(() => {
    setUnavailable(false)
  }, [resource.src, resource.id])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.setAttribute('x5-playsinline', 'true')

    const restoreTime = () => {
      const saved = readVideoProgress(resource.id)
      if (saved > 1 && saved < resource.durationSeconds - 2) {
        try {
          video.currentTime = saved
        } catch {
          /* currentTime can throw if the element is not seekable yet */
        }
      }
      if (usingDubRef.current) syncAudioToVideo(true)
    }

    const onError = () => {
      console.error(`[CurriculumVideoPlayer] Video unavailable: ${resource.src}`)
      setUnavailable(true)
    }

    video.addEventListener('loadedmetadata', restoreTime)
    video.addEventListener('error', onError)
    return () => {
      video.removeEventListener('loadedmetadata', restoreTime)
      video.removeEventListener('error', onError)
    }
  }, [resource.id, resource.src, resource.durationSeconds, syncAudioToVideo])

  useEffect(() => {
    const video = videoRef.current
    const audio = dubbedAudioRef.current
    if (!video) return

    const onPlay = () => {
      if (!activeRef.current) {
        if (!video.paused) video.pause()
        if (audio && !audio.paused) audio.pause()
        return
      }
      onUserPlay?.()
      if (usingDubRef.current) {
        video.muted = true
        void playDubbedIfNeeded()
      }
    }
    const onPause = () => {
      if (audio && !audio.paused) audio.pause()
    }
    const onSeeked = () => {
      syncAudioToVideo(true)
    }
    const onTimeUpdate = () => {
      if (!syncingRef.current) syncAudioToVideo(false)
    }
    const onRateChange = () => {
      if (audio && usingDubRef.current) audio.playbackRate = video.playbackRate || 1
    }
    const onEnded = () => {
      if (audio) {
        audio.pause()
        try {
          audio.currentTime = clampTime(audio, video.currentTime)
        } catch {
          /* ignore */
        }
      }
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('seeking', onSeeked)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('ratechange', onRateChange)
    video.addEventListener('ended', onEnded)
    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('seeking', onSeeked)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('ratechange', onRateChange)
      video.removeEventListener('ended', onEnded)
    }
  }, [onUserPlay, playDubbedIfNeeded, syncAudioToVideo])

  useEffect(() => {
    const video = videoRef.current
    const audio = dubbedAudioRef.current
    if (!video) return
    if (!active || unavailable) {
      if (!video.paused) video.pause()
      if (audio && !audio.paused) audio.pause()
      return
    }
    if (!resource.teachingPanel.autoPlay) return

    let cancelled = false
    const unmuteOnGesture = () => {
      if (usingDubRef.current) {
        video.muted = true
        void playDubbedIfNeeded()
      } else {
        video.muted = false
        nativeMutedForAutoplayRef.current = false
      }
      window.removeEventListener('pointerdown', unmuteOnGesture, true)
      window.removeEventListener('keydown', unmuteOnGesture, true)
    }

    const tryPlay = async () => {
      if (cancelled || video.error) return
      if (usingDubRef.current) {
        video.muted = true
        try {
          await video.play()
          await playDubbedIfNeeded()
        } catch {
          try {
            video.muted = true
            await video.play()
            window.addEventListener('pointerdown', unmuteOnGesture, { capture: true })
            window.addEventListener('keydown', unmuteOnGesture, { capture: true })
          } catch {
            /* native controls remain */
          }
        }
        return
      }
      try {
        video.muted = false
        nativeMutedForAutoplayRef.current = false
        await video.play()
      } catch {
        if (cancelled) return
        try {
          video.muted = true
          nativeMutedForAutoplayRef.current = true
          await video.play()
          window.addEventListener('pointerdown', unmuteOnGesture, { capture: true })
          window.addEventListener('keydown', unmuteOnGesture, { capture: true })
        } catch {
          /* native controls remain */
        }
      }
    }

    void tryPlay()
    return () => {
      cancelled = true
      window.removeEventListener('pointerdown', unmuteOnGesture, true)
      window.removeEventListener('keydown', unmuteOnGesture, true)
    }
  }, [active, unavailable, resource.id, resource.teachingPanel.autoPlay, playDubbedIfNeeded])

  useEffect(() => {
    let cancelled = false
    const audio = dubbedAudioRef.current
    const video = videoRef.current
    const label = ttsLanguageLabel(ttsLanguage)

    const attachDub = async (track: VideoLanguageDto) => {
      if (!audio || !video || !track.audioUrl) return false
      const absolute = new URL(track.audioUrl, window.location.href).href
      if (usingDubRef.current && audio.src === absolute && audio.readyState >= 1 && !audio.error) {
        applyCaptions(track.captionsUrl || englishTrack?.captions || resource.captionsSrc, track.code)
        setPreparingLabel(null)
        video.muted = true
        return true
      }
      const keepTime = video.currentTime
      const wasPlaying = !video.paused && activeRef.current
      audio.pause()
      const srcChanged = audio.src !== absolute
      if (srcChanged) {
        audio.src = track.audioUrl
      }
      try {
        await new Promise<void>((resolve, reject) => {
          const onReady = () => {
            cleanup()
            resolve()
          }
          const onErr = () => {
            cleanup()
            reject(new Error('dub-missing'))
          }
          const cleanup = () => {
            audio.removeEventListener('loadedmetadata', onReady)
            audio.removeEventListener('canplay', onReady)
            audio.removeEventListener('error', onErr)
          }
          if (!srcChanged && audio.readyState >= 1 && audio.src && !audio.error) {
            resolve()
            return
          }
          audio.addEventListener('loadedmetadata', onReady)
          audio.addEventListener('canplay', onReady)
          audio.addEventListener('error', onErr)
          audio.load()
        })
      } catch {
        return false
      }
      if (cancelled) return false
      usingDubRef.current = true
      video.muted = true
      try {
        audio.currentTime = clampTime(audio, keepTime)
      } catch {
        /* ignore */
      }
      audio.playbackRate = video.playbackRate || 1
      applyCaptions(track.captionsUrl || englishTrack?.captions || resource.captionsSrc, track.code)
      setPreparingLabel(null)
      if (wasPlaying && activeRef.current) {
        try {
          await audio.play()
        } catch {
          /* gesture retry via autoplay effect */
        }
      }
      return true
    }

    const applyFromLanguages = async (languages: VideoLanguageDto[]): Promise<'ready' | 'wait' | 'missing'> => {
      if (cancelled) return 'wait'
      if (isEnglishTtsLanguage(ttsLanguage)) {
        setPreparingLabel(null)
        applyNativeEnglishAudio()
        return 'ready'
      }
      const track = languages.find((l) => l.code === ttsLanguage)
      if (track?.status === 'ready' && track.audioUrl) {
        const ok = await attachDub(track)
        if (cancelled) return 'wait'
        if (ok) return 'ready'
        setPreparingLabel(label)
        applyNativeEnglishAudio()
        return 'missing'
      }
      // Keep English picture+audio immediately; request dub if needed.
      setPreparingLabel(label)
      applyNativeEnglishAudio()
      if (track?.status === 'queued') return 'wait'
      void requestVideoTranslate(resource.id, ttsLanguage)
      return 'wait'
    }

    const refresh = async (): Promise<'ready' | 'wait' | 'missing'> => {
      try {
        const languages = await fetchVideoLanguages(resource.id)
        if (cancelled) return 'wait'
        return await applyFromLanguages(languages)
      } catch {
        if (!cancelled && !isEnglishTtsLanguage(ttsLanguage)) {
          setPreparingLabel(label)
          applyNativeEnglishAudio()
        }
        return 'wait'
      }
    }

    if (isEnglishTtsLanguage(ttsLanguage)) {
      setPreparingLabel(null)
      applyNativeEnglishAudio()
    } else {
      setPreparingLabel(label)
      applyNativeEnglishAudio()
      void refresh()
    }

    const unsub = subscribeVideoTrackStatus(resource.id, (detail) => {
      if (detail.language && detail.language !== ttsLanguage) return
      void refresh()
    })
    const poll = window.setInterval(() => {
      if (cancelled || isEnglishTtsLanguage(ttsLanguage) || usingDubRef.current) return
      void refresh().then((result) => {
        if (result === 'missing' || result === 'ready') window.clearInterval(poll)
      })
    }, 3000)

    return () => {
      cancelled = true
      unsub()
      window.clearInterval(poll)
    }
  }, [ttsLanguage, resource.id, applyCaptions, applyNativeEnglishAudio, englishTrack?.captions, resource.captionsSrc])

  const persistTime = useCallback(() => {
    const t = videoRef.current?.currentTime
    if (typeof t === 'number') writeVideoProgress(resource.id, t)
  }, [resource.id])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onFs = () => {
      if (isVideoFullscreen(video)) void lockLandscape()
      else unlockOrientation()
    }

    video.addEventListener('fullscreenchange', onFs)
    video.addEventListener('webkitbeginfullscreen', onFs)
    video.addEventListener('webkitendfullscreen', onFs)
    document.addEventListener('fullscreenchange', onFs)

    return () => {
      video.removeEventListener('fullscreenchange', onFs)
      video.removeEventListener('webkitbeginfullscreen', onFs)
      video.removeEventListener('webkitendfullscreen', onFs)
      document.removeEventListener('fullscreenchange', onFs)
      unlockOrientation()
    }
  }, [])

  const title = resource.title.replace(/ Process$/i, '')
  const crumb = `Grade ${resource.gradeLevel} > ${resource.subject} > ${resource.chapterName} > ${resource.topicName}`

  return (
    <div
      className="curriculum-video-panel w-full h-full min-h-0 flex flex-col bg-[#0a0e1a] text-slate-100"
      role="region"
      aria-label={resource.title}
      data-curriculum-video=""
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <header className="curriculum-video-panel__header shrink-0 px-5 py-3 border-b border-[#1a1f3a]">
        <h2 className="text-[15px] font-semibold tracking-tight text-white leading-tight">
          {title}
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-400">
          {crumb}
          {preparingLabel && (
            <span className="ml-2 text-amber-300/90 font-medium" role="status">
              Preparing {preparingLabel}…
            </span>
          )}
          {onShowDiagram && (
            <>
              {' · '}
              <button
                type="button"
                onClick={onShowDiagram}
                className="text-slate-300 underline-offset-2 hover:underline"
              >
                Diagram
              </button>
            </>
          )}
        </p>
      </header>

      <div className="curriculum-video-stage flex-1 min-h-0 bg-black relative">
        {unavailable ? (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-6 text-center bg-[#0a0e1a]"
            role="status"
          >
            <p className="text-base font-semibold text-white">Video unavailable</p>
            <p className="text-sm text-slate-400">
              This lesson video could not be loaded. The file is missing from the app.
            </p>
          </div>
        ) : null}
        <video
          ref={videoRef}
          className="curriculum-video-el w-full h-full object-contain"
          src={resource.src}
          poster={resource.poster}
          preload={resource.teachingPanel.autoPlay ? 'auto' : 'metadata'}
          playsInline
          controls
          controlsList="nodownload"
          disablePictureInPicture
          onTimeUpdate={persistTime}
          onPause={persistTime}
          onDoubleClick={() => {
            const video = videoRef.current
            if (video) void enterVideoFullscreen(video)
          }}
          aria-label={resource.altText}
        >
          <track
            key={captionSrc}
            kind="captions"
            srcLang={captionSrcLang(captionLang)}
            label={ttsLanguageLabel(captionLang)}
            src={captionSrc}
            default
          />
        </video>
        <audio
          ref={dubbedAudioRef}
          preload="auto"
          aria-hidden
          className="absolute w-px h-px opacity-0 pointer-events-none"
        />
      </div>
    </div>
  )
}
