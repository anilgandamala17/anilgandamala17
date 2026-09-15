import { AIRA_BRAND_MARK_SRC } from '../../constants/brand';

interface AiraLogoProps {
  /** Path to SVG/PNG mark. Defaults to the transparent production mark. */
  markSrc?: string;
  /** Pixel height of the mark (36–40 recommended in nav). Never below 28. */
  height?: number;
  /** Show wordmark beside the mark. */
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

/**
 * Aira brand lockup: transparent orbital mark + "Aɪra" wordmark.
 * Mark sits without a backing plate; keep clear space around it.
 */
export default function AiraLogo({
  markSrc = AIRA_BRAND_MARK_SRC,
  height = 38,
  showWordmark = true,
  className = '',
  wordmarkClassName = '',
}: AiraLogoProps) {
  const safeHeight = Math.max(28, height);

  return (
    <span className={`aira-logo inline-flex items-center gap-1.5 sm:gap-2 ${className}`}>
      <img
        src={markSrc}
        alt=""
        width={safeHeight}
        height={safeHeight}
        className="aira-logo__mark flex-shrink-0 bg-transparent object-contain select-none"
        style={{ height: safeHeight, width: safeHeight, background: 'transparent' }}
        draggable={false}
        decoding="async"
      />
      {showWordmark && (
        <span
          className={`aira-logo__word font-display text-[1.35rem] sm:text-[1.5rem] font-bold tracking-[-0.03em] text-[var(--color-text-primary,currentColor)] ${wordmarkClassName}`}
        >
          Aɪra
        </span>
      )}
    </span>
  );
}

export { AIRA_BRAND_MARK_SRC };
