/**
 * Authoritative pricing catalog for the landing app.
 * All UI surfaces (pricing page, pricing modal, assistant) must consume this module.
 * Do not hardcode plan prices elsewhere.
 */

import { CTAS } from './site'

export type PricingPlanId = 'simple' | 'pro' | 'enterprise'

export type PricingPlan = {
  id: PricingPlanId
  name: string
  /** Numeric monthly INR; null = custom / contact sales */
  monthlyPriceInr: number | null
  /** Display label used on the public pricing page */
  priceLabel: string
  periodLabel: string
  tagline: string
  badge?: string
  features: readonly string[]
  highlighted: boolean
  /** Honest note when pricing is still placeholder */
  note?: string
  cta: (typeof CTAS)[keyof typeof CTAS]
}

/** Canonical Pro monthly price — single number used across the product. */
export const PRO_MONTHLY_INR = 375 as const

export const PRICING_PLANS: readonly PricingPlan[] = [
  {
    id: 'simple',
    name: 'Simple',
    monthlyPriceInr: 0,
    priceLabel: 'Free',
    periodLabel: 'forever',
    tagline: 'Get started with core AI learning',
    features: [
      'AI lesson summaries',
      '5 practice tests / month',
      'Math & Science basics',
      'Progress dashboard',
      'Mobile & desktop access',
    ],
    highlighted: false,
    cta: CTAS.primary,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPriceInr: PRO_MONTHLY_INR,
    priceLabel: `₹${PRO_MONTHLY_INR}`,
    periodLabel: '/ month',
    tagline: 'Full JEE & NEET curriculum',
    badge: 'Most popular',
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
    cta: CTAS.primary,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPriceInr: null,
    priceLabel: 'Custom',
    periodLabel: '',
    tagline: 'For schools & institutions',
    features: [
      'Multi-seat student management',
      'School admin dashboard',
      'Batch analytics & reporting',
      'LMS / API integrations',
      'Dedicated account manager',
      'SLA-backed onboarding',
    ],
    highlighted: false,
    cta: CTAS.secondary,
  },
] as const

export function getPricingPlan(id: PricingPlanId): PricingPlan {
  const plan = PRICING_PLANS.find((p) => p.id === id)
  if (!plan) {
    throw new Error(`Unknown pricing plan: ${id}`)
  }
  return plan
}
