type TeachingProgressBarProps = {
  currentStep: number;
  totalSteps: number;
  /** 0–100 from store; only shown when real */
  percent?: number;
  className?: string;
  compact?: boolean;
};

/**
 * Compact real lesson progress — no fabricated values.
 */
export default function TeachingProgressBar({
  currentStep,
  totalSteps,
  percent,
  className = '',
  compact = false,
}: TeachingProgressBarProps) {
  const safeTotal = Math.max(1, totalSteps || 1);
  const stepIndex = Math.min(Math.max(currentStep, 0), safeTotal - 1);
  const derived = Math.round(((stepIndex + 1) / safeTotal) * 100);
  const shown = typeof percent === 'number' && percent >= 0 ? Math.min(100, Math.round(percent)) : derived;
  const fill = Math.max(0, Math.min(100, shown));

  return (
    <div
      className={`flex items-center gap-2 min-w-0 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={fill}
      aria-label={`Lesson progress: step ${stepIndex + 1} of ${safeTotal}, ${fill}%`}
    >
      {!compact && (
        <span
          className="shrink-0 text-[11px] font-bold tabular-nums uppercase tracking-wide"
          style={{ color: 'var(--teaching-panel-text-muted, #475569)' }}
        >
          Lesson {stepIndex + 1}/{safeTotal}
        </span>
      )}
      <div
        className="h-1.5 flex-1 min-w-[48px] max-w-[140px] overflow-hidden rounded-full"
        style={{ background: 'var(--dash-surface-2, #e2e8f0)' }}
        aria-hidden
      >
        <div
          className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
          style={{
            width: `${fill}%`,
            background: 'var(--teaching-accent, #1d4ed8)',
          }}
        />
      </div>
      {!compact && (
        <span
          className="shrink-0 text-[11px] font-bold tabular-nums"
          style={{ color: 'var(--teaching-accent, #1d4ed8)' }}
        >
          {fill}%
        </span>
      )}
    </div>
  );
}
