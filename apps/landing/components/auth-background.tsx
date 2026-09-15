'use client'

import React, { useEffect, useState } from 'react'

export function AuthBackground() {
  const [mounted, setMounted] = useState(false)
  const [floatingElements, setFloatingElements] = useState<{ top: string; left: string; duration: string; delay: string }[]>([])

  useEffect(() => {
    const elements = [...Array(6)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: `${10 + Math.random() * 20}s`,
      delay: `${Math.random() * 5}s`,
    }))
    
    // Defer state updates to prevent synchronous cascading render warning
    const timer = setTimeout(() => {
      setMounted(true)
      setFloatingElements(elements)
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      {/* Primary Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F7F9FC] via-[#EEF3F9] to-[#E6F0FF]" />
      
      {/* Floating Animated Shapes */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
      
      {/* Animated Particles / Dots */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.2]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#4f46e5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Dynamic Floating Elements (SVG Icons) - Only render on client to avoid hydration mismatch */}
      {mounted && (
        <div className="absolute inset-0">
          {floatingElements.map((style, i) => (
            <div
              key={i}
              className="absolute animate-float opacity-[0.05]"
              style={{
                top: style.top,
                left: style.left,
                animationDuration: style.duration,
                animationDelay: style.delay,
              }}
            >
              {i % 2 === 0 ? (
                <svg className="w-8 h-8 md:w-12 md:h-12" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 md:w-12 md:h-12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-40px) rotate(10deg); }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  )
}
