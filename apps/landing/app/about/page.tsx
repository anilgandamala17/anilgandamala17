import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/static-page-shell'
import { BRAND } from '@/lib/site'

export const metadata: Metadata = {
  title: `About — ${BRAND.name}`,
  description: `Learn about ${BRAND.name}'s mission to personalize learning with AI.`,
}

export default function AboutPage() {
  return (
    <StaticPageShell
      eyebrow="Company"
      title={`About ${BRAND.name}`}
      description="We build adaptive learning experiences for students, professionals, and schools."
    >
      <p>
        {BRAND.name} combines curriculum-aligned content with AI tutoring so every
        learner gets guidance that matches their level, pace, and goals — from
        school exams to career upskilling.
      </p>
      <h2>Our focus</h2>
      <ul>
        <li>Personalized paths instead of one-size-fits-all courses</li>
        <li>Transparent progress for students, parents, and educators</li>
        <li>Responsible AI — human oversight on content and outcomes</li>
      </ul>
      <h2>Who we serve</h2>
      <p>
        K–12 learners preparing for board and competitive exams, working
        professionals building in-demand skills, and schools rolling out structured
        digital learning programs.
      </p>
    </StaticPageShell>
  )
}
