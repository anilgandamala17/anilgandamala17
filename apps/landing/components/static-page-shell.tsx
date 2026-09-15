import Link from 'next/link'
import type { ReactNode } from 'react'
import { Header } from '@/components/header'
import { SectionEyebrow } from '@/components/section-eyebrow'
import { CTAS } from '@/lib/site'

type StaticPageShellProps = {
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
}

export function StaticPageShell({
  eyebrow,
  title,
  description,
  children,
}: StaticPageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="section-padding">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          ) : null}
          <div className="prose prose-slate mt-10 max-w-none text-foreground/90 prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-li:leading-relaxed">
            {children}
          </div>
          <p className="mt-12 text-sm text-muted-foreground">
            Questions?{' '}
            <Link
              href={CTAS.secondary.href}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Contact our team
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
