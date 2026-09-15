import type { LucideIcon } from 'lucide-react';

export type StudioToolId = 'notes' | 'map' | 'flashcards' | 'quiz' | 'summary';

export type StudioToolBadge = 'Active' | 'New' | 'Recommended';

export interface ToolItem {
    id: StudioToolId;
    title: string;
    icon: LucideIcon;
    accentColor: string;
    badge?: StudioToolBadge;
    /** Optional count label shown on cards (e.g. "03"). */
    countLabel?: string;
    description?: string;
}

export interface FeaturedToolItem extends ToolItem {
    /** Real answered count. Progress bar renders only when progressTotal > 0. */
    progressCurrent?: number;
    progressTotal?: number;
    /** Shown instead of the bar when there is no live progress yet. */
    statusLabel?: string;
    ctaLabel?: string;
}

export interface StudioPanelProps {
    tools: ToolItem[];
    featuredTool?: FeaturedToolItem;
    activeToolId?: StudioToolId;
    onToolClick: (toolId: StudioToolId) => void;
    onFeaturedCta?: () => void;
    generatingToolId?: StudioToolId | null;
    /** True when Studio is maximized / wide enough for a 2-column grid. */
    wide?: boolean;
    className?: string;
}
