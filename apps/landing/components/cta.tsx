'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Check } from 'lucide-react'
import { AuthEntryLink } from '@/components/auth-entry-link'

interface CTAProps {
  onPricingClick?: () => void
}

export function CTA({ onPricingClick }: CTAProps) {
  return (
    <section className="py-12 md:py-24 bg-gradient-to-b from-purple-50/50 to-blue-50/50 relative overflow-hidden isolate">
      {/* --- High Contrast Premium "Blueprint" Scaling for CTA --- */}
      <div className="absolute inset-0 pointer-events-none z-0 select-none">
        {/* Left blueprint technical rings (High contrast) */}
        <svg
          className="absolute top-[-20%] left-[-10%] w-[750px] h-[750px] opacity-[0.4] rotate-12"
          viewBox="0 0 700 700"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="350" cy="350" r="330" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="4 15" strokeOpacity="0.7" />
          <circle cx="350" cy="350" r="260" stroke="#2563eb" strokeWidth="2" strokeDasharray="10 20" strokeOpacity="0.6" />
          <circle cx="350" cy="20" r="6" fill="#4f46e5" fillOpacity="0.6" />
        </svg>

        {/* Right blueprint technical rings (High contrast) */}
        <svg
          className="absolute bottom-[-10%] right-[-15%] w-[650px] h-[650px] opacity-[0.35] -rotate-12"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="300" cy="300" r="280" stroke="#2563eb" strokeWidth="2" strokeDasharray="3 15" strokeOpacity="0.7" />
          <circle cx="300" cy="300" r="220" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="1 12" strokeOpacity="0.6" />
        </svg>
      </div>
      <div className="container max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="relative rounded-2xl md:rounded-[3rem] overflow-hidden shadow-[0_48px_100px_-24px_rgba(49,46,129,0.3)] group/cta">
          {/* Deep Multi-layered Mesh Gradient Background */}
          <div className="absolute inset-0 bg-slate-950">
            <div className="absolute inset-0 opacity-80 bg-gradient-to-br from-indigo-900 via-slate-950 to-indigo-950" />
            {/* Animated Mesh Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/30 rounded-full blur-[100px] group-hover/cta:translate-x-12 transition-transform duration-1000" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] group-hover/cta:-translate-x-12 transition-transform duration-1000" />
          </div>
          
          {/* Glassmorphic Layer - Subtle Grid Texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          {/* Internal Blueprint Decorations */}
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.15] scale-150 rotate-12 pointer-events-none" viewBox="0 0 1000 1000">
            <circle cx="500" cy="500" r="450" stroke="white" strokeWidth="1" strokeDasharray="4 20" />
            <circle cx="500" cy="500" r="350" stroke="white" strokeWidth="0.5" strokeDasharray="1 10" />
          </svg>

          {/* Content - Glass Container */}
          <div className="relative px-5 md:px-16 py-10 md:py-28 text-center text-white isolate">
            <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[2px] -z-10" />
            
            <h2 className="text-2xl sm:text-4xl md:text-6xl font-extrabold mb-6 md:mb-8 tracking-tight leading-[1.1]">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Transform</span> <br className="hidden md:block"/> Your Learning?
            </h2>
            <p className="text-lg md:text-xl text-indigo-100/80 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
              Join thousands of successful students who have achieved their goals with Aɪra. Start your free trial today and unlock your potential.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="h-16 bg-white hover:bg-slate-50 text-indigo-950 font-bold px-10 rounded-2xl group/btn shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:shadow-[0_25px_50px_-12px_rgba(255,255,255,0.3)] transition-all duration-300 border-b-4 border-slate-200 hover:border-b-2 hover:translate-y-[2px]"
                asChild
              >
                <AuthEntryLink href="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-3 w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                </AuthEntryLink>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onPricingClick}
                className="h-16 border-2 border-white/30 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 font-bold px-10 rounded-2xl transition-all duration-300 cursor-pointer"
              >
                View Pricing
              </Button>
            </div>

            <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/10 pt-8 text-sm font-medium text-white/80">
              {[
                'No credit card required',
                '14 days free access',
                'Cancel anytime',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check
                    className="size-4 shrink-0 text-emerald-400"
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
