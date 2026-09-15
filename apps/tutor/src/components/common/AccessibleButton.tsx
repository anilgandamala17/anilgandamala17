import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';

interface AccessibleButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionProps> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    fullWidth?: boolean;
    motionProps?: MotionProps;
    children?: ReactNode;
}

/**
 * Accessible button component with proper ARIA attributes and keyboard support
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
            ...props
        },
        ref
    ) => {
        const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
        
        const variantClasses = {
            primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 focus:ring-purple-500',
            secondary: 'bg-white dark:bg-slate-900/60 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 focus:ring-gray-500',
            danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
            ghost: 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 focus:ring-gray-500',
        };

        const sizeClasses = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg',
        };

        const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

        const button = (
            <button
                ref={ref}
                className={classes}
                disabled={disabled || isLoading}
                aria-busy={isLoading}
                aria-disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                        Loading...
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
