'use client'

import { useEffect, useId, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bell,
  ChevronDown,
  Flame,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EXTERNAL } from '@/lib/site'
import { useAuth } from '@/components/auth-provider'
import { CoursePattern } from '@/components/course-pattern'
import { WaitlistModal } from '@/components/waitlist-modal'
import { getUserAppRole } from '@/lib/firebase/auth'
import { homeForRole } from '@/lib/auth-redirect'
import type { LearningCourse, MetricKind } from '@/lib/learning-courses'

const METRIC_ICONS: Record<MetricKind, LucideIcon> = {
  target: Target,
  zap: Zap,
  trophy: Trophy,
  flame: Flame,
  users: Users,
}

const CTA_BASE = cn(
  'group/cta mt-auto inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white',
  'shadow-[0_1px_2px_rgb(15_23_42/0.06),0_8px_20px_-10px_var(--course-cta-glow)]',
  'transition-[transform,box-shadow,filter] duration-200 ease-out motion-reduce:transition-none',
  'hover:-translate-y-0.5 hover:brightness-[1.04] hover:shadow-[0_2px_4px_rgb(15_23_42/0.08),0_14px_28px_-12px_var(--course-cta-glow)]',
  'active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'motion-reduce:hover:translate-y-0',
)

function HighlightBadge({
  label,
  variant,
}: {
  label: string
  variant: NonNullable<LearningCourse['highlight']>['variant']
}) {
  const Icon = variant === 'popular' ? Flame : Trophy
  return (
    <span
      className={cn(
        'inline-flex max-w-[11rem] items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
        variant === 'popular' &&
          'bg-amber-50 text-amber-800 ring-1 ring-amber-200/90',
        variant === 'top-rated' &&
          'bg-slate-50 text-slate-700 ring-1 ring-slate-200/90',
        variant === 'industry' &&
          'bg-teal-50 text-teal-800 ring-1 ring-teal-200/90',
      )}
    >
      <Icon className="size-2.5 shrink-0" aria-hidden strokeWidth={2.5} />
      <span className="truncate">{label}</span>
    </span>
  )
}

function ExploreCtaLabel() {
  return (
    <>
      Explore Course
      <ArrowRight
        className="size-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/cta:translate-x-0"
        aria-hidden
      />
    </>
  )
}

