'use client'

import {
  BookOpen,
  ChevronDown,
  Sparkles,
  Trophy,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/site'

type Step = {
  number: number
  title: string
  description: string
  icon: LucideIcon
  /** Brand-blue progression: lightest → full strength */
  accentStrength: '20' | '35' | '55' | '100'
  iconFrom: string
  iconTo: string
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Sign Up',
    description:
      'Create your free account and take a quick assessment to understand your learning level.',
    icon: UserPlus,
    accentStrength: '20',
    iconFrom: '#93c5fd',
    iconTo: '#3b82f6',
  },
  {
    number: 2,
    title: 'Personalize',
    description:
      'Our AI analyzes your preferences and creates a customized learning path just for you.',
    icon: Sparkles,
    accentStrength: '35',
    iconFrom: '#60a5fa',
    iconTo: '#2563eb',
  },
  {
    number: 3,
    title: 'Learn & Practice',
    description:
      'Access interactive lessons, practice problems, and get real-time feedback from AI tutors.',
    icon: BookOpen,
    accentStrength: '55',
    iconFrom: '#3b82f6',
    iconTo: '#1d4ed8',
  },
  {
    number: 4,
    title: 'Succeed',
    description:
      'Track your progress, take mock tests, and ace your exams with confidence.',
    icon: Trophy,
    accentStrength: '100',
    iconFrom: '#2563eb',
    iconTo: '#1e3a8a',
  },
]

const ACCENT_TOP: Record<Step['accentStrength'], string> = {
  '20': 'bg-primary/20',
  '35': 'bg-primary/35',
  '55': 'bg-primary/55',
  '100': 'bg-primary',
}

function StepCard({ step }: { step: Step }) {
  const Icon = step.icon

  return (
    <article
      className={cn(
        'relative flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-[var(--shadow-sm)]',
        'transition-[transform,box-shadow] duration-200 ease-out',
        'hover:-translate-y-1 hover:shadow-[var(--shadow-md)] motion-reduce:hover:translate-y-0',
      )}
    >
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1 rounded-t-[var(--radius-card)]',
          ACCENT_TOP[step.accentStrength],
        )}
        aria-hidden
      />

      <div className="relative mx-auto mb-5 flex size-12 items-center justify-center md:size-14">
        <div
          className="relative z-10 flex size-full items-center justify-center rounded-xl text-white shadow-[var(--shadow-sm)] ring-2 ring-white transition-transform duration-200 group-hover/step:scale-105 motion-reduce:group-hover/step:scale-100"
          style={{
            background: `linear-gradient(145deg, ${step.iconFrom}, ${step.iconTo})`,
          }}
        >
          <Icon className="size-5 md:size-6" strokeWidth={1.75} aria-hidden />
        </div>
      </div>

      <span className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 px-3 py-0.5 text-[10px] font-bold tracking-[0.14em] text-primary uppercase md:text-xs">
        Step {step.number}
      </span>

      <h3 className="text-center text-lg font-bold tracking-tight text-foreground md:text-xl">
        {step.title}
      </h3>
      <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
        {step.description}
      </p>
    </article>
  )
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative isolate overflow-hidden bg-background py-[var(--section-py-mobile)] md:py-[var(--section-py-desktop)]"
    >
      <div className="pointer-events-none absolute inset-0 z-0 select-none" aria-hidden>
        <svg
          className="absolute bottom-[-10%] left-[-10%] h-[750px] w-[750px] opacity-[0.12]"
          viewBox="0 0 700 700"
          fill="none"
        >
          <circle
            cx="350"
            cy="350"
            r="330"
            stroke="#1d4ed8"
            strokeWidth="1.5"
            strokeDasharray="3 12"
          />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-10 text-center md:mb-14">
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:mb-4 md:text-5xl">
            How <span className="text-primary">{BRAND.name}</span> Works
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-lg">
            Get started in four simple steps and transform your learning journey.
          </p>
        </div>

        {/* Desktop: horizontal journey with connector behind icons */}
        <div className="relative hidden md:grid md:grid-cols-4 md:gap-6">
          <div
            className="pointer-events-none absolute top-[1.75rem] right-[10%] left-[10%] z-0 h-px bg-primary/25"
            aria-hidden
          />
          {STEPS.map((step, index) => (
            <div key={step.number} className="group/step relative z-10">
              {index < STEPS.length - 1 ? (
                <ChevronDown
                  className="pointer-events-none absolute top-[1.35rem] -right-3 z-20 size-4 rotate-[-90deg] text-primary/50"
                  aria-hidden
                />
              ) : null}
              <StepCard step={step} />
            </div>
          ))}
        </div>

        {/* Mobile: vertical journey with connector on the left */}
        <div className="relative flex flex-col gap-6 md:hidden">
          <div
            className="pointer-events-none absolute top-8 bottom-8 left-[1.65rem] w-px bg-primary/25"
            aria-hidden
          />
          {STEPS.map((step) => (
            <div key={step.number} className="group/step relative pl-2">
              <StepCard step={step} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
