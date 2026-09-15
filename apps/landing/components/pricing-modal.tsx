'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Zap, Star, Building2, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

interface PricingModalProps {
  open: boolean
  onClose: () => void
  onContactClick?: () => void
}

const plans = [
  {
    id: 'simple',
    name: 'Simple',
    icon: Zap,
    price: 0,
    period: 'Free forever',
    tagline: 'Perfect to get started',
    color: 'from-slate-500 to-slate-700',
    accentColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    bgColor: 'bg-slate-50',
    badgeBg: 'bg-slate-100 text-slate-700',
    ctaClass: 'bg-slate-900 hover:bg-slate-800 text-white',
    features: [
      'AI-powered lesson summaries',
      '5 practice tests per month',
      'Basic topic coverage (Math, Science)',
      'Progress tracking dashboard',
      'Mobile & desktop access',
      'Community forum access',
    ],
    notIncluded: ['Weekly exams', 'Live Q&A sessions', 'Personalized learning paths', 'Expert educator support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Star,
    price: 375,
    period: 'per month',
    tagline: 'Ideal for serious learners',
    color: 'from-blue-500 to-indigo-600',
    accentColor: 'text-indigo-600',
    borderColor: 'border-indigo-300',
    bgColor: 'bg-indigo-50/50',
    badgeBg: 'bg-indigo-100 text-indigo-700',
    ctaClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25',
    features: [
      'Everything in Simple',
      'Unlimited practice tests',
      'Full JEE & NEET curriculum',
      '[featured] Weekly exams with performance report',
      'AI Teaching with adaptive paths',
      'Smart Curriculum recommendations',
      'Live Q&A sessions (5/month)',
      'Competitive Mode & leaderboard',
      'Detailed analytics & insights',
      'Priority email support',
    ],
    notIncluded: ['Dedicated account manager', 'Custom school/team dashboard', 'API & LMS integrations'],
    highlight: false,
  },
  {
    id: 'pro-plus',
    name: 'Pro+',
    icon: Sparkles,
    price: 675,
    period: 'per month',
    tagline: 'For professionals & toppers',
    color: 'from-violet-600 to-purple-700',
    accentColor: 'text-violet-600',
    borderColor: 'border-violet-400',
    bgColor: 'bg-violet-50/60',
    badgeBg: 'bg-violet-100 text-violet-700',
    ctaClass: 'bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white shadow-lg shadow-violet-500/30',
    features: [
      'Everything in Pro',
      '[featured] Weekly exams + full-length mock tests',
      'Unlimited Live Q&A with expert educators',
      'AI Teaching with deep personalization',
      'Competitive Mode — national leaderboard',
      'Professional skill tracks (coding, aptitude)',
      'Interview prep & resume AI review',
      'Career counselling sessions (2/month)',
      'Offline access to all content',
      'Priority 24/7 support (chat + call)',
    ],
    notIncluded: ['Custom school/team dashboard', 'Multi-seat admin panel'],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    price: null,
    period: 'Custom pricing',
    tagline: 'For schools & institutions',
    color: 'from-emerald-500 to-teal-600',
    accentColor: 'text-emerald-600',
    borderColor: 'border-emerald-300',
    bgColor: 'bg-emerald-50/40',
    badgeBg: 'bg-emerald-100 text-emerald-700',
    ctaClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25',
    features: [
      'All Pro+ features included',
      'Multi-seat student management',
      'Custom school/institution dashboard',
      'Teacher & admin control panel',
      'Batch-level performance analytics',
      'School-branded learning portal',
      'Bulk weekly exams & assignments',
      'API & LMS integrations (Moodle, etc.)',
      'Dedicated account manager',
      'SLA-backed support & onboarding',
    ],
    notIncluded: [],
  },
]

export function PricingModal({ open, onClose, onContactClick }: PricingModalProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const router = useRouter()

  const getPrice = (base: number | null) => {
    if (base === null) return null
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
    <div
      className="relative z-[100] flex items-start justify-center"
    >
      {/* Modal Panel */}
      <div className="relative w-full max-w-7xl mx-auto px-4 py-10 md:py-16">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-12 right-6 md:right-8 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors backdrop-blur-md"
          aria-label="Close pricing"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 text-xs font-semibold tracking-widest uppercase mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Aɪra Transparent Pricing
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">Learning Plan</span>
          </h2>
          <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto">
            Start free. Scale as you grow. Every plan includes AI-powered learning, progress tracking, and mobile access.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-0 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${billing === 'monthly' ? 'bg-white text-slate-900 shadow-md' : 'text-white/60 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${billing === 'annual' ? 'bg-white text-slate-900 shadow-md' : 'text-white/60 hover:text-white'}`}
            >
              Annual
              <span className="text-[10px] font-black bg-green-400 text-green-900 px-1.5 py-0.5 rounded-full">-15%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const Icon = plan.icon
            const price = getPrice(plan.price)
            const isHighlight = plan.highlight

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-[2rem] border ${plan.borderColor} overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl
                  ${isHighlight
                    ? 'ring-2 ring-violet-500/60 shadow-[0_0_60px_-10px_rgba(139,92,246,0.5)] bg-gradient-to-b from-violet-900/80 to-purple-950/90'
                    : 'bg-white/5 backdrop-blur-md hover:bg-white/10'
                  }`}
              >
                {/* Popular badge */}
                {isHighlight && (
                  <div className="absolute top-0 inset-x-0 flex justify-center">
                    <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[11px] font-black px-5 py-1 rounded-b-xl tracking-widest uppercase shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className={`p-6 md:p-8 flex flex-col flex-1 ${isHighlight ? 'pt-10' : ''}`}>
                  {/* Icon & Plan name */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-white text-lg leading-none">{plan.name}</p>
                      <p className="text-white/50 text-xs mt-0.5">{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {price !== null ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-white/50 text-xl font-bold">₹</span>
                          <span className="text-4xl font-black text-white">{price}</span>
                        </div>
                        <p className="text-white/40 text-xs mt-1">
                          {plan.id === 'simple' ? 'Free forever' : billing === 'monthly' ? 'per month' : 'per year'}
                        </p>
                        {billing === 'annual' && plan.price !== 0 && plan.price !== null && (
                          <p className="text-green-400 text-[10px] font-bold mt-1 uppercase tracking-wider">
                            Save ₹{Math.round(plan.price * 1.8)} annually
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-black text-white">Custom</p>
                        <p className="text-white/40 text-xs mt-1">Contact us for pricing</p>
                      </>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    type="button"
                    onClick={() => {
                      if (plan.id === 'enterprise') {
                        onContactClick?.()
                        onClose()
                        return
                      }
                      onClose()
                      router.push('/signup')
                    }}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 mb-6 ${plan.ctaClass} hover:-translate-y-0.5`}
                  >
                    {plan.id === 'simple' ? 'Start Free' : plan.id === 'enterprise' ? 'Contact Us' : 'Get Started'}
                  </button>

                  {/* Divider */}
                  <div className="border-t border-white/10 mb-5" />

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                        <span className={`${f.startsWith('[featured]') ? 'text-white font-semibold' : 'text-white/70'}`}>
                          {f.replace('[featured] ', '')}
                          {f.startsWith('[featured]') && (
                            <span className="ml-1 text-[10px] bg-amber-400/20 text-amber-400 border border-amber-400/30 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                          )}
                        </span>
                      </li>
                    ))}
                    {plan.notIncluded.map((f, i) => (
                      <li key={`no-${i}`} className="flex items-start gap-2.5 text-sm opacity-40">
                        <X className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
                        <span className="text-white/40 line-through">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-white/30 text-xs mt-10">
          All prices are in INR. Enterprise pricing is custom and negotiated based on school/institution size.
          <br />GST applicable. Free plan has no time limit. Upgrade or cancel anytime.
        </p>
      </div>
    </div>
      </DialogContent>
    </Dialog>
  )
}
