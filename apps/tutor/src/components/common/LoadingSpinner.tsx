import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    /** Use brand gradient tile (matches FullPageLoader) */
    variant?: 'default' | 'brand';
}

const sizeMap = {
    sm: { tile: 'h-7 w-7', arc: 'h-4 w-4', radius: 'rounded-lg' },
    md: { tile: 'h-10 w-10', arc: 'h-5 w-5', radius: 'rounded-xl' },
    lg: { tile: 'h-14 w-14', arc: 'h-7 w-7', radius: 'rounded-2xl' },
};

export default function LoadingSpinner({
    size = 'md',
    className = '',
    variant = 'default',
}: LoadingSpinnerProps) {
    const s = sizeMap[size];

    if (variant === 'brand') {
        return (
            <div className={`inline-flex items-center justify-center ${className}`} role="status" aria-label="Loading">
                <div
                    className={`relative flex ${s.tile} items-center justify-center ${s.radius} shadow-md`}
                    style={{
                        transform: 'rotate(-8deg)',
                        background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #7c3aed 100%)',
                    }}
                >
                    <motion.svg
                        className={`${s.arc} text-white`}
                        viewBox="0 0 40 40"
                        fill="none"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                        aria-hidden
                    >
                        <circle
                            cx="20"
                            cy="20"
                            r="14"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray="52 36"
                        />
                    </motion.svg>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className={`inline-block ${className}`}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            role="status"
            aria-label="Loading"
        >
            <svg className={`${s.arc} text-violet-500`} viewBox="0 0 40 40" fill="none" aria-hidden>
                <circle
                    cx="20"
                    cy="20"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="52 36"
                    className="opacity-90"
                />
            </svg>
        </motion.div>
    );
}
