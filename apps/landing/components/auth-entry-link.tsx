'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'
import { getUserAppRole } from '@/lib/firebase/auth'
import { getPostAuthDestination } from '@/lib/auth-redirect'
import { navigateToApp } from '@/lib/navigation'
import { cn } from '@/lib/utils'

type AuthEntryLinkProps = {
  /** Destination when logged out */
  href: string
  className?: string
  children: ReactNode
  onNavigate?: () => void
  /** Use full page assign for tutor paths even when logged out (rare) */
  forceAssign?: boolean
}

/**
 * Logged out → Next Link to /login or /signup.
 * Logged in → wait for Firestore role, then same-tab navigation to role home.
 */
export function AuthEntryLink({
  href,
  className,
  children,
  onNavigate,
  forceAssign = false,
}: AuthEntryLinkProps) {
  const { user, loading } = useAuth()
  const [roleCache, setRoleCache] = useState<{ uid: string; href: string } | null>(
    null,
  )

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void getUserAppRole(user.uid).then((role) => {
      if (cancelled) return
      setRoleCache({ uid: user.uid, href: getPostAuthDestination(role) })
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const resolvedPortalHref =
    user && roleCache?.uid === user.uid ? roleCache.href : null
  const resolvedRoleReady = Boolean(resolvedPortalHref)

  if (!loading && user) {
    if (!resolvedRoleReady || !resolvedPortalHref) {
      return (
        <span
          role="status"
          aria-busy="true"
          aria-live="polite"
          className={cn(className, 'inline-flex cursor-wait opacity-70 pointer-events-none')}
        >
          {children}
        </span>
      )
    }

    return (
      <a
        href={resolvedPortalHref}
        className={cn(className)}
        onClick={(e) => {
          onNavigate?.()
          e.preventDefault()
          navigateToApp(resolvedPortalHref)
        }}
      >
        {children}
      </a>
    )
  }

  if (forceAssign) {
    return (
      <a
        href={href}
        className={cn(className)}
        onClick={(e) => {
          onNavigate?.()
          e.preventDefault()
          window.location.assign(href)
        }}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} onClick={onNavigate} className={cn(className)}>
      {children}
    </Link>
  )
}
