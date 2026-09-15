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
          <div className="mt-10 overflow-hidden rounded-[var(--radius-card)] bg-white/10 p-10 shadow-[var(--shadow-lg)]">
            <Image
              src={BRAND.iconSrc}
              alt=""
              width={320}
              height={320}
              className="mx-auto h-auto w-40 object-contain opacity-90"
              priority
            />
            <p className="mt-4 text-center text-sm text-white/80">
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
