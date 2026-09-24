import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import type { ContentStatus } from '@/types/contentPipeline';

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

    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center px-6 safe-top safe-bottom safe-x min-h-[100dvh] overflow-hidden"
            style={{
                background: 'linear-gradient(165deg, #faf9fc 0%, #f3f0f8 42%, #ece8f4 100%)',
            }}
            role="status"
            aria-live="polite"
        >
            <div
                className="pointer-events-none absolute top-[15%] left-[20%] h-64 w-64 rounded-full opacity-35 blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)' }}
            />
            <div
                className="pointer-events-none absolute bottom-[18%] right-[15%] h-56 w-56 rounded-full opacity-30 blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, transparent 70%)' }}
            />

            <motion.div
                className="relative z-10 flex max-w-md flex-col items-center text-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
                <div
                    className="mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.2rem] shadow-lg"
                    style={{
                        transform: 'rotate(-8deg)',
                        background: isPreparing
                            ? 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #7c3aed 100%)'
                            : 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)',
                    }}
                >
                    {isPreparing ? (
                        <Clock className="h-8 w-8 text-white" strokeWidth={2} />
                    ) : (
                        <AlertCircle className="h-8 w-8 text-white" strokeWidth={2} />
                    )}
                </div>

                <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">
                    {isPreparing ? 'Lesson is being prepared' : 'Lesson could not be loaded'}
                </h1>

                <p className="mt-2 text-base font-medium text-slate-700">{topicName}</p>

                {isPreparing && (
                    <span className="mt-3 inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
                        {statusLabel}
                    </span>
                )}

                <p className="mt-4 text-sm leading-relaxed text-slate-500">
                    {message
                        ?? (isPreparing
                            ? 'Your lesson is being generated in the background. This usually takes a few minutes. You can check again or return to the curriculum.'
                            : 'Content generation failed for this topic. Please try again later or pick another topic from the curriculum.')}
                </p>

                <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Curriculum
                    </button>
                    <button
                        type="button"
                        onClick={onRetry}
                        disabled={isRetrying}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}
                    >
                        <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Checking…' : 'Check again'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
