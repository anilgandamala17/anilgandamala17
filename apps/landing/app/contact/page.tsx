import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { SectionEyebrow } from '@/components/section-eyebrow'
import { CTAS } from '@/lib/site'
import { ContactForm } from '@/components/contact-form'

export const metadata: Metadata = {
  title: 'Contact — Aɪra',
  description: 'Book a demo or talk to our team about Aɪra for students, professionals, and schools.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="section-padding">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-2 md:gap-16 md:px-6">
            <div>
              <SectionEyebrow>Contact</SectionEyebrow>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Book a demo with our team
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Tell us about your school, coaching institute, or learning goals.
                We typically respond within one business day.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Students &amp; parents:</span>{' '}
                  Prefer to try first?{' '}
                  <Link href={CTAS.primary.href} className="font-semibold text-primary underline-offset-4 hover:underline">
                    {CTAS.primary.label}
                  </Link>
                </li>
                <li>
                  <span className="font-medium text-foreground">Schools:</span> Ask about multi-seat
                  rollouts, board alignment, and admin dashboards.
                </li>
                <li>
                  <span className="font-medium text-foreground">Email:</span>{' '}
                  <a
                    href="mailto:hello@aira.example"
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    hello@aira.example
                  </a>
                  <span className="ml-1 text-xs text-warning">(placeholder — replace with real address)</span>
                </li>
              </ul>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
    </div>
  )
}
