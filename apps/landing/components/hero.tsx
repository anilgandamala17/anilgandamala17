'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, Trophy, Headphones, type LucideIcon } from 'lucide-react'
import { CTAS, HERO_TRUST, BRAND } from '@/lib/site'
import { AuthEntryLink } from '@/components/auth-entry-link'

/**
 * Elite-matched hero fold (height / stage mins) + soft radial vignette image
 * (same as aira-landing-page-elite). No + grid background.
 */
const floatingCards: ReadonlyArray<{
  icon: LucideIcon
  title: string
  subtitle: string
  className: string
  delay: string
}> = [
  {
    icon: BookOpen,
    title: 'Grades 6–12',
    subtitle: 'curriculum ready',
    className: 'top-6 left-0 sm:top-10 sm:-left-2 md:-left-4',
    delay: '0s',
  },
  {
    icon: Trophy,
    title: 'JEE · NEET',
    subtitle: 'exam prep',
    className: 'bottom-16 right-0 sm:bottom-20 sm:-right-2 md:-right-4',
    delay: '0.4s',
  },
  {
    icon: Headphones,
    title: '24/7',
    subtitle: 'AI support',
    className:
      'top-1/2 -translate-y-1/2 -right-1 sm:right-0 md:-right-8 hidden sm:flex',
    delay: '0.8s',
  },
]

function HeroFloatCard({
  icon: Icon,
  title,
  subtitle,
  className,
  delay,
}: (typeof floatingCards)[number]) {
  return (
      <div
        className={`glass-panel absolute z-20 flex items-center gap-2.5 rounded-[var(--radius-card)] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 ${className}`}
        style={{ animation: `float-soft 4.5s ease-in-out ${delay} infinite` }}
      >
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-btn)] bg-primary text-primary-foreground sm:size-9"
        aria-hidden
      >
        <Icon className="size-4 stroke-[1.75] sm:size-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-none text-foreground sm:text-base">
          {title}
        </p>
        <p className="mt-0.5 text-[11px] capitalize text-muted-foreground sm:text-xs">
          {subtitle}
        </p>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Soft atmosphere — elite color wash only (no + grid) */}
      <div
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 10% 20%, rgb(29 78 216 / 0.08), transparent 55%),
            radial-gradient(ellipse 70% 50% at 90% 30%, rgb(15 118 110 / 0.07), transparent 50%),
            linear-gradient(180deg, #f8fafc 0%, #eef2ff 45%, #f0fdfa 100%)
          `,
        }}
        aria-hidden
      />

      {/* Elite proportions: py-16 / md:py-24 → ~672px fold at 1440×900 */}
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:gap-12 md:py-24 lg:gap-16">
        <div
          className="flex flex-col gap-6 md:gap-8"
          style={{ animation: 'fade-up 0.7s ease both' }}
        >
          <div className="space-y-4 md:space-y-5">
            <p className="text-eyebrow font-semibold uppercase tracking-[0.14em] text-primary">
              AI-powered learning
            </p>
            <h1
              id="hero-heading"
              className="text-balance font-bold tracking-tight"
            >
              <span className="gradient-text block text-4xl sm:text-5xl md:text-4xl lg:text-[4rem] lg:leading-[1.05]">
                {BRAND.name}
              </span>
              <span className="mt-3 block text-xl font-semibold text-foreground sm:text-2xl md:text-3xl md:leading-tight">
                The AI tutor that turns effort into results
              </span>
            </h1>
            <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
              Visual lessons, voice teaching, and adaptive practice — from
              boards and JEE/NEET to career skills for schools and professionals.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <AuthEntryLink href={CTAS.primary.href} className="btn-primary h-11 px-6">
              {CTAS.primary.label}
            </AuthEntryLink>
            <Link href={CTAS.secondary.href} className="btn-secondary h-11 px-6">
              {CTAS.secondary.label}
            </Link>
          </div>

          <p className="text-sm font-medium text-muted-foreground">
            {HERO_TRUST}
          </p>
        </div>

        {/* Elite stage: soft glow + radial vignette (not a hard photo card) */}
        <div
          className="hero-stage relative flex min-h-[280px] items-center justify-center sm:min-h-[400px] md:min-h-[480px]"
          style={{ animation: 'fade-up 0.7s ease 0.12s both' }}
        >
          <div
            className="pointer-events-none absolute inset-[8%] -z-10 rounded-full"
            style={{
              background:
                'radial-gradient(ellipse at center, rgb(29 78 216 / 0.14) 0%, rgb(15 118 110 / 0.08) 45%, transparent 70%)',
              filter: 'blur(28px)',
            }}
            aria-hidden
          />
          <div className="relative w-full max-w-[220px] sm:max-w-sm md:max-w-md">
            <Image
              src={BRAND.heroSrc}
              alt="Two students in Aɪra branded shirts — a girl with a laptop and a boy with a school bag"
              width={640}
              height={640}
              priority
              sizes="(max-width: 640px) 220px, (max-width: 768px) 384px, 448px"
              className="hero-elite-img h-auto w-full select-none object-contain object-top"
            />
          </div>

          {floatingCards.map((card) => (
            <HeroFloatCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}
