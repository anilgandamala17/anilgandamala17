'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Zap, Star, Building2, Sparkles, type LucideIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { PRICING_PLANS, type PricingPlanId } from '@/lib/pricing'

interface PricingModalProps {
  open: boolean
  onClose: () => void
  onContactClick?: () => void
}

const PLAN_ICONS: Record<PricingPlanId, LucideIcon> = {
  simple: Zap,
  pro: Star,
  enterprise: Building2,
}

const PLAN_VISUAL: Record<
  PricingPlanId,
  {
    color: string
    borderColor: string
    ctaClass: string
  }
> = {
  simple: {
    color: 'from-slate-500 to-slate-700',
    borderColor: 'border-slate-200',
    ctaClass: 'bg-slate-900 hover:bg-slate-800 text-white',
  },
  pro: {
    color: 'from-blue-500 to-indigo-600',
    borderColor: 'border-indigo-300',
    ctaClass:
      'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25',
  },
  enterprise: {
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-300',
    ctaClass:
      'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25',
  },
}

export function PricingModal({ open, onClose, onContactClick }: PricingModalProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const router = useRouter()

  const getPrice = (base: number | null) => {
    if (base === null) return null
    if (base === 0) return 0
    // 15% discount for annual billing (base * 12 * 0.85)
    return billing === 'annual' ? Math.round(base * 10.2) : base
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/70 backdrop-blur-sm"
        className="top-0 left-0 max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-0 bg-transparent p-0 shadow-none sm:max-w-none"
      >
        <DialogTitle className="sr-only">Aɪra Transparent Pricing</DialogTitle>
        <DialogDescription className="sr-only">
          Choose a learning plan. Start free or contact us for enterprise pricing.
        </DialogDescription>
        <div className="relative z-[100] flex items-start justify-center">
          <div className="relative mx-auto w-full max-w-7xl px-4 py-10 md:py-16">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-12 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 md:right-8"
              aria-label="Close pricing"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-10 text-center md:mb-14">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold tracking-widest text-indigo-400 uppercase backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Aɪra Transparent Pricing
              </div>
              <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                Choose Your{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Learning Plan
                </span>
              </h2>
              <p className="mx-auto max-w-xl text-base text-white/60 md:text-lg">
                Start free. Scale as you grow. Every plan includes AI-powered learning, progress
                tracking, and mobile access.
              </p>

              <div className="mt-8 inline-flex items-center gap-0 rounded-2xl border border-white/10 bg-white/10 p-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setBilling('monthly')}
                  className={`rounded-xl px-5 py-2 text-sm font-bold transition-all duration-300 ${billing === 'monthly' ? 'bg-white text-slate-900 shadow-md' : 'text-white/60 hover:text-white'}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling('annual')}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all duration-300 ${billing === 'annual' ? 'bg-white text-slate-900 shadow-md' : 'text-white/60 hover:text-white'}`}
                >
                  Annual
                  <span className="rounded-full bg-green-400 px-1.5 py-0.5 text-[10px] font-black text-green-900">
                    -15%
                  </span>
                </button>
              </div>
            </div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {PRICING_PLANS.map((plan) => {
                const Icon = PLAN_ICONS[plan.id]
                const visual = PLAN_VISUAL[plan.id]
                const price = getPrice(plan.monthlyPriceInr)
                const isHighlight = plan.highlighted

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col overflow-hidden rounded-[2rem] border ${visual.borderColor} transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
                      isHighlight
                        ? 'bg-gradient-to-b from-violet-900/80 to-purple-950/90 shadow-[0_0_60px_-10px_rgba(139,92,246,0.5)] ring-2 ring-violet-500/60'
                        : 'bg-white/5 backdrop-blur-md hover:bg-white/10'
                    }`}
                  >
                    {isHighlight && plan.badge ? (
                      <div className="absolute top-0 inset-x-0 flex justify-center">
                        <div className="rounded-b-xl bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-1 text-[11px] font-black tracking-widest text-white uppercase shadow-lg">
                          {plan.badge}
                        </div>
                      </div>
                    ) : null}

                    <div className={`flex flex-1 flex-col p-6 md:p-8 ${isHighlight ? 'pt-10' : ''}`}>
                      <div className="mb-5 flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${visual.color} shadow-lg`}
                        >
                          <Icon className="h-5 w-5 text-white" aria-hidden />
                        </div>
                        <div>
                          <p className="text-lg leading-none font-black text-white">{plan.name}</p>
                          <p className="mt-0.5 text-xs text-white/50">{plan.tagline}</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        {price !== null ? (
                          <>
                            <div className="flex items-baseline gap-1">
                              {plan.monthlyPriceInr === 0 ? (
                                <span className="text-4xl font-black text-white">Free</span>
                              ) : (
                                <>
                                  <span className="text-xl font-bold text-white/50">₹</span>
                                  <span className="text-4xl font-black text-white">{price}</span>
                                </>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-white/40">
                              {plan.monthlyPriceInr === 0
                                ? 'Free forever'
                                : billing === 'monthly'
                                  ? 'per month'
                                  : 'per year'}
                            </p>
                            {billing === 'annual' &&
                            plan.monthlyPriceInr !== null &&
                            plan.monthlyPriceInr > 0 ? (
                              <p className="mt-1 text-[10px] font-bold tracking-wider text-green-400 uppercase">
                                Save ₹{Math.round(plan.monthlyPriceInr * 1.8)} annually
                              </p>
                            ) : null}
                            {plan.note ? (
                              <p className="mt-2 text-[10px] text-amber-300/90">{plan.note}</p>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <p className="text-3xl font-black text-white">Custom</p>
                            <p className="mt-1 text-xs text-white/40">Contact us for pricing</p>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (plan.id === 'enterprise') {
                            onContactClick?.()
                            onClose()
                            return
                          }
                          onClose()
                          router.push(plan.cta.href)
                        }}
                        className={`mb-6 w-full rounded-xl py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 ${visual.ctaClass}`}
                      >
                        {plan.id === 'simple'
                          ? 'Start Free'
                          : plan.id === 'enterprise'
                            ? 'Contact Us'
                            : 'Get Started'}
                      </button>

                      <div className="mb-5 border-t border-white/10" />

                      <ul className="flex-1 space-y-2.5">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5 text-sm">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" aria-hidden />
                            <span className="text-white/70">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="mt-10 text-center text-xs text-white/30">
              All prices are in INR. Enterprise pricing is custom and negotiated based on
              school/institution size.
              <br />
              GST applicable. Free plan has no time limit. Upgrade or cancel anytime.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
