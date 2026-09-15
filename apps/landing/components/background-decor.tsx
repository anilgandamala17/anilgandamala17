'use client'

import React from 'react'

export function BackgroundDecor() {
  return (
    <div className="absolute inset-0 h-full w-full pointer-events-none -z-10 overflow-hidden select-none">
      {/* === Pattern 1: Near Top (Hero Right) === */}
      <svg
        className="absolute top-[2%] right-[-5%] w-[600px] h-[600px] opacity-[0.12] rotate-12"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="300" cy="300" r="280" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="20 30" strokeOpacity="0.4" />
        <circle cx="300" cy="300" r="200" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="10 15" strokeOpacity="0.3" />
        <g stroke="#7c3aed" strokeWidth="2.5" strokeOpacity="0.4">
          <line x1="280" y1="20" x2="320" y2="20" /><line x1="300" y1="0" x2="300" y2="40" />
        </g>
      </svg>

      {/* === Pattern 2: Features Section (Left) === */}
      <svg
        className="absolute top-[20%] left-[-8%] w-[550px] h-[550px] opacity-[0.10] -rotate-12"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="250" cy="250" r="220" stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="12 18" strokeOpacity="0.4" />
        <path d="M 50 150 Q 0 50 100 50" stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.3" fill="none" />
        <g stroke="#3b82f6" strokeWidth="3" strokeOpacity="0.4">
          <path d="M 50 400 L 130 400" /><path d="M 50 320 L 50 400" />
        </g>
      </svg>

      {/* === Pattern 3: Courses Section (Right) === */}
      <svg
        className="absolute top-[45%] right-[-5%] w-[650px] h-[650px] opacity-[0.11]"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="300" cy="300" r="280" stroke="#7c3aed" strokeWidth="1" strokeDasharray="25 35" strokeOpacity="0.3" />
        <circle cx="300" cy="300" r="220" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="5 15" strokeOpacity="0.2" />
        <circle cx="580" cy="300" r="12" fill="#3b82f6" fillOpacity="0.3" />
        <circle cx="20" cy="300" r="8" fill="#7c3aed" fillOpacity="0.3" />
      </svg>

      {/* === Pattern 4: Testimonials/Lower Mid (Left) === */}
      <svg
        className="absolute top-[70%] left-[-10%] w-[500px] h-[500px] opacity-[0.09] rotate-90"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="200" cy="200" r="190" stroke="#3b82f6" strokeWidth="1" strokeDasharray="8 12" strokeOpacity="0.4" />
        <g stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.3">
           <path d="M 0 200 L 80 200" />
           <path d="M 200 0 L 200 80" />
        </g>
        <path d="M 320 320 Q 400 350 350 250" stroke="#ec4899" strokeWidth="2" strokeOpacity="0.3" fill="none" />
      </svg>

      {/* === Generic Dots distributed across the height === */}
      <div className="absolute top-[10%] left-[20%] w-40 h-40 opacity-[0.06] grid grid-cols-4 gap-4">
        {Array.from({ length: 16 }).map((_, i) => (<div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500" />))}
      </div>
      <div className="absolute top-[35%] right-[25%] w-32 h-32 opacity-[0.06] grid grid-cols-5 gap-3">
        {Array.from({ length: 15 }).map((_, i) => (<div key={i} className="w-1 h-1 rounded-full bg-purple-500" />))}
      </div>
      <div className="absolute top-[55%] left-[30%] w-40 h-40 opacity-[0.05] grid grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (<div key={i} className="w-2 h-2 rounded-full bg-cyan-500" />))}
      </div>
      <div className="absolute top-[85%] right-[15%] w-40 h-40 opacity-[0.06] grid grid-cols-6 gap-2">
        {Array.from({ length: 18 }).map((_, i) => (<div key={i} className="w-1 h-1 rounded-full bg-pink-500" />))}
      </div>
    </div>
  )
}
