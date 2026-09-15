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
  const [portalHref, setPortalHref] = useState<string | null>(null)
  const [roleReady, setRoleReady] = useState(false)

  useEffect(() => {
    if (!user) {
      setPortalHref(null)
      setRoleReady(false)
      return
    }
    let cancelled = false
    setRoleReady(false)
    setPortalHref(null)
    void getUserAppRole(user.uid).then((role) => {
      if (cancelled) return
      setPortalHref(getPostAuthDestination(role))
      setRoleReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  if (!loading && user) {
    if (!roleReady || !portalHref) {
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
        href={portalHref}
        className={cn(className)}
        onClick={(e) => {
          onNavigate?.()
          e.preventDefault()
          navigateToApp(portalHref)
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
