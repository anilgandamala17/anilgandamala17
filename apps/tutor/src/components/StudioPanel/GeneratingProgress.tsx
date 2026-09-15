import { useEffect, useState } from 'react';
import type { StudioToolId } from './types';

export const GENERATING_LABELS: Record<StudioToolId, string> = {
    notes: 'Generating notes…',
    map: 'Generating mind map…',
    flashcards: 'Generating flashcards…',
    summary: 'Generating summary…',
    quiz: 'Crafting your quiz…',
};

/** Eases toward 90% while work is in flight; parent unmounts this when generation finishes. */
export function useCappedGeneratingProgress(active: boolean) {
    const [pct, setPct] = useState(10);

    useEffect(() => {
        if (!active) {
            setPct(10);
            return;
        }
        setPct(12);
        const started = Date.now();
        const id = window.setInterval(() => {
            const t = (Date.now() - started) / 1000;
            setPct(Math.min(90, 12 + 78 * (1 - Math.exp(-t / 4.2))));
        }, 120);
        return () => window.clearInterval(id);
    }, [active]);

    return pct;
}

export function CardGeneratingProgress({
    accentColor,
    label,
    compact,
}: {
    accentColor: string;
    label: string;
    compact?: boolean;
}) {
    const pct = useCappedGeneratingProgress(true);
    return (
        <div className={`w-full min-w-0 ${compact ? 'mt-1.5' : 'mt-2'}`} aria-live="polite">
            <div className="mb-1 flex items-center justify-between gap-2">
                <p className="truncate text-[11px] font-semibold text-[var(--teaching-panel-text-muted)]">
                    {label}
                </p>
                <span className="shrink-0 tabular-nums text-[10px] font-semibold text-[var(--teaching-panel-text-muted)]">
                    {Math.round(pct)}%
                </span>
            </div>
            <div
                className="h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pct)}
                aria-label={label}
            >
                <div
                    className="studio-progress-fill h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: accentColor }}
                />
            </div>
        </div>
    );
}
