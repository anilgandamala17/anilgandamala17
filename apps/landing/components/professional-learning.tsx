'use client'

import { useEffect, useRef, useState } from 'react'
import { LearningCourseCard } from '@/components/learning-course-card'
import { CoursesEmptyState, FilterPill } from '@/components/course-filters'
import {
  FORMAT_FILTERS,
  LEVEL_FILTERS,
  filterProfessionalCourses,
  professionalCourses,
  type ProFormat,
  type ProLevel,
} from '@/lib/learning-courses'

export function ProfessionalLearning() {
  const [level, setLevel] = useState<'all' | ProLevel>('all')
  const [format, setFormat] = useState<'all' | ProFormat>('all')
  const [entered, setEntered] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  const filtered = filterProfessionalCourses(
    professionalCourses,
    level,
    format,
  )

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setEntered(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const resetFilters = () => {
    setLevel('all')
    setFormat('all')
  }

  return (
    <div ref={sectionRef}>
      <div className="mb-8 flex flex-col gap-6 md:mb-10">
        <div className="max-w-2xl">
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:mb-4 md:text-5xl">
            Professional{' '}
            <span className="bg-gradient-to-r from-slate-700 to-teal-700 bg-clip-text text-transparent">
              Learning
            </span>
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 md:text-lg">
            Future-proof your career with industry-aligned tracks — from web and
            AI to design and security.
          </p>
          <p className="mt-2 text-sm font-medium text-slate-500 md:text-base">
            Professional courses are coming soon. Preview the catalog below.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div
            role="radiogroup"
            aria-label="Filter by level"
            className="flex flex-wrap gap-2"
          >
            {LEVEL_FILTERS.map((item) => (
              <FilterPill
                key={item.id}
                active={level === item.id}
                onClick={() => setLevel(item.id)}
              >
                {item.label}
              </FilterPill>
            ))}
          </div>

          <div
            role="radiogroup"
            aria-label="Filter by format"
            className="flex flex-wrap gap-2"
          >
            {FORMAT_FILTERS.map((item) => (
              <FilterPill
                key={item.id}
                active={format === item.id}
                onClick={() => setFormat(item.id)}
              >
                {item.label}
              </FilterPill>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <CoursesEmptyState
          onReset={resetFilters}
          message="Try another level or format, or reset to see the full catalog."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((course, index) => (
            <LearningCourseCard
              key={course.id}
              course={course}
              index={index}
              visible={entered}
            />
          ))}
        </div>
      )}
    </div>
  )
}
