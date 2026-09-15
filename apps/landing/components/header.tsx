'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, GraduationCap, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { AudienceNavLink } from '@/components/audience-nav-link'
import { AuthEntryLink } from '@/components/auth-entry-link'
import { HeaderLogo } from '@/components/header-logo'
import { UserProfileMenu } from '@/components/user-profile-menu'
import { cn } from '@/lib/utils'
import { CTAS, EXTERNAL, BRAND } from '@/lib/site'

const HASH_LINKS = [
  { label: 'Features', hash: '#features' },
  { label: 'Courses', hash: '#courses' },
  { label: 'How it works', hash: '#how-it-works' },
] as const

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const [navPath, setNavPath] = useState(pathname)
  const isHome = pathname === '/'
  const { user, loading: authLoading, logOut } = useAuth()

  if (navPath !== pathname) {
    setNavPath(pathname)
    setMobileOpen(false)
  }

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  const hashHref = (hash: string) => (isHome ? hash : `/${hash}`)

  const handleLogOut = async () => {
    setMobileOpen(false)
    try {
      await logOut()
    } catch {
      /* still send user to the landing page */
    }
    window.location.replace('/')
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-200',
        scrolled
          ? 'border-b border-border bg-background/80 shadow-sm backdrop-blur-md'
          : 'border-b border-transparent bg-background/60 backdrop-blur-sm',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href={isHome ? '#home' : '/'}
          className="inline-flex shrink-0 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label={BRAND.name}
        >
          <HeaderLogo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {HASH_LINKS.map((item) => (
            <a
              key={item.hash}
              href={hashHref(item.hash)}
              className="rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {item.label}
            </a>
          ))}

          <Link
            href="/pricing"
            className="rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Pricing
          </Link>

          <AudienceNavLink
            audience="schools"
            className="ml-1 inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] bg-primary-muted px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <GraduationCap className="size-3.5 stroke-[1.75]" aria-hidden />
            {EXTERNAL.schools.label}
          </AudienceNavLink>

          <AudienceNavLink
            audience="professionals"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] bg-muted px-3 py-1.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Briefcase className="size-3.5 stroke-[1.75]" aria-hidden />
            {EXTERNAL.professionals.label}
          </AudienceNavLink>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {authLoading ? (
            <div
              className="hidden h-8 w-24 animate-pulse rounded-[var(--radius-btn)] bg-muted sm:block"
              aria-hidden
            />
          ) : user ? (
            <UserProfileMenu
              user={user}
              onLogOut={handleLogOut}
            />
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden rounded-[var(--radius-btn)] sm:inline-flex"
                asChild
              >
                <AuthEntryLink href="/login">Log in</AuthEntryLink>
              </Button>
              <Button
                size="sm"
                className="hidden rounded-[var(--radius-btn)] bg-accent text-accent-foreground hover:bg-accent/90 sm:inline-flex"
                asChild
              >
                <AuthEntryLink href={CTAS.primary.href}>{CTAS.primary.label}</AuthEntryLink>
              </Button>
            </>
          )}
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-btn)] text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <X className="size-5 stroke-[1.75]" />
            ) : (
              <Menu className="size-5 stroke-[1.75]" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-t border-border bg-background lg:hidden"
        >
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4"
            aria-label="Mobile"
          >
            {HASH_LINKS.map((item) => (
              <a
                key={item.hash}
                href={hashHref(item.hash)}
                onClick={() => setMobileOpen(false)}
                className="rounded-[var(--radius-btn)] px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="rounded-[var(--radius-btn)] px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Pricing
            </Link>
            <AudienceNavLink
              audience="schools"
              onNavigate={() => setMobileOpen(false)}
              className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary-muted"
            >
              <GraduationCap className="size-4 stroke-[1.75]" aria-hidden />
              {EXTERNAL.schools.label}
            </AudienceNavLink>
            <AudienceNavLink
              audience="professionals"
              onNavigate={() => setMobileOpen(false)}
              className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] px-3 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-muted"
            >
              <Briefcase className="size-4 stroke-[1.75]" aria-hidden />
              {EXTERNAL.professionals.label}
            </AudienceNavLink>
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3 sm:hidden">
              {authLoading ? (
                <div className="h-10 animate-pulse rounded-[var(--radius-btn)] bg-muted" aria-hidden />
              ) : user ? (
                <div className="px-1 py-1">
                  <UserProfileMenu user={user} onLogOut={handleLogOut} />
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="rounded-[var(--radius-btn)]"
                    asChild
                  >
                    <AuthEntryLink
                      href="/login"
                      onNavigate={() => setMobileOpen(false)}
                    >
                      Log in
                    </AuthEntryLink>
                  </Button>
                  <Button
                    className="rounded-[var(--radius-btn)] bg-accent text-accent-foreground hover:bg-accent/90"
                    asChild
                  >
                    <AuthEntryLink
                      href={CTAS.primary.href}
                      onNavigate={() => setMobileOpen(false)}
                    >
                      {CTAS.primary.label}
                    </AuthEntryLink>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
