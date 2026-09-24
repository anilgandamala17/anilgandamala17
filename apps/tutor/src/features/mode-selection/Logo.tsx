import { AIRA_BRAND_MARK_SRC } from '@/constants/brand';

export type LogoSize = 'sm' | 'md' | 'lg';

/** Pixel sizes tuned so the orbital A + book + spark stay readable */
const SIZE_PX: Record<LogoSize, number> = {
  sm: 36,
  md: 40,
  lg: 48,
};

export interface LogoProps {
  /** sm = navbar / card chips, md = footer, lg = hero chip */
  size?: LogoSize;
  /** Show Aɪra wordmark beside the mark */
  showWordmark?: boolean;
  /** Frosted chip for dark / photo backgrounds — wraps mark + optional wordmark */
  chip?: boolean;
  className?: string;
  wordmarkClassName?: string;
  /** Kept for call-site compatibility */
  markId?: string;
}

/**
 * Single source of truth for Aɪra branding on mode-selection.
 * Uses the official transparent brand mark (orbital A + book + spark).
 */
export default function Logo({
  size = 'sm',
  showWordmark = true,
  chip = false,
  className = '',
  wordmarkClassName = '',
}: LogoProps) {
  const px = SIZE_PX[size];

  const mark = (
    <img
      src={AIRA_BRAND_MARK_SRC}
      alt=""
      width={px}
      height={px}
      className="mode-selection-logo__mark"
      draggable={false}
      decoding="async"
    />
  );

  const wordmark = showWordmark ? (
    <span className={`mode-selection-logo__word ${wordmarkClassName}`}>Aɪra</span>
  ) : null;

  const inner = (
    <>
      {mark}
      {wordmark}
    </>
  );

  return (
    <span
      className={`mode-selection-logo mode-selection-logo--${size} ${chip ? 'mode-selection-logo--chip' : ''} ${className}`}
      style={{ ['--ms-logo-size' as string]: `${px}px` }}
      role="img"
      aria-label="Aira"
    >
      {chip ? <span className="mode-selection-logo__chip">{inner}</span> : inner}
    </span>
  );
}
