import { ReactNode } from 'react';
import AccessibleButton from './AccessibleButton';

export interface ErrorStateProps {
    title?: string;
    description: string;
    retryLabel?: string;
    onRetry?: () => void;
    icon?: ReactNode;
    className?: string;
}

/**
 * Shared user-facing error pattern — plain language + recovery action.
 */
export default function ErrorState({
    title = "Something went wrong",
    description,
    retryLabel = 'Try again',
    onRetry,
    icon,
    className = '',
}: ErrorStateProps) {
    return (
        <div className={`aira-error-state ${className}`} role="alert">
            {icon ? <div className="text-[var(--color-error)]" aria-hidden>{icon}</div> : null}
            <h3 className="aira-error-state__title">{title}</h3>
            <p className="aira-error-state__body">{description}</p>
            {onRetry ? (
                <div className="aira-error-state__actions">
                    <AccessibleButton variant="secondary" size="md" onClick={onRetry}>
                        {retryLabel}
                    </AccessibleButton>
                </div>
            ) : null}
        </div>
    );
}
