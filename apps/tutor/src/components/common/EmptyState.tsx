import { ReactNode } from 'react';
import AccessibleButton from './AccessibleButton';

export interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: ReactNode;
    className?: string;
}

/**
 * Shared empty-state pattern: what is empty, why, and what to do next.
 */
export default function EmptyState({
    title,
    description,
    actionLabel,
    onAction,
    icon,
    className = '',
}: EmptyStateProps) {
    return (
        <div className={`aira-empty ${className}`} role="status">
            {icon ? <div className="text-[var(--color-text-muted)]" aria-hidden>{icon}</div> : null}
            <h3 className="aira-empty__title">{title}</h3>
            <p className="aira-empty__body">{description}</p>
            {actionLabel && onAction ? (
                <div className="aira-empty__actions">
                    <AccessibleButton variant="primary" size="md" onClick={onAction}>
                        {actionLabel}
                    </AccessibleButton>
                </div>
            ) : null}
        </div>
    );
}
