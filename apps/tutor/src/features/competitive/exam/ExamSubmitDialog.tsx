import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useDialogA11y } from '@/hooks/useDialogA11y';

export type SubmitDialogMode =
  | 'all-attempted'
  | 'has-unanswered'
  | 'final-confirm'
  | null;

type ExamSubmitDialogProps = {
  mode: SubmitDialogMode;
  unansweredCount: number;
  totalQuestions: number;
  answeredCount: number;
  submitting?: boolean;
  onCancel: () => void;
  onReviewUnanswered: () => void;
  onSubmitAnyway: () => void;
  onConfirmSubmit: () => void;
};

/**
 * Professional Review & Submit dialogs (Phase 3).
 * Never submits on first click when unanswered questions exist.
 */
export default function ExamSubmitDialog({
  mode,
  unansweredCount,
  totalQuestions,
  answeredCount,
  submitting = false,
  onCancel,
  onReviewUnanswered,
  onSubmitAnyway,
  onConfirmSubmit,
}: ExamSubmitDialogProps) {
  const open = Boolean(mode);
  const containerRef = useDialogA11y({
    open,
    onClose: submitting ? undefined : onCancel,
    disableEscape: submitting,
  });

  const title = useMemo(() => {
    if (mode === 'all-attempted') return 'Submit Examination?';
    if (mode === 'has-unanswered') return 'You have unanswered questions';
    if (mode === 'final-confirm') return 'Submit Exam?';
    return '';
  }, [mode]);

  if (!mode) return null;

  const summaryId = 'exam-submit-summary';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-submit-title"
      aria-describedby={summaryId}
    >
      <div className="flex max-h-[min(92dvh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                mode === 'has-unanswered'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300'
                  : 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300'
              }`}
              aria-hidden
            >
              {mode === 'has-unanswered' ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <h2 id="exam-submit-title" className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {title}
              </h2>
              <p id={summaryId} className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {answeredCount} of {totalQuestions} answered
                {unansweredCount > 0 ? ` · ${unansweredCount} unanswered` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-slate-800"
            aria-label="Close submission dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
          {mode === 'all-attempted' ? (
            <p>
              You have attempted all questions. Once submitted, you cannot change your answers.
            </p>
          ) : null}
          {mode === 'has-unanswered' ? (
            <p>
              You have not attempted <strong className="text-slate-900 dark:text-white">{unansweredCount}</strong>{' '}
              {unansweredCount === 1 ? 'question' : 'questions'}. Would you like to review the unanswered
              questions before submitting?
            </p>
          ) : null}
          {mode === 'final-confirm' ? (
            <p>After submission, your answers cannot be changed.</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end dark:border-slate-800">
          {mode === 'all-attempted' ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmSubmit}
                disabled={submitting}
                className="min-h-11 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-40"
              >
                {submitting ? 'Submitting…' : 'Submit Exam'}
              </button>
            </>
          ) : null}

          {mode === 'has-unanswered' ? (
            <>
              <button
                type="button"
                onClick={onSubmitAnyway}
                disabled={submitting}
                className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Submit Anyway
              </button>
              <button
                type="button"
                onClick={onReviewUnanswered}
                disabled={submitting}
                className="min-h-11 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-40"
              >
                Review Unanswered
              </button>
            </>
          ) : null}

          {mode === 'final-confirm' ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={onConfirmSubmit}
                disabled={submitting}
                className="min-h-11 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-40"
              >
                {submitting ? 'Submitting…' : 'Submit Exam'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