export function LearningCourseCard({
  course,
  index = 0,
  visible = true,
  className,
}: {
  course: LearningCourse
  index?: number
  visible?: boolean
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [schoolsHome, setSchoolsHome] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const topicsId = useId()
  const patternUid = useId().replace(/:/g, '')
  const Icon = course.icon
  const { accent } = course
  const portal =
    course.tone === 'professional' ? EXTERNAL.professionals : EXTERNAL.schools

  useEffect(() => {
    if (course.tone === 'professional' || !user) {
      return
    }
    let cancelled = false
    void getUserAppRole(user.uid).then((role) => {
      if (!cancelled) setSchoolsHome(homeForRole(role))
    })
    return () => {
      cancelled = true
    }
  }, [course.tone, user])

  const resolvedSchoolsHome =
    course.tone === 'professional' || !user ? null : schoolsHome
  const exploreHref =
    course.tone === 'professional'
      ? !authLoading && user
        ? portal.href
        : portal.loginHref
      : !authLoading && user
        ? resolvedSchoolsHome ?? portal.loginHref
        : portal.loginHref
  const exploreOpensExternal = Boolean(
    !authLoading && user && course.tone === 'professional',
  )
  const exploreIsTutorPortal = Boolean(
    !authLoading && user && course.tone !== 'professional' && resolvedSchoolsHome,
  )

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[1.125rem] border border-slate-200/80 bg-white p-5 md:rounded-[1.25rem] md:p-5',
        'shadow-[0_1px_2px_rgb(15_23_42/0.04),0_10px_28px_-16px_rgb(15_23_42/0.14)]',
        'transition-[opacity,transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-[opacity,box-shadow]',
        'hover:-translate-y-1 hover:border-slate-300/90 hover:shadow-[0_2px_4px_rgb(15_23_42/0.05),0_18px_36px_-18px_rgb(15_23_42/0.2)]',
        'focus-within:-translate-y-1 focus-within:shadow-[0_2px_4px_rgb(15_23_42/0.05),0_18px_36px_-18px_rgb(15_23_42/0.2)]',
        'motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0',
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-3 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100',
        className,
      )}
      style={
        {
          background: `linear-gradient(165deg, ${accent.washFrom} 0%, #ffffff 42%, #ffffff 100%)`,
          transitionDelay: visible ? `${Math.min(index, 8) * 50}ms` : '0ms',
          '--course-cta': accent.cta,
          '--course-cta-glow': `${accent.cta}66`,
        } as CSSProperties
      }
    >
      <CoursePattern
        kind={course.pattern}
        color={accent.pattern}
        id={`${patternUid}-${course.id}`}
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col gap-3.5">
        {/* Top: icon + badges */}
        <div className="flex items-start justify-between gap-2.5">
          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-2xl text-white md:size-12',
              'ring-1 ring-black/5 transition-transform duration-200 ease-out',
              'group-hover:scale-[1.03] motion-reduce:group-hover:scale-100',
            )}
            style={{
              background: `linear-gradient(145deg, ${accent.iconFrom}, ${accent.iconTo})`,
              boxShadow: `0 8px 18px -8px ${accent.iconTo}66`,
            }}
            aria-hidden
          >
            <Icon className="size-5 md:size-[1.35rem]" strokeWidth={1.75} />
          </div>

          <div className="flex min-w-0 flex-col items-end gap-1.5">
            {course.highlight ? (
              <HighlightBadge
                label={course.highlight.label}
                variant={course.highlight.variant}
              />
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-700 ring-1 ring-slate-200/80">
              <Star
                className="size-3 fill-amber-400 text-amber-400"
                aria-hidden
              />
              <span>{course.rating.toFixed(1)}</span>
            </span>
          </div>
        </div>

        {/* Tags + title */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80">
              {course.primaryTag}
            </span>
            <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80">
              {course.secondaryTag}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold leading-snug tracking-tight text-slate-900 md:text-[1.2rem]">
              {course.name}
            </h3>
            {course.subtitle ? (
              <p className="mt-1 text-sm leading-snug text-slate-500">
                {course.subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {/* Proof highlight */}
        {course.proofStat ? (
          <div
            className="flex items-start gap-2 rounded-xl px-3 py-2.5 ring-1"
            style={{
              backgroundColor: `${accent.washFrom}`,
              borderColor: 'transparent',
              boxShadow: `inset 0 0 0 1px ${accent.cta}18`,
            }}
          >
            <Sparkles
              className="mt-0.5 size-3.5 shrink-0"
              style={{ color: accent.cta }}
              aria-hidden
              strokeWidth={2}
            />
            <p className="text-[13px] font-semibold leading-snug text-slate-800">
              {course.proofStat}
            </p>
          </div>
        ) : null}

        {/* Metadata */}
        {course.metrics.length > 0 ? (
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {course.metrics.map((metric) => {
              const MetricIcon = METRIC_ICONS[metric.kind]
              return (
                <li
                  key={metric.label}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"
                >
                  <MetricIcon
                    className="size-3.5 shrink-0 text-slate-400"
                    aria-hidden
                    strokeWidth={1.75}
                  />
                  {metric.label}
                </li>
              )
            })}
          </ul>
        ) : null}

        {course.momentum ? (
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <Flame
              className="size-3 shrink-0 text-orange-500/90"
              aria-hidden
              strokeWidth={2}
            />
            {course.momentum}
          </p>
        ) : null}

        {/* What's covered */}
        <div className="min-h-0 flex-1">
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-left text-sm font-medium text-slate-700',
              'outline-none transition-colors hover:bg-slate-50/80 hover:text-slate-900',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            )}
            style={expanded ? { color: accent.cta } : undefined}
            aria-expanded={expanded}
            aria-controls={topicsId}
            onClick={() => setExpanded((v) => !v)}
          >
            <span>What&apos;s covered</span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none',
                expanded && 'rotate-180',
              )}
              style={expanded ? { color: accent.cta } : undefined}
              aria-hidden
            />
          </button>

          <div
            id={topicsId}
            role="region"
            aria-label={`${course.name} topics`}
            aria-hidden={!expanded}
            className={cn(
              'grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none',
              expanded
                ? 'grid-rows-[1fr] opacity-100'
                : 'pointer-events-none grid-rows-[0fr] opacity-0',
            )}
          >
            <div className="overflow-hidden">
              <ul className="mt-1.5 flex flex-wrap gap-1.5 pb-1">
                {course.topics.map((topic) => (
                  <li
                    key={topic}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200/80"
                  >
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        {course.available === false ? (
          <>
            <button
              type="button"
              onClick={() => setWaitlistOpen(true)}
              className={CTA_BASE}
              style={{ backgroundColor: accent.cta }}
            >
              <Bell className="size-3.5 shrink-0" aria-hidden />
              Notify Me
            </button>
            <WaitlistModal
              open={waitlistOpen}
              onOpenChange={setWaitlistOpen}
              courseId={course.id}
              courseName={course.name}
            />
          </>
        ) : exploreOpensExternal ? (
          <a
            href={exploreHref}
            target="_blank"
            rel="noopener noreferrer"
            className={CTA_BASE}
            style={{ backgroundColor: accent.cta }}
          >
            <ExploreCtaLabel />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : exploreIsTutorPortal ? (
          <a
            href={exploreHref}
            onClick={(e) => {
              e.preventDefault()
              window.location.assign(exploreHref)
            }}
            className={CTA_BASE}
            style={{ backgroundColor: accent.cta }}
          >
            <ExploreCtaLabel />
          </a>
        ) : (
          <Link
            href={exploreHref}
            className={CTA_BASE}
            style={{ backgroundColor: accent.cta }}
          >
            <ExploreCtaLabel />
          </Link>
        )}
      </div>
    </article>
  )
}
