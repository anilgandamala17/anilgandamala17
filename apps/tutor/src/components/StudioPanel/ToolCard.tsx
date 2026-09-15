import { ArrowRight } from 'lucide-react';
import type { ToolItem } from './types';
import { ToolBadge } from './ToolBadge';
import { CardGeneratingProgress, GENERATING_LABELS } from './GeneratingProgress';

interface ToolCardProps {
    tool: ToolItem;
    isActive?: boolean;
    isGenerating?: boolean;
    onClick: () => void;
    /** Compact = single-column narrow studio rail. */
    compact?: boolean;
    fullWidth?: boolean;
}

export function ToolCard({ tool, isActive, isGenerating, onClick, compact, fullWidth }: ToolCardProps) {
    const Icon = tool.icon;
    const progressHint =
        tool.countLabel && tool.countLabel !== '00' && !/^0+$/.test(tool.countLabel)
            ? tool.countLabel
            : undefined;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isGenerating}
            aria-busy={isGenerating || undefined}
            aria-label={isGenerating ? GENERATING_LABELS[tool.id] : `Open ${tool.title}`}
            className={`studio-tool-card group relative flex w-full items-center gap-3 rounded-xl border border-[var(--teaching-panel-divider)] text-left outline-none transition-all duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[var(--teaching-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--teaching-panel-bg)] motion-reduce:transition-none disabled:cursor-wait ${
                compact ? 'min-h-[72px] p-3' : 'min-h-[96px] p-4'
            } ${fullWidth ? 'col-span-full' : ''} ${
                isActive || isGenerating
                    ? 'shadow-sm'
                    : 'hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-black/40 motion-reduce:hover:translate-y-0'
            }`}
            style={{
                borderLeftWidth: 4,
                borderLeftColor: tool.accentColor,
                background: isActive || isGenerating
                    ? `color-mix(in srgb, ${tool.accentColor} 8%, var(--teaching-panel-bg))`
                    : 'var(--teaching-panel-bg)',
            }}
        >
            <div
                className={`flex shrink-0 items-center justify-center rounded-lg ${compact ? 'h-10 w-10' : 'h-12 w-12'} ${
                    isGenerating ? 'studio-generating-pulse motion-reduce:animate-none' : ''
                }`}
                style={{
                    backgroundColor: `color-mix(in srgb, ${tool.accentColor} 14%, var(--teaching-panel-bg))`,
                }}
            >
                <Icon
                    className={`shrink-0 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`}
                    style={{ color: tool.accentColor }}
                    aria-hidden
                    strokeWidth={2.25}
                />
            </div>

            <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        className={`truncate font-semibold leading-tight text-[var(--teaching-panel-text)] ${
                            compact ? 'text-[13px]' : 'text-[15px]'
                        }`}
                    >
                        {tool.title}
                    </span>
                    {tool.badge && !compact && !isGenerating && <ToolBadge badge={tool.badge} />}
                </div>
                {compact && tool.badge && !isGenerating && (
                    <div className="mt-1">
                        <ToolBadge badge={tool.badge} />
                    </div>
                )}
                {isGenerating ? (
                    <CardGeneratingProgress
                        accentColor={tool.accentColor}
                        label={GENERATING_LABELS[tool.id]}
                        compact={compact}
                    />
                ) : progressHint ? (
                    <p className="mt-0.5 truncate text-[11px] font-medium text-[var(--teaching-panel-text-muted)]">
                        {progressHint}
                    </p>
                ) : null}
            </div>

            {!isGenerating && (
                <ArrowRight
                    className={`shrink-0 text-[var(--teaching-panel-text)] opacity-40 transition-all duration-150 ease-out group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:translate-x-0.5 group-focus-visible:opacity-100 motion-reduce:transition-none ${
                        compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'
                    }`}
                    aria-hidden
                />
            )}
        </button>
    );
}
