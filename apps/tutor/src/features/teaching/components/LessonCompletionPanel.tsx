import { CheckCircle2, BookOpen, ArrowRight, RotateCcw } from 'lucide-react';

type LessonCompletionPanelProps = {
  topicName: string;
  onPractice?: () => void;
  onReview: () => void;
  onExit: () => void;
  showPractice?: boolean;
};

/**
 * End-of-lesson completion surface — only render when real progress is complete.
 */
export default function LessonCompletionPanel({
  topicName,
  onPractice,
  onReview,
  onExit,
  showPractice = false,
}: LessonCompletionPanelProps) {
  return (
    <div
      className="rounded-[var(--dash-radius-lg,1rem)] border p-5 sm:p-6 text-center"
      style={{
        background: 'var(--dash-surface-0, #fff)',
        borderColor: 'var(--dash-border, #e2e8f0)',
        boxShadow: 'var(--dash-shadow-2)',
      }}
      role="status"
      aria-live="polite"
    >
      <div
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: 'color-mix(in srgb, #10b981 16%, transparent)', color: '#047857' }}
      >
        <CheckCircle2 className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: 'var(--dash-text)' }}>
        Lesson complete
      </h2>
      <p className="mt-1.5 text-sm" style={{ color: 'var(--dash-text-2)' }}>
        You&apos;ve completed <strong style={{ color: 'var(--dash-text)' }}>{topicName}</strong>.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {showPractice && onPractice ? (
          <button
            type="button"
            onClick={onPractice}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--dash-radius-sm)] px-4 text-sm font-bold text-white"
            style={{ background: 'var(--teaching-accent, #1d4ed8)' }}
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            Practice questions
          </button>
        ) : null}
        <button
          type="button"
          onClick={onReview}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--dash-radius-sm)] border px-4 text-sm font-bold"
          style={{ borderColor: 'var(--dash-border)', color: 'var(--dash-text)' }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Review lesson
        </button>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--dash-radius-sm)] border px-4 text-sm font-bold"
          style={{ borderColor: 'var(--dash-border)', color: 'var(--dash-text-2)' }}
        >
          Exit
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
