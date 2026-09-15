'use client'

import { useEffect, useRef, useState } from 'react'
import { LearningCourseCard } from '@/components/learning-course-card'
import { CoursesEmptyState, FilterPill } from '@/components/course-filters'
import {
  BOARD_FILTERS,
  GRADE_FILTERS,
  filterSchoolCourses,
  schoolCourses,
  type BoardFilter,
  type GradeBand,
} from '@/lib/learning-courses'

export function SchoolLearning() {
  const [grade, setGrade] = useState<'all' | GradeBand>('all')
  const [board, setBoard] = useState<BoardFilter>('all')
  const [entered, setEntered] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  const filtered = filterSchoolCourses(schoolCourses, grade, board)

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
    setGrade('all')
    setBoard('all')
  }

  return (
    <div ref={sectionRef} className="mb-16 md:mb-24">
      <div className="mb-8 flex flex-col gap-6 md:mb-10">
        <div className="max-w-2xl">
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:mb-4 md:text-5xl">
            School{' '}
            <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Learning
            </span>
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 md:text-lg">
            Build a strong foundation with our curriculum-aligned courses. Master
            subjects step-by-step.
          </p>
          <p className="mt-2 text-sm font-medium text-slate-500 md:text-base">
            Structured around national curriculum standards
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div
            role="radiogroup"
            aria-label="Filter by grade band"
            className="flex flex-wrap gap-2"
          >
            {GRADE_FILTERS.map((item) => (
              <FilterPill
                key={item.id}
                active={grade === item.id}
                onClick={() => setGrade(item.id)}
              >
                {item.label}
              </FilterPill>
            ))}
          </div>

          <div
            role="radiogroup"
            aria-label="Filter by board"
            className="flex flex-wrap gap-2"
          >
            {BOARD_FILTERS.map((item) => (
              <FilterPill
                key={item.id}
                active={board === item.id}
                onClick={() => setBoard(item.id)}
              >
                {item.label}
              </FilterPill>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <CoursesEmptyState onReset={resetFilters} />
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
