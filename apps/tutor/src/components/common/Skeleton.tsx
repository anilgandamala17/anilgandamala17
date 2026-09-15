import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

export default function Skeleton({
    className = '',
    variant = 'rectangular',
    width,
    height
}: SkeletonProps) {
    const baseClasses = 'bg-gray-200 dark:bg-slate-700 animate-pulse';

    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const style: React.CSSProperties = {
        width: width || '100%',
        height: height || (variant === 'text' ? '1em' : '100%'),
    };

    return (
        <motion.div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
        />
    );
}

// Card skeleton for dashboard/profile
export function CardSkeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 shadow-sm ${className}`}>
            <Skeleton variant="circular" width={40} height={40} className="mb-3" />
            <Skeleton variant="text" width="60%" height={24} className="mb-2" />
            <Skeleton variant="text" width="40%" height={16} />
        </div>
    );
}

// Topic card skeleton
export function TopicCardSkeleton() {
    return (
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
                <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl" />
                <div className="flex-1">
                    <Skeleton variant="text" width="70%" height={20} className="mb-2" />
                    <Skeleton variant="text" width="50%" height={16} />
                </div>
            </div>
            <Skeleton variant="rectangular" width="100%" height={6} className="rounded-full" />
        </div>
    );
}

// Profile header skeleton
export function ProfileHeaderSkeleton() {
    return (
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-6">
                <Skeleton variant="circular" width={96} height={96} />
                <div className="flex-1">
                    <Skeleton variant="text" width="40%" height={28} className="mb-2" />
                    <Skeleton variant="text" width="30%" height={20} className="mb-4" />
                    <div className="flex gap-4">
                        <Skeleton variant="text" width={100} height={16} />
                        <Skeleton variant="text" width={80} height={16} />
                        <Skeleton variant="text" width={120} height={16} />
                    </div>
                </div>
            </div>
        </div>
    );
}
