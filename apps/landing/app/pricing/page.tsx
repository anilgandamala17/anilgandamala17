import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Zap, Star, Building2 } from 'lucide-react'
import { Header } from '@/components/header'
import { SectionEyebrow } from '@/components/section-eyebrow'
import { CTAS } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Pricing — Aɪra',
  description: 'Simple plans for students, professionals, and schools. Start free, upgrade when you are ready.',
}

const plans = [
  {
    id: 'simple',
    name: 'Simple',
    icon: Zap,
    price: 'Free',
    period: 'forever',
    tagline: 'Get started with core AI learning',
    cta: CTAS.primary,
    features: [
      'AI lesson summaries',
      '5 practice tests / month',
      'Math & Science basics',
      'Progress dashboard',
      'Mobile & desktop access',
    ],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Star,
    price: '₹375',
    period: '/ month',
    tagline: 'Full JEE & NEET curriculum',
    badge: 'Most popular',
    cta: CTAS.primary,
    features: [
      'Everything in Simple',
      'Unlimited practice tests',
      'Full JEE & NEET curriculum',
      'Weekly exams + reports',
      'Adaptive AI learning paths',
      'Live Q&A (5 / month)',
      'Priority email support',
    ],
    highlighted: true,
    note: 'Placeholder pricing — confirm before publishing',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    price: 'Custom',
    period: '',
    tagline: 'For schools & institutions',
    cta: CTAS.secondary,
    features: [
      'Multi-seat student management',
      'School admin dashboard',
      'Batch analytics & reporting',
      'LMS / API integrations',
      'Dedicated account manager',
      'SLA-backed onboarding',
    ],
    highlighted: false,
  },
] as const

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="section-padding border-b border-border">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <SectionEyebrow>Pricing</SectionEyebrow>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Plans that scale from student to school
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Start free. Upgrade when you need deeper curriculum, live support, or institutional controls.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
              {plans.map((plan) => {
                const Icon = plan.icon
                return (
                  <article
                    key={plan.id}
                    className={`relative flex flex-col rounded-[var(--radius-card)] border bg-card p-6 shadow-sm md:p-8 ${
                      plan.highlighted
                        ? 'border-primary shadow-md ring-1 ring-primary/20'
                        : 'border-border'
                    }`}
                  >
                    {'badge' in plan && plan.badge && (
                      <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                        {plan.badge}
                      </span>
                    )}
                    <div className="flex size-10 items-center justify-center rounded-[var(--radius-btn)] bg-primary-muted text-primary">
                      <Icon className="size-5 stroke-[1.75]" aria-hidden />
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-foreground">{plan.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                    <p className="mt-6 flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight text-foreground">{plan.price}</span>
                      {plan.period && (
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      )}
                    </p>
                    {'note' in plan && plan.note && (
                      <p className="mt-1 text-xs text-warning">{plan.note}</p>
                    )}
                    <ul className="mt-6 flex flex-1 flex-col gap-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-2 text-sm text-foreground">
                          <Check className="mt-0.5 size-4 shrink-0 stroke-[1.75] text-success" aria-hidden />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.cta.href}
                      className={`mt-8 inline-flex h-11 items-center justify-center rounded-[var(--radius-btn)] px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                        plan.highlighted
                          ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                          : 'border border-border bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      {plan.cta.label}
                    </Link>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
