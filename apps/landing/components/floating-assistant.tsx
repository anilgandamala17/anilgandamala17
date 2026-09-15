'use client'

import React, { useState, useEffect, lazy, Suspense } from 'react'
import { X } from 'lucide-react'
import { BrandIcon } from '@/components/brand'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

const AiAssistant = lazy(() =>
  import('@/components/ai-assistant').then((m) => ({ default: m.AiAssistant })),
)

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [showInitialTag, setShowInitialTag] = useState(true)
  const [isPulsing, setIsPulsing] = useState(true)

  useEffect(() => {
    const pulseStop = setTimeout(() => setIsPulsing(false), 3000)
    const hideTimer = setTimeout(() => setShowInitialTag(false), 14000)
    return () => {
      clearTimeout(pulseStop)
      clearTimeout(hideTimer)
    }
  }, [])

  return (
    <>
      <style>{`
        @keyframes orb-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes orb-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.3), 0 0 25px rgba(6, 182, 212, 0.15); }
          50% { box-shadow: 0 0 35px rgba(59, 130, 246, 0.6), 0 0 50px rgba(6, 182, 212, 0.35); }
        }
        @keyframes greeting-shake {
          0%, 100% { transform: scale(1); }
          10%, 30%, 50%, 70%, 90% { transform: scale(1.06) rotate(3deg); }
          20%, 40%, 60%, 80% { transform: scale(1.06) rotate(-3deg); }
        }
        @keyframes orbit-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.04); opacity: 1; }
        }
        @keyframes tag-slide-in {
          0% { transform: scale(0.85) translateY(12px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes tag-slide-in-desktop {
          0% { transform: scale(0.85) translateX(15px); opacity: 0; }
          100% { transform: scale(1) translateX(0); opacity: 1; }
        }
        .orb-float-anim {
          animation: orb-float 6s ease-in-out infinite;
        }
        .orb-glow-anim {
          animation: orb-glow 4s ease-in-out infinite;
        }
        .greeting-shake-anim {
          animation: greeting-shake 1.5s ease-in-out infinite;
        }
        .animate-orbit {
          animation: orbit-rotate 10s linear infinite;
          transform-origin: 50px 50px;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
          transform-origin: 50px 50px;
        }
        .animate-tag-slide-in {
          animation: tag-slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @media (min-width: 768px) {
          .animate-tag-slide-in {
            animation: tag-slide-in-desktop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        }
        .bg-orb-gradient {
          background: linear-gradient(135deg, #ffffff, #f0fdfa, #eff6ff);
        }
      `}</style>

        {/* Floating Launcher and Tooltip Wrapper */}
      <div className="fixed bottom-5 right-5 md:bottom-6 md:right-6 z-40 flex flex-col md:flex-row items-end md:items-center pointer-events-none gap-2.5 md:gap-3">
        
        {/* Initial Animated Greeting Tag — pill matching hero reference */}
        {showInitialTag && (
          <div className="bg-white border border-slate-200/80 text-slate-800 pl-3.5 pr-2.5 py-2.5 rounded-full shadow-[0_10px_28px_rgba(15,23,42,0.12)] text-xs font-semibold animate-tag-slide-in pointer-events-auto select-none flex items-center gap-2.5 whitespace-nowrap mb-1 md:mb-0">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="leading-tight text-slate-800">Aɪra Assistant — Ask anything</span>
            <button
              onClick={() => setShowInitialTag(false)}
              suppressHydrationWarning
              className="text-slate-400 hover:text-slate-600 transition-colors ml-0.5 p-1 hover:bg-slate-100 rounded-full cursor-pointer"
              title="Close tag"
              aria-label="Dismiss assistant tip"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Floating Orb Launcher Button */}
        <button
          onClick={() => {
            setIsOpen(true)
            setShowInitialTag(false)
          }}
          suppressHydrationWarning
          className={`w-[68px] h-[68px] md:w-20 md:h-20 rounded-full relative flex items-center justify-center shadow-[0_12px_32px_rgba(37,99,235,0.28)] border border-white/70 transition-all duration-300 hover:scale-[1.08] active:scale-95 cursor-pointer pointer-events-auto bg-orb-gradient orb-glow-anim ${
            isPulsing ? 'greeting-shake-anim' : 'orb-float-anim'
          }`}
          title="Aɪra AI Assistant"
          aria-label="Open Aɪra Assistant"
        >
          {/* Subtle Outer Glow Rings */}
          <div className="absolute -inset-1.5 rounded-full border border-blue-500/10 bg-blue-500/5 -z-10 animate-pulse" />
          <div className="absolute -inset-3 rounded-full bg-cyan-500/5 -z-20 animate-[pulse-soft_6s_ease-in-out_infinite]" />
          
          {/* Pulsing ring indicating availability */}
          <div className="absolute inset-0 rounded-full bg-blue-500/15 -z-10 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />

          {/* Official Aɪra brand icon launcher */}
          <span className="relative z-10 flex size-[70%] items-center justify-center">
            <BrandIcon
              size={64}
              className="size-full drop-shadow-sm animate-pulse-slow"
              priority
            />
          </span>

          {/* Active indicator (Green Dot) */}
          <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full z-20 flex items-center justify-center shadow-lg" title="Aɪra Assistant is available">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-slate-950/70 backdrop-blur-md"
          className="h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-none sm:top-[50%] sm:left-[50%] sm:h-[80vh] sm:max-h-[850px] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-3xl"
        >
          <DialogTitle className="sr-only">Aɪra AI Assistant</DialogTitle>
          <DialogDescription className="sr-only">
            Chat with Aɪra&apos;s learning counselor.
          </DialogDescription>
          {isOpen && (
            <Suspense fallback={<div className="flex h-full items-center justify-center bg-slate-950 text-white/60">Loading…</div>}>
              <AiAssistant
                isModal={true}
                onClose={() => setIsOpen(false)}
              />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
