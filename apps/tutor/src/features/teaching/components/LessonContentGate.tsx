import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import type { ContentStatus } from '@/types/contentPipeline';
import ErrorState from '@/components/common/ErrorState';

export type LessonContentGateVariant = 'preparing' | 'failed';

export interface LessonContentGateProps {
    variant: LessonContentGateVariant;
    topicName: string;
    status?: ContentStatus;
    message?: string;
    onRetry: () => void;
    onBack: () => void;
    isRetrying?: boolean;
}

function formatStatusLabel(status?: ContentStatus): string {
    if (!status) return 'pending';
    return status.replace(/_/g, ' ').toLowerCase();
}

export default function LessonContentGate({
    variant,
    topicName,
    status,
    message,
    onRetry,
    onBack,
    isRetrying = false,
}: LessonContentGateProps) {
    const isPreparing = variant === 'preparing';
    const statusLabel = formatStatusLabel(status);

    if (!isPreparing) {
        return (
            <div
                className="fixed inset-0 flex flex-col items-center justify-center px-6 safe-top safe-bottom safe-x min-h-[100dvh]"
                style={{ background: 'var(--dash-bg, #f1f5f9)' }}
            >
                <div className="w-full max-w-md">
                    <ErrorState
                        title="Lesson could not be loaded"
                        description={
                            message
                            ?? `Content for “${topicName}” failed to load. Try again or return to the curriculum.`
                        }
                        retryLabel={isRetrying ? 'Checking…' : 'Try again'}
                        onRetry={isRetrying ? undefined : onRetry}
                        icon={<AlertCircle className="h-8 w-8" />}
                    />
                    <button
                        type="button"
                        onClick={onBack}
                        className="mt-4 mx-auto flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--dash-radius-sm)] border px-5 text-sm font-semibold"
                        style={{
                            borderColor: 'var(--dash-border)',
                            color: 'var(--dash-text-2)',
                            background: 'var(--dash-surface-0)',
                        }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Curriculum
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center px-6 safe-top safe-bottom safe-x min-h-[100dvh] overflow-hidden"
            style={{ background: 'var(--dash-bg, #f1f5f9)' }}
            role="status"
            aria-live="polite"
        >
            <div
                className="pointer-events-none absolute top-[-10%] left-[-8%] h-[50%] w-[50%] opacity-70"
                style={{
                    background: 'radial-gradient(circle, var(--dash-brand-glow, rgba(29,78,216,0.14)) 0%, transparent 68%)',
                }}
                aria-hidden
            />

            <motion.div
                className="relative z-10 flex max-w-md flex-col items-center text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                <div
                    className="mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1rem] shadow-md"
                    style={{ background: 'var(--dash-brand, #1d4ed8)' }}
                >
                    <Clock className="h-8 w-8 text-white" strokeWidth={2} aria-hidden />
                </div>

                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl" style={{ color: 'var(--dash-text)' }}>
                    Lesson is being prepared
                </h1>

                <p className="mt-2 text-base font-semibold" style={{ color: 'var(--dash-text-2)' }}>
                    {topicName}
                </p>

                <span
                    className="mt-3 inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide"
                    style={{
                        borderColor: 'var(--dash-border)',
                        background: 'var(--dash-surface-1)',
                        color: 'var(--dash-brand)',
                    }}
                >
                    {statusLabel}
                </span>

                <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--dash-text-muted, #64748b)' }}>
                    {message
                        ?? 'Your lesson is being generated in the background. This usually takes a few minutes. You can check again or return to the curriculum.'}
                </p>

                <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--dash-radius-sm)] border px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
                        style={{
                            borderColor: 'var(--dash-border)',
                            background: 'var(--dash-surface-0)',
                            color: 'var(--dash-text)',
                        }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Curriculum
                    </button>
                    <button
                        type="button"
                        onClick={onRetry}
                        disabled={isRetrying}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--dash-radius-sm)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity disabled:opacity-60"
                        style={{ background: 'var(--dash-brand, #1d4ed8)' }}
                    >
                        <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Checking…' : 'Check again'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
