'use client'

import { ArrowRight, Check } from 'lucide-react'
import { AuthEntryLink } from '@/components/auth-entry-link'
import { BRAND, CTAS } from '@/lib/site'

interface CTAProps {
  onPricingClick?: () => void
}

const TRUST_ITEMS = [
  'No credit card required',
  '14 days free access',
  'Cancel anytime',
] as const

export function CTA({ onPricingClick }: CTAProps) {
  return (
    <section
      className="section-padding relative isolate overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Soft page atmosphere — matches hero wash, not purple mesh */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 15% 40%, rgb(29 78 216 / 0.07), transparent 55%),
            radial-gradient(ellipse 60% 50% at 90% 60%, rgb(15 118 110 / 0.06), transparent 50%),
            linear-gradient(180deg, #f8fafc 0%, #eef2ff 55%, #f8fafc 100%)
          `,
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className="relative overflow-hidden rounded-[var(--radius-card)] border border-white/10 shadow-[var(--shadow-lg)]"
          style={{
            background:
              'linear-gradient(145deg, #0f172a 0%, #1e3a8a 48%, #0f766e 140%)',
          }}
        >
          {/* Restrained light accents — no blueprint clutter */}
          <div
            className="pointer-events-none absolute -left-24 top-1/2 size-[280px] -translate-y-1/2 rounded-full bg-primary/25 blur-3xl md:size-[360px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 -top-20 size-[220px] rounded-full bg-accent/20 blur-3xl md:size-[300px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
            aria-hidden
          />

          {/* Balanced panel: tighter on mobile, composed on desktop */}
          <div className="relative mx-auto flex max-w-2xl flex-col items-center px-5 py-11 text-center sm:px-10 sm:py-14 md:max-w-3xl md:px-14 md:py-16">
            <h2
              id="cta-heading"
              className="text-balance text-[1.65rem] font-bold leading-[1.18] tracking-tight text-white sm:text-4xl md:text-[2.625rem] md:leading-[1.12]"
            >
              Ready to transform your learning?
            </h2>

            <p className="mt-3.5 max-w-lg text-pretty text-sm leading-relaxed text-slate-200/85 sm:mt-5 sm:text-base md:text-lg">
              Join students who use {BRAND.name} for boards, JEE, and NEET.
              Start free and unlock a tutor that adapts to you.
            </p>

            <div className="mt-7 flex w-full max-w-sm flex-col items-stretch gap-2.5 sm:mt-8 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-3">
              <AuthEntryLink
                href={CTAS.primary.href}
                className="btn-primary h-11 w-full px-6 text-sm shadow-md shadow-black/20 sm:w-auto sm:min-w-[11rem]"
              >
                {CTAS.primary.label}
                <ArrowRight className="size-4" aria-hidden />
              </AuthEntryLink>
              <button
                type="button"
                onClick={onPricingClick}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-white/25 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto sm:min-w-[11rem]"
              >
                View Pricing
              </button>
            </div>

            <ul className="mt-7 flex w-full max-w-md flex-col items-center gap-2.5 border-t border-white/10 pt-5 text-xs font-medium text-slate-300/90 sm:mt-8 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2 sm:pt-6 sm:text-sm">
              {TRUST_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check
                    className="size-3.5 shrink-0 text-emerald-400 sm:size-4"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
