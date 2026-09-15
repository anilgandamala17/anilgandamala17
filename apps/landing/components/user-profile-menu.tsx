'use client'

import { useEffect, useState } from 'react'
import { LogOut, GraduationCap, Briefcase } from 'lucide-react'
import type { User } from '@/lib/firebase/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ComingSoonModal } from '@/components/coming-soon-modal'
import { getUserAppRole } from '@/lib/firebase/auth'
import { homeForRole } from '@/lib/auth-redirect'
import { EXTERNAL } from '@/lib/site'

function displayNameFromUser(user: User): string {
  const name = user.displayName?.trim()
  if (name) return name
  const emailLocal = user.email?.split('@')[0]?.trim()
  if (emailLocal) return emailLocal
  return 'Learner'
}

function initialsFromUser(user: User): string {
  const name = displayNameFromUser(user)
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

type UserProfileMenuProps = {
  user: User
  onLogOut: () => void | Promise<void>
  /** Compact trigger for tight header layouts */
  compact?: boolean
}

export function UserProfileMenu({
  user,
  onLogOut,
  compact = false,
}: UserProfileMenuProps) {
  const [comingSoonOpen, setComingSoonOpen] = useState(false)
  const [schoolsHref, setSchoolsHref] = useState<string | null>(null)
  const [roleReady, setRoleReady] = useState(false)
  const name = displayNameFromUser(user)
  const email = user.email ?? ''
  const photoURL = user.photoURL ?? undefined
  const initials = initialsFromUser(user)

  useEffect(() => {
    let cancelled = false
    setRoleReady(false)
    setSchoolsHref(null)
    void getUserAppRole(user.uid).then((role) => {
      if (cancelled) return
      setSchoolsHref(homeForRole(role))
      setRoleReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [user.uid])

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex max-w-[12rem] items-center gap-2 rounded-full border border-border/80 bg-background/80 py-1 pl-1 pr-2.5 text-left shadow-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[14rem]"
        aria-label={`Account menu for ${name}`}
      >
        <Avatar className="size-8 ring-1 ring-border">
          {photoURL ? (
            <AvatarImage src={photoURL} alt="" referrerPolicy="no-referrer" />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        {!compact ? (
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-xs font-semibold text-foreground">
              {name}
            </span>
            {email ? (
              <span className="truncate text-[10px] text-muted-foreground">
                {email}
              </span>
            ) : null}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 ring-1 ring-border">
              {photoURL ? (
                <AvatarImage
                  src={photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {name}
              </p>
              {email ? (
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer"
          disabled={!roleReady || !schoolsHref}
          onSelect={(e) => {
            e.preventDefault()
            if (!schoolsHref) return
            window.location.assign(schoolsHref)
          }}
        >
          <GraduationCap className="size-4" aria-hidden />
          {EXTERNAL.schools.label}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(e) => {
            e.preventDefault()
            setComingSoonOpen(true)
          }}
        >
          <Briefcase className="size-4" aria-hidden />
          {EXTERNAL.professionals.label}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={() => {
            void onLogOut()
          }}
        >
          <LogOut className="size-4" aria-hidden />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <ComingSoonModal
      open={comingSoonOpen}
      onOpenChange={setComingSoonOpen}
    />
    </>
  )
}
