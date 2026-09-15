import { cn } from '@/lib/utils'

interface SectionEyebrowProps {
  children: React.ReactNode
  className?: string
}

/** Consistent uppercase label above every section H2. */
export function SectionEyebrow({ children, className }: SectionEyebrowProps) {
  return (
    <p
      className={cn(
        'text-eyebrow font-semibold uppercase tracking-[0.14em] text-primary',
        className,
      )}
    >
      {children}
    </p>
  )
}
