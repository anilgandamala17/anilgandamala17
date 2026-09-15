'use client'

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  BookOpen,
  MessageSquare,
  Play,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/site'

type FeatureItem = {
  icon: LucideIcon
  title: string
  description: string
  iconClass: string
  videoUrl: string
  /** Slight crop bias to hide incidental source text when needed */
  mediaClass?: string
}

const FEATURES: FeatureItem[] = [
  {
    icon: BookOpen,
    title: 'AI Teaching',
    description:
      'Personalized learning paths powered by advanced AI algorithms adapted to your learning style.',
    iconClass: 'from-blue-600 to-blue-800',
    videoUrl: '/videos/AI_Powered_Personalized_Learning_Video.mp4',
  },
  {
    icon: Zap,
    title: 'Smart Curriculum',
    description:
      'Comprehensive courses covering JEE, NEET, and more with expert-curated content.',
    iconClass: 'from-teal-600 to-teal-800',
    videoUrl: '/videos/Smart_Curriculum_Video_Generated.mp4',
  },
  {
    icon: Trophy,
    title: 'Competitive Mode',
    description:
      'Challenge yourself with timed tests and compete with peers on the leaderboard.',
    iconClass: 'from-amber-600 to-orange-700',
    videoUrl: '/videos/Curriculum_Mode_Video_Generation.mp4',
    // Crop edges where incidental source labels (e.g. "Biology") can bleed through
    mediaClass: 'scale-[1.18] object-[center_40%]',
  },
  {
    icon: MessageSquare,
    title: 'Live Q&A',
    description:
      'Get instant answers from AI tutors and experienced educators 24/7.',
    iconClass: 'from-sky-600 to-blue-800',
    videoUrl: '/videos/counselor.mp4',
  },
]

/** Soft brand duotone — unifies mismatched source footage palettes. */
function BrandDuotone({ stronger }: { stronger?: boolean }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-[1] mix-blend-color',
        stronger ? 'bg-primary/45' : 'bg-primary/35',
      )}
      aria-hidden
    />
  )
}

/** Corner vignette to obscure edge bleed from source footage. */
function EdgeScrim() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2]"
      aria-hidden
      style={{
        background:
          'radial-gradient(ellipse 85% 75% at 50% 45%, transparent 45%, rgb(15 23 42 / 0.55) 100%)',
      }}
    />
  )
}

function AiraMark() {
  return (
    <span
      className="pointer-events-none absolute bottom-3 right-3 z-[4] rounded-md bg-slate-950/55 px-2 py-1 text-[11px] font-bold tracking-tight text-white shadow-[var(--shadow-sm)] backdrop-blur-sm ring-1 ring-white/25 md:bottom-4 md:right-4 md:text-xs"
      aria-hidden
    >
      {BRAND.name}
    </span>
  )
}

function GlassPlayButton({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center rounded-full border border-white/55 bg-white/25 text-white shadow-[var(--shadow-md)] backdrop-blur-md',
        'transition-transform duration-200 ease-out group-hover/media:scale-110 motion-reduce:group-hover/media:scale-100',
        size === 'sm' && 'size-11',
        size === 'md' && 'size-14 md:size-16',
        size === 'lg' && 'size-16 md:size-20',
        className,
      )}
    >
      <span
        className="absolute inset-0 rounded-full bg-white/20 motion-safe:animate-[play-pulse_2.4s_ease-out_infinite] motion-reduce:hidden"
        aria-hidden
      />
      <Play
        className={cn(
          'relative fill-white text-white drop-shadow-sm',
          size === 'sm' && 'size-4 translate-x-px',
          size === 'md' && 'size-5 translate-x-0.5 md:size-6',
          size === 'lg' && 'size-7 translate-x-0.5 md:size-8',
        )}
        aria-hidden
      />
    </span>
  )
}

function FeatureCardShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-[var(--shadow-sm)]',
        'transition-[transform,box-shadow] duration-200 ease-out',
        'hover:-translate-y-1 hover:shadow-[var(--shadow-md)]',
        'motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      {children}
    </article>
  )
}

function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || inView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px 0px', threshold: 0.08 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [inView])

  return { ref, inView }
}

function waitForVideoReady(video: HTMLVideoElement) {
  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const onReady = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('Video failed to load'))
    }
    const cleanup = () => {
      video.removeEventListener('canplay', onReady)
      video.removeEventListener('error', onError)
    }
    video.addEventListener('canplay', onReady)
    video.addEventListener('error', onError)
  })
}

