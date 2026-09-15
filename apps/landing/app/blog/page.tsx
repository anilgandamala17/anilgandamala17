import type { Metadata } from 'next'
import Link from 'next/link'
import { StaticPageShell } from '@/components/static-page-shell'
import { CTAS, BRAND } from '@/lib/site'

export const metadata: Metadata = {
  title: `Blog — ${BRAND.name}`,
  description: `Insights on AI-powered learning from the ${BRAND.name} team.`,
}

export default function BlogPage() {
  return (
    <StaticPageShell
      eyebrow="Blog"
      title="Coming soon"
      description="We are preparing articles on learning science, product updates, and customer stories."
    >
      <p>
        The {BRAND.name} blog will launch with practical guides for students,
        educators, and career switchers. In the meantime, you can explore the
        product or talk to our team.
      </p>
      <p>
        <Link
          href={CTAS.primary.href}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Start a free trial
        </Link>{' '}
        or{' '}
        <Link
          href={CTAS.secondary.href}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          book a demo
        </Link>
        .
      </p>
    </StaticPageShell>
  )
}
