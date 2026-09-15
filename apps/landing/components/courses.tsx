'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SchoolLearning } from '@/components/school-learning'
import { ProfessionalLearning } from '@/components/professional-learning'

export function Courses() {
  return (
    <section
      id="courses"
      className="relative isolate overflow-hidden bg-slate-50/60 py-12 md:py-24"
    >
      <div className="pointer-events-none absolute top-0 right-[10%] -z-20 h-[650px] w-[650px] rounded-full bg-indigo-300/25 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-[10%] -z-20 h-[650px] w-[650px] rounded-full bg-blue-300/25 blur-[130px]" />

      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden">
        <svg
          className="absolute top-[5%] left-[-10%] h-[850px] w-[850px] opacity-[0.35]"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="400"
            cy="400"
            r="380"
            stroke="#4f46e5"
            strokeWidth="1.5"
            strokeDasharray="3 15"
            strokeOpacity="0.7"
          />
          <circle
            cx="400"
            cy="400"
            r="320"
            stroke="#2563eb"
            strokeWidth="2"
            strokeDasharray="8 24"
            strokeOpacity="0.6"
          />
          <g stroke="#2563eb" strokeWidth="2" strokeOpacity="0.8">
            <path d="M 600 200 L 700 200" />
            <path d="M 700 100 L 700 200" />
            <circle cx="700" cy="200" r="4" fill="#2563eb" />
          </g>
        </svg>

        <svg
          className="absolute right-[-10%] bottom-[-10%] h-[750px] w-[750px] rotate-180 opacity-[0.3]"
          viewBox="0 0 700 700"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="350"
            cy="350"
            r="330"
            stroke="#4f46e5"
            strokeWidth="1.5"
            strokeDasharray="4 15"
            strokeOpacity="0.7"
          />
          <circle
            cx="350"
            cy="350"
            r="270"
            stroke="#0ea5e9"
            strokeWidth="1.5"
            strokeDasharray="2 18"
            strokeOpacity="0.6"
          />
          <circle cx="350" cy="20" r="6" fill="#4f46e5" fillOpacity="0.6" />
        </svg>

        <div className="absolute top-[40%] right-[12%] grid h-56 w-56 grid-cols-8 gap-8 opacity-[0.15]">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-indigo-900" />
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl px-4 md:px-6">
        <SchoolLearning />
        <ProfessionalLearning />

        <div className="mt-20 text-center">
          <Button
            size="lg"
            className="rounded-full bg-slate-900 px-8 py-6 text-lg text-white shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1 hover:bg-slate-800"
            asChild
          >
            <Link href="/#courses">Browse All Catalog</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
