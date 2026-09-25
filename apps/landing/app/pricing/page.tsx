import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Zap, Star, Building2, type LucideIcon } from 'lucide-react'
import { Header } from '@/components/header'
import { SectionEyebrow } from '@/components/section-eyebrow'
import { PRICING_PLANS, type PricingPlanId } from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'Pricing — Aɪra',
  description: 'Simple plans for students, professionals, and schools. Start free, upgrade when you are ready.',
}

const PLAN_ICONS: Record<PricingPlanId, LucideIcon> = {
  simple: Zap,
  pro: Star,
  enterprise: Building2,
}

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
                Simple plans that grow with you
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Start free. Upgrade when you need deeper practice and school-ready tools.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {PRICING_PLANS.map((plan) => {
                const Icon = PLAN_ICONS[plan.id]
                return (
                  <article
                    key={plan.id}
                    className={
                      plan.highlighted
                        ? 'relative flex flex-col rounded-[var(--radius-card)] border-2 border-primary bg-card p-6 shadow-[var(--shadow-md)]'
                        : 'relative flex flex-col rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-[var(--shadow-sm)]'
                    }
                  >
                    {plan.badge ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        {plan.badge}
                      </span>
                    ) : null}
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-[var(--radius-btn)] bg-primary-muted text-primary">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">{plan.name}</h2>
                        <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                      </div>
                    </div>
                    <p className="mt-6">
                      <span className="text-3xl font-bold tracking-tight text-foreground">
                        {plan.priceLabel}
                      </span>
                      {plan.periodLabel ? (
                        <span className="ml-1 text-sm text-muted-foreground">{plan.periodLabel}</span>
                      ) : null}
                    </p>
                    {plan.note ? (
                      <p className="mt-2 text-xs text-warning">{plan.note}</p>
                    ) : null}
                    <ul className="mt-6 flex-1 space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.cta.href}
                      className={
                        plan.highlighted
                          ? 'btn-primary mt-8 h-11 w-full justify-center'
                          : 'mt-8 inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-btn)] border border-border bg-background text-sm font-semibold text-foreground transition-colors hover:bg-muted'
                      }
                    >
                      {plan.id === 'enterprise' ? plan.cta.label : plan.id === 'simple' ? 'Start free' : 'Get started'}
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
