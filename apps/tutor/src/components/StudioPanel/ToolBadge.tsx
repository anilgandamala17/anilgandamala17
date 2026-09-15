import type { StudioToolBadge } from './types';

const BADGE_STYLES: Record<StudioToolBadge, string> = {
    Active:
        'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
    New: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25 studio-badge-pulse',
    Recommended:
        'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25 studio-badge-pulse',
};

export function ToolBadge({ badge }: { badge: StudioToolBadge }) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_STYLES[badge]}`}
        >
            {badge}
        </span>
    );
}
