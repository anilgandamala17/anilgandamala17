'use client'

import { cn } from '@/lib/utils'

type PasswordStrengthProps = {
  password: string
}

function scorePassword(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0
  let score = 0
  if (password.length >= 6) score += 1
  if (password.length >= 10) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1
  if (score <= 1) return 1
  if (score === 2) return 2
  return 3
}

const LABELS = {
  0: '',
  1: 'Weak',
  2: 'Medium',
  3: 'Strong',
} as const

const COLORS = {
  0: 'bg-neutral-200',
  1: 'bg-[var(--error)]',
  2: 'bg-[var(--warning)]',
  3: 'bg-[var(--success)]',
} as const

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const level = scorePassword(password)
  if (!password) return null

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= level ? COLORS[level] : 'bg-neutral-200',
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium text-foreground">{LABELS[level]}</span>
      </p>
    </div>
  )
}
