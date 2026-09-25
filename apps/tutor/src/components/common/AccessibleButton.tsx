import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';

interface AccessibleButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionProps> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    fullWidth?: boolean;
    motionProps?: MotionProps;
    children?: ReactNode;
}

/**
 * Accessible button — AIra brand tokens (primary blue, not purple/pink).
 */
const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            fullWidth = false,
            disabled,
            className = '',
            motionProps,
            type = 'button',
            ...props
        },
        ref
    ) => {
        const baseClasses =
            'inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-sm)] transition-colors focus:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed';

        const variantClasses = {
            primary:
                'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]',
            secondary:
                'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] hover:border-[var(--color-border-strong)]',
            danger: 'bg-[var(--color-error)] text-white hover:brightness-95 focus-visible:shadow-[0_0_0_2px_var(--color-surface),0_0_0_4px_var(--color-error)]',
            ghost: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]',
            link: 'text-[var(--color-primary)] underline-offset-4 hover:underline min-h-0 px-0 py-0',
        };

        const sizeClasses = {
            sm: 'min-h-[var(--control-h-sm)] px-3 text-sm',
            md: 'min-h-[var(--control-h-md)] px-4 text-sm',
            lg: 'min-h-[var(--control-h-lg)] px-6 text-base',
            icon: 'size-[var(--control-h-md)] p-0',
        };

        const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

        const button = (
            <button
                ref={ref}
                type={type}
                className={classes}
                disabled={disabled || isLoading}
                aria-busy={isLoading}
                aria-disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg
                            className="animate-spin -ml-0.5 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Loading…</span>
                    </>
                ) : (
                    children
                )}
            </button>
        );

        if (motionProps) {
            return <motion.div {...motionProps}>{button}</motion.div>;
        }

        return button;
    }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;
