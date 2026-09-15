'use client'

import { BrandIcon, BrandWordmark } from '@/components/brand'
import { BRAND } from '@/lib/site'
import { cn } from '@/lib/utils'

/**
 * Header brand lockup: official AIra mark + Aɪra wordmark.
 */
export function HeaderLogo({
  className,
  tone = 'gradient',
  size = 'md',
}: {
  className?: string
  /** Wordmark color treatment — use `white` on dark auth panels */
  tone?: 'gradient' | 'white'
  size?: 'md' | 'lg'
}) {
  const iconPx = size === 'lg' ? 44 : 36

  return (
    <span
      className={cn(
        'header-logo inline-flex shrink-0 items-center gap-2',
        className,
      )}
    >
      <BrandIcon
        size={iconPx}
        className={size === 'lg' ? 'size-11' : 'size-9'}
        priority
      />
      <BrandWordmark
        tone={tone}
        className={
          size === 'lg'
            ? 'text-2xl sm:text-[1.75rem]'
            : 'text-xl sm:text-[1.35rem]'
        }
      />
      <span className="sr-only">{BRAND.name}</span>
    </span>
  )
}
