'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { HeaderLogo } from '@/components/header-logo'
import { BRAND } from '@/lib/site'
import { cn } from '@/lib/utils'

type AuthShellProps = {
  children: ReactNode
  /** Short left-panel headline (desktop only) */
  panelHeadline: string
  /** One supporting sentence (desktop only) */
  panelSupport: string
}

/**
 * Shared enterprise auth layout: split-screen on desktop, form-only on mobile.
 */
export function AuthShell({
  children,
  panelHeadline,
  panelSupport,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--neutral-50)]">
      {/* Marketing panel — desktop only */}
      <aside
        className={cn(
          'relative hidden w-[46%] shrink-0 flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14',
          'bg-gradient-to-br from-[var(--primary)] to-[#0e7490]',
        )}
      >
        <Link
          href="/"
          className="relative z-10 inline-flex focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          aria-label={BRAND.name}
        >
          <HeaderLogo tone="white" size="lg" />
        </Link>

        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl font-bold tracking-tight text-white xl:text-4xl">
            {panelHeadline}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/80">
            {panelSupport}
          </p>
          <div className="relative mt-10 aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-lg)] ring-1 ring-white/20">
            <Image
              src={BRAND.authVisualSrc}
              alt="Students learning with Aɪra"
              width={640}
              height={800}
              className="absolute inset-0 h-full w-full object-cover object-center"
              priority
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0e7490]/90 via-[#0e7490]/15 to-transparent"
              aria-hidden
            />
            <p className="absolute inset-x-0 bottom-0 px-5 pb-5 text-center text-sm font-medium text-white/95">
              Students learning with Aɪra
            </p>
          </div>
        </div>

        <p className="relative z-10 text-sm text-white/50">
          AI-powered learning for exams and careers
        </p>
      </aside>

      {/* Form column */}
      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-4 pt-6 sm:px-8 lg:hidden">
          <Link
            href="/"
            className="inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label={BRAND.name}
          >
            <HeaderLogo />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-[400px]">
            <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-[var(--shadow-md)] sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export const authInputClassName =
  'h-11 rounded-[var(--radius-btn)] border-border bg-card px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40'

export const authLabelClassName =
  'text-sm font-medium text-foreground'

export const authPrimaryBtnClassName =
  'h-11 w-full rounded-[var(--radius-btn)] bg-foreground text-sm font-semibold text-background shadow-sm transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60'
