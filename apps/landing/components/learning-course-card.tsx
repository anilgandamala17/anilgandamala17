'use client'

import { useEffect, useId, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Bell,
  ChevronDown,
  Flame,
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
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide shadow-[var(--shadow-sm)]',
        variant === 'popular' &&
          'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 ring-1 ring-amber-200/80',
        variant === 'top-rated' &&
          'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-800 ring-1 ring-slate-200',
        variant === 'industry' &&
          'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-900 ring-1 ring-teal-200/80',
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden strokeWidth={2.25} />
      {label}
    </span>
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
  // Professionals stay cross-origin; school tools are same-origin tutor (full navigation required).
  const exploreOpensExternal = Boolean(
    !authLoading && user && course.tone === 'professional',
  )
  const exploreIsTutorPortal = Boolean(
    !authLoading && user && course.tone !== 'professional' && resolvedSchoolsHome,
  )

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border/80 p-5 shadow-[var(--shadow-sm)] md:p-6',
        'transition-[opacity,transform,box-shadow] duration-200 ease-out motion-reduce:transition-[opacity,box-shadow]',
        'hover:-translate-y-1.5 hover:shadow-[var(--shadow-md)] focus-within:-translate-y-1.5 focus-within:shadow-[var(--shadow-md)]',
        'motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0',
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-3 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100',
        className,
      )}
      style={
        {
          background: `linear-gradient(145deg, ${accent.washFrom} 0%, #ffffff 58%)`,
          transitionDelay: visible ? `${Math.min(index, 8) * 50}ms` : '0ms',
          '--course-cta': accent.cta,
        } as CSSProperties
      }
    >
      <CoursePattern
        kind={course.pattern}
        color={accent.pattern}
        id={`${patternUid}-${course.id}`}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md ring-2 ring-white/80 md:size-12',
              'transition-transform duration-200 ease-out will-change-transform',
              'group-hover:scale-105 group-hover:rotate-[2.5deg]',
              'motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0',
            )}
            style={{
              background: `linear-gradient(145deg, ${accent.iconFrom}, ${accent.iconTo})`,
              boxShadow: `0 6px 16px -4px ${accent.iconTo}55`,
            }}
            aria-hidden
          >
            <Icon className="size-5 md:size-6" strokeWidth={1.75} />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {course.highlight ? (
              <HighlightBadge
                label={course.highlight.label}
                variant={course.highlight.variant}
              />
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-foreground shadow-[var(--shadow-sm)] ring-1 ring-border/60">
              <Star
                className="size-3 fill-amber-400 text-amber-400"
                aria-hidden
              />
              <span>{course.rating.toFixed(1)}</span>
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-border/70 bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur-[2px]">
            {course.primaryTag}
          </span>
          <span className="rounded-full border border-border/70 bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur-[2px]">
            {course.secondaryTag}
          </span>
        </div>

        <h3 className="mt-3 text-lg font-bold tracking-tight text-foreground md:text-xl">
          {course.name}
        </h3>
        {course.subtitle ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{course.subtitle}</p>
        ) : null}

        {course.proofStat ? (
          <p className="mt-3 text-sm font-semibold text-foreground">
            {course.proofStat}
          </p>
        ) : null}

        {course.metrics.length > 0 ? (
          <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
            {course.metrics.map((metric) => {
              const MetricIcon = METRIC_ICONS[metric.kind]
              return (
                <li
                  key={metric.label}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
                >
                  <MetricIcon
                    className="size-3.5 shrink-0 opacity-80"
                    aria-hidden
                  />
                  {metric.label}
                </li>
              )
            })}
          </ul>
        ) : null}

        {course.momentum ? (
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700/90">
            <Flame className="size-3 shrink-0" aria-hidden />
            {course.momentum}
          </p>
        ) : null}

        <div className="mt-4 flex-1">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-left text-sm font-medium text-foreground outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={expanded ? { color: accent.cta } : undefined}
            aria-expanded={expanded}
            aria-controls={topicsId}
            onClick={() => setExpanded((v) => !v)}
          >
            <span>What&apos;s covered</span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none',
                expanded && 'rotate-180',
              )}
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
              <ul className="mt-2 flex flex-wrap gap-1.5 pb-1">
                {course.topics.map((topic) => (
                  <li
                    key={topic}
                    className="rounded-full border border-border/60 bg-white/80 px-2.5 py-1 text-xs font-medium text-foreground/80"
                  >
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {course.available === false ? (
          <>
            <button
              type="button"
              onClick={() => setWaitlistOpen(true)}
              className={cn(
                'mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold',
                'border-[var(--course-cta)] text-[var(--course-cta)] bg-transparent',
                'transition-all duration-200 motion-reduce:transition-colors',
                'hover:bg-[var(--course-cta)] hover:text-white',
                'focus-visible:bg-[var(--course-cta)] focus-visible:text-white',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
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
            className={cn(
              'mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold',
              'border-[var(--course-cta)] text-[var(--course-cta)] bg-transparent',
              'transition-all duration-200 motion-reduce:transition-colors',
              'hover:bg-[var(--course-cta)] hover:text-white',
              'focus-visible:bg-[var(--course-cta)] focus-visible:text-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            )}
          >
            Explore Course
            <ArrowRight
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              aria-hidden
            />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : exploreIsTutorPortal ? (
          <a
            href={exploreHref}
            onClick={(e) => {
              e.preventDefault()
              window.location.assign(exploreHref)
            }}
            className={cn(
              'mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold',
              'border-[var(--course-cta)] text-[var(--course-cta)] bg-transparent',
              'transition-all duration-200 motion-reduce:transition-colors',
              'hover:bg-[var(--course-cta)] hover:text-white',
              'focus-visible:bg-[var(--course-cta)] focus-visible:text-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            )}
          >
            Explore Course
            <ArrowRight
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              aria-hidden
            />
          </a>
        ) : (
          <Link
            href={exploreHref}
            className={cn(
              'mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold',
              'border-[var(--course-cta)] text-[var(--course-cta)] bg-transparent',
              'transition-all duration-200 motion-reduce:transition-colors',
              'hover:bg-[var(--course-cta)] hover:text-white',
              'focus-visible:bg-[var(--course-cta)] focus-visible:text-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            )}
          >
            Explore Course
            <ArrowRight
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              aria-hidden
            />
          </Link>
        )}
      </div>
    </article>
  )
}
