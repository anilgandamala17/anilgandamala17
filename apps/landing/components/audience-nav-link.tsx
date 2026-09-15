'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import { ComingSoonModal } from '@/components/coming-soon-modal'
import { getUserAppRole } from '@/lib/firebase/auth'
import { homeForRole } from '@/lib/auth-redirect'
import { EXTERNAL } from '@/lib/site'
import { cn } from '@/lib/utils'

type Audience = 'schools' | 'professionals'

type AudienceNavLinkProps = {
  audience: Audience
  className?: string
  onNavigate?: () => void
  children: ReactNode
}

/**
 * Schools: logged out → /login?intent=school
 * Schools: logged in → wait for Firestore role, then role home (never interim mode-selection)
 * Professionals: always opens "Coming soon" popup (tracks not live yet)
 */
export function AudienceNavLink({
  audience,
  className,
  onNavigate,
  children,
}: AudienceNavLinkProps) {
  const { user, loading } = useAuth()
  const [comingSoonOpen, setComingSoonOpen] = useState(false)
  const [roleCache, setRoleCache] = useState<{ uid: string; href: string } | null>(
    null,
  )
  const config = EXTERNAL[audience]

  useEffect(() => {
    if (audience !== 'schools' || !user) {
      return
    }
    let cancelled = false
    void getUserAppRole(user.uid).then((role) => {
      if (cancelled) return
      setRoleCache({ uid: user.uid, href: homeForRole(role) })
    })
    return () => {
      cancelled = true
    }
  }, [audience, user])

  const resolvedPortalHref =
    audience === 'schools' && user && roleCache?.uid === user.uid
      ? roleCache.href
      : null
  const resolvedRoleReady = Boolean(resolvedPortalHref)

  if (audience === 'professionals') {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            onNavigate?.()
            setComingSoonOpen(true)
          }}
          className={cn(className)}
        >
          {children}
        </button>
        <ComingSoonModal
          open={comingSoonOpen}
          onOpenChange={setComingSoonOpen}
        />
      </>
    )
  }

  if (!loading && user) {
    if (!resolvedRoleReady || !resolvedPortalHref) {
      return (
        <button
          type="button"
          disabled
          aria-busy="true"
          className={cn(className, 'cursor-wait opacity-70')}
        >
          {children}
        </button>
      )
    }

    return (
      <a
        href={resolvedPortalHref}
        onClick={(e) => {
          onNavigate?.()
          e.preventDefault()
          window.location.assign(resolvedPortalHref)
        }}
        className={cn(className)}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={config.loginHref} onClick={onNavigate} className={cn(className)}>
      {children}
    </Link>
  )
}