/** Lazy, click-to-play video with unified brand grade. */
function LazyFeatureVideo({
  src,
  title,
  mediaClass,
  showMark,
  poster,
}: {
  src: string
  title: string
  mediaClass?: string
  showMark?: boolean
  poster?: string
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const playingRef = useRef(false)
  const { ref: hostRef, inView } = useInViewOnce<HTMLDivElement>()
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const labelId = useId()

  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !inView) return

    const primePreviewFrame = () => {
      if (playingRef.current) return
      try {
        video.currentTime = Math.min(0.8, (video.duration || 1) * 0.05)
        video.pause()
      } catch {
        /* seek may fail on some browsers */
      }
      setReady(true)
      setLoadError(false)
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      primePreviewFrame()
    } else {
      video.addEventListener('loadeddata', primePreviewFrame, { once: true })
    }

    const onError = () => setLoadError(true)
    video.addEventListener('error', onError)
    return () => {
      video.removeEventListener('loadeddata', primePreviewFrame)
      video.removeEventListener('error', onError)
    }
  }, [inView, src])

  const start = async () => {
    const video = videoRef.current
    if (!video || loadError) return

    try {
      await waitForVideoReady(video)
      video.currentTime = 0
      video.muted = false
      await video.play()
      setPlaying(true)
    } catch {
      try {
        video.muted = true
        await video.play()
        setPlaying(true)
      } catch {
        setLoadError(true)
      }
    }
  }

  const handleEnded = () => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.currentTime = 0
    setPlaying(false)
  }

  return (
    <div
      ref={hostRef}
      className="group/media relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"
    >
      {!src ? (
        <div
          className="absolute inset-0 z-[2] flex items-center justify-center bg-slate-800 px-4 text-center text-xs text-slate-300"
          role="img"
          aria-label={`${title} preview unavailable`}
        >
          Preview unavailable
        </div>
      ) : inView ? (
        <video
          ref={videoRef}
          className={cn(
            'absolute inset-0 z-[1] h-full w-full object-cover',
            mediaClass,
            !playing && ready && 'brightness-[0.92]',
            playing && 'z-[3] brightness-100',
          )}
          playsInline
          preload="metadata"
          poster={poster}
          controls={playing}
          onPlay={() => setPlaying(true)}
          onEnded={handleEnded}
          aria-labelledby={labelId}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element -- lightweight poster before lazy video mounts
        <img
          src={poster}
          alt=""
          className={cn(
            'absolute inset-0 z-[1] h-full w-full object-cover',
            mediaClass,
          )}
          aria-hidden
        />
      ) : null}

      {!playing && src ? (
        <>
          {!ready && !loadError ? (
            <div className="absolute inset-0 z-[2] bg-slate-800" aria-hidden />
          ) : null}
          {loadError ? (
            <div className="absolute inset-0 z-[2] flex items-center justify-center bg-slate-800 px-4 text-center text-xs text-slate-300">
              Preview unavailable
            </div>
          ) : null}
          <BrandDuotone stronger />
          <EdgeScrim />
          {showMark ? <AiraMark /> : null}
          <div
            className="pointer-events-none absolute inset-0 z-[4] bg-slate-950/15 transition-colors duration-200 group-hover/media:bg-slate-950/30"
            aria-hidden
          />
          <button
            type="button"
            onClick={start}
            disabled={loadError}
            className="absolute inset-0 z-[5] flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:cursor-not-allowed"
            aria-label={`Play ${title} video`}
          >
            <GlassPlayButton size="md" />
          </button>
        </>
      ) : (
        showMark ? <AiraMark /> : null
      )}

      <span id={labelId} className="sr-only">
        {title} feature video
      </span>
    </div>
  )
}

function HeroExplainerCard() {
  return (
    <FeatureCardShell className="mx-auto mb-10 max-w-4xl md:mb-16">
      <LazyFeatureVideo
        src="/videos/explainer.mp4"
        title="Meet Your Personal AI Instructor"
        poster="/images/explainer_poster.png"
        showMark
      />

      <div className="bg-neutral-50 px-5 py-5 md:px-7 md:py-6">
        <p className="text-lg font-bold tracking-tight text-foreground md:text-xl">
          Meet Your Personal AI Instructor
        </p>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Learn how {BRAND.name} is transforming education through personalized
          AI guidance.
        </p>
      </div>
    </FeatureCardShell>
  )
}

function FeatureCard({ feature }: { feature: FeatureItem }) {
  const Icon = feature.icon

  return (
    <FeatureCardShell>
      <LazyFeatureVideo
        src={feature.videoUrl}
        title={feature.title}
        mediaClass={feature.mediaClass}
      />
      <div className="flex flex-1 flex-col bg-neutral-50 px-5 py-5 md:px-6 md:py-6">
        <div
          className={cn(
            'mb-3 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[var(--shadow-sm)] md:size-11',
            feature.iconClass,
          )}
          aria-hidden
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
        <h3 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
          {feature.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
          {feature.description}
        </p>
      </div>
    </FeatureCardShell>
  )
}

export function Features() {
  return (
    <section
      id="features"
      className="relative isolate overflow-hidden bg-gradient-to-b from-primary-muted/40 via-background to-background py-[var(--section-py-mobile)] md:py-[var(--section-py-desktop)]"
    >
      <div className="pointer-events-none absolute inset-0 z-0 select-none" aria-hidden>
        <svg
          className="absolute top-[-8%] right-[-12%] h-[950px] w-[950px] opacity-[0.22]"
          viewBox="0 0 800 800"
          fill="none"
        >
          <circle
            cx="400"
            cy="400"
            r="380"
            stroke="#1d4ed8"
            strokeWidth="1.5"
            strokeDasharray="2 12"
            strokeOpacity="0.7"
          />
          <circle
            cx="400"
            cy="400"
            r="320"
            stroke="#1d4ed8"
            strokeWidth="2"
            strokeDasharray="6 20"
            strokeOpacity="0.5"
          />
        </svg>
        <svg
          className="absolute bottom-[-12%] left-[-12%] h-[850px] w-[850px] opacity-[0.18]"
          viewBox="0 0 800 800"
          fill="none"
        >
          <circle
            cx="400"
            cy="400"
            r="360"
            stroke="#0f766e"
            strokeWidth="1.5"
            strokeDasharray="4 12"
            strokeOpacity="0.7"
          />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 text-center md:mb-14">
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:mb-4 md:text-5xl">
            Why Choose <span className="text-primary">{BRAND.name}</span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground md:text-lg">
            Experience a revolution in online education with cutting-edge AI
            technology, designed for modern learners.
          </p>
        </div>

        <HeroExplainerCard />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
