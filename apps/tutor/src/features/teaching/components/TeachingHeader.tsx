import type { ReactNode } from 'react';
import { ArrowLeft, Volume2, VolumeX, Settings } from 'lucide-react';
import AiraLogo from '@/components/brand/AiraLogo';
import SignOutButton from '@/components/common/SignOutButton';
import TeachingProgressBar from './TeachingProgressBar';

export type TeachingHeaderProps = {
  /** Subject only, e.g. Mathematics */
  subjectLabel: string;
  topicLabel: string;
  chapterLabel?: string | null;
  /** Optional stream chip, e.g. MPC / BiPC */
  streamLabel?: string | null;
  currentStep: number;
  totalSteps: number;
  progressPercent?: number;
  isMuted: boolean;
  onBack: () => void;
  onToggleMute: () => void;
  onSettings: () => void;
  profileSlot?: ReactNode;
  className?: string;
};

/**
 * Compact learning header — topic-first, subject/stream as quiet chips.
 */
export default function TeachingHeader({
  subjectLabel,
  topicLabel,
  chapterLabel,
  streamLabel,
  currentStep,
  totalSteps,
  progressPercent,
  isMuted,
  onBack,
  onToggleMute,
  onSettings,
  profileSlot,
  className = '',
}: TeachingHeaderProps) {
  const backLabel = [subjectLabel, streamLabel].filter(Boolean).join(' · ') || 'curriculum';
  const metaTitle = [subjectLabel, streamLabel, chapterLabel, topicLabel]
    .filter(Boolean)
    .join(' · ');

  return (
    <header
      className={`flex items-center justify-between sticky top-0 z-50 shrink-0 border-b safe-top ${className}`}
      style={{
        minHeight: 'clamp(56px, 11vh, 64px)',
        paddingLeft: 'max(var(--teaching-content-padding-x, 16px), var(--safe-left, 0px))',
        paddingRight: 'max(var(--teaching-content-padding-x, 16px), var(--safe-right, 0px))',
        paddingTop: '0.35rem',
        paddingBottom: '0.35rem',
        background: 'var(--teaching-header-bg)',
        borderColor: 'var(--teaching-panel-divider, rgba(15,23,42,0.08))',
        backdropFilter: 'saturate(180%) blur(12px)',
        WebkitBackdropFilter: 'saturate(180%) blur(12px)',
      }}
    >
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={onBack}
          className="touch-target p-2.5 min-w-[44px] min-h-[44px] rounded-[var(--dash-radius-sm,0.5rem)] inline-flex items-center justify-center transition-colors hover:bg-[var(--dash-surface-1,#f8fafc)] focus-visible:outline-none focus-visible:shadow-[var(--dash-focus-ring)] shrink-0"
          aria-label={`Back to ${backLabel}`}
          style={{ color: 'var(--teaching-panel-text-muted)' }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex shrink-0 items-center pr-3.5 border-r" style={{ borderColor: 'var(--teaching-panel-divider, #e2e8f0)' }} aria-hidden>
          <AiraLogo height={28} />
        </div>

        <div className="min-w-0 flex-1 py-0.5" title={metaTitle}>
          <h1
            className="text-[0.95rem] sm:text-base font-extrabold tracking-tight truncate leading-snug"
            style={{ color: 'var(--teaching-panel-text, #0f172a)' }}
          >
            {topicLabel || 'Lesson'}
          </h1>

          <div className="mt-1 flex items-center gap-1.5 min-w-0">
            {subjectLabel ? (
              <span
                className="shrink-0 max-w-[9rem] truncate rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  background: 'color-mix(in srgb, var(--teaching-accent, #1d4ed8) 10%, transparent)',
                  color: 'var(--teaching-accent, #1d4ed8)',
                }}
              >
                {subjectLabel}
              </span>
            ) : null}

            {streamLabel ? (
              <span
                className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  background: 'var(--dash-surface-1, #f1f5f9)',
                  color: 'var(--teaching-panel-text-muted, #475569)',
                }}
              >
                {streamLabel}
              </span>
            ) : null}

            {chapterLabel ? (
              <>
                <span
                  className="shrink-0 text-[11px] select-none"
                  style={{ color: 'var(--dash-border-strong, #cbd5e1)' }}
                  aria-hidden
                >
                  ·
                </span>
                <span
                  className="min-w-0 truncate text-[11px] sm:text-xs font-medium"
                  style={{ color: 'var(--teaching-panel-text-muted, #64748b)' }}
                >
                  {chapterLabel}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <TeachingProgressBar
          className="hidden lg:flex shrink-0 ml-2"
          currentStep={currentStep}
          totalSteps={totalSteps}
          percent={progressPercent}
        />
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-2">
        <TeachingProgressBar
          className="lg:hidden w-[64px] sm:w-[80px]"
          compact
          currentStep={currentStep}
          totalSteps={totalSteps}
          percent={progressPercent}
        />
        <button
          type="button"
          onClick={onToggleMute}
          className="touch-target p-2 min-w-[44px] min-h-[44px] rounded-[var(--dash-radius-sm,0.5rem)] inline-flex items-center justify-center transition-colors hover:bg-[var(--dash-surface-1)] focus-visible:outline-none focus-visible:shadow-[var(--dash-focus-ring)]"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-red-500" />
          ) : (
            <Volume2 className="h-5 w-5 text-emerald-600" />
          )}
        </button>
        <button
          type="button"
          onClick={onSettings}
          className="touch-target p-2 min-w-[44px] min-h-[44px] rounded-[var(--dash-radius-sm,0.5rem)] inline-flex items-center justify-center transition-colors hover:bg-[var(--dash-surface-1)] focus-visible:outline-none focus-visible:shadow-[var(--dash-focus-ring)]"
          aria-label="Settings"
          style={{ color: 'var(--teaching-panel-text-muted)' }}
        >
          <Settings className="h-5 w-5" />
        </button>
        {profileSlot}
        <SignOutButton className="touch-target p-2 rounded-[var(--dash-radius-sm,0.5rem)] transition-colors hover:bg-[var(--dash-surface-1)] inline-flex items-center justify-center min-w-[44px] min-h-[44px]" />
      </div>
    </header>
  );
}
