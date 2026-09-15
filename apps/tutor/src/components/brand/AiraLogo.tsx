interface AiraLogoProps {
  /** Path to SVG/PNG mark. Defaults to the production mark. */
  markSrc?: string;
  /** Pixel height of the mark (36–40 recommended in nav). Never below 28. */
  height?: number;
  /** Show wordmark beside the mark. */
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

/**
 * Aira brand lockup: gradient atom/orbit mark + "Aɪra" wordmark.
 * Mark sits without a backing container; keep clear space around it.
 */
export default function AiraLogo({
  markSrc = '/tutor-media/aira-mark.png',
  height = 38,
  showWordmark = true,
  className = '',
  wordmarkClassName = '',
}: AiraLogoProps) {
  const safeHeight = Math.max(28, height);

  return (
    <span className={`inline-flex items-center gap-1.5 sm:gap-2 ${className}`}>
      <img
        src={markSrc}
        alt=""
        width={safeHeight}
        height={safeHeight}
        className="flex-shrink-0 object-contain select-none"
        style={{ height: safeHeight, width: safeHeight }}
        draggable={false}
        decoding="async"
      />
      {showWordmark && (
        <span
          className={`font-display text-[1.35rem] sm:text-[1.5rem] font-bold tracking-[-0.03em] text-[var(--color-text-primary,currentColor)] ${wordmarkClassName}`}
        >
          Aɪra
        </span>
      )}
    </span>
  );
}
