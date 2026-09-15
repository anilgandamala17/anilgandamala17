'use client'

import Image from 'next/image'
import { BRAND } from '@/lib/site'
import { cn } from '@/lib/utils'

/** Official Aɪra brand icon path (transparent PNG). */
export const BRAND_ICON_SRC = BRAND.iconSrc

/** Full Aɪra wordmark — Logo 1. Uses the official "ɪ". */
export function BrandWordmark({
  className,
  tone = 'gradient',
}: {
  className?: string
  tone?: 'gradient' | 'white' | 'inherit'
}) {
  return (
    <span
      className={cn(
        'font-bold tracking-tight',
        tone === 'gradient' && 'gradient-text',
        tone === 'white' && 'text-white',
        className,
      )}
    >
      {BRAND.name}
    </span>
  )
}

/**
 * Official Aɪra brand icon — Logo 2.
 * Uses the transparent mark so it does not render as a white image plate.
 */
export function BrandIcon({
  className,
  size = 40,
  priority,
}: {
  className?: string
  size?: number
  priority?: boolean
}) {
  return (
    <Image
      src={BRAND_ICON_SRC}
      alt=""
      width={size}
      height={size}
      priority={priority}
      className={cn(
        'bg-transparent object-contain select-none [background:transparent]',
        className,
      )}
      draggable={false}
      aria-hidden
    />
  )
}
