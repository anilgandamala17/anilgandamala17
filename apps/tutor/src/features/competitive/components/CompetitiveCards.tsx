import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

interface PremiumSelectionCardProps {
    title: string;
    eyebrow?: string;
    description?: string;
    meta?: ReactNode;
    icon: ReactNode;
    accent: string;
    image?: string;
    index?: number;
    compact?: boolean;
    badge?: string;
    onClick: () => void;
}

export function PremiumSelectionCard({
    title,
    eyebrow,
    description,
    meta,
    icon,
    accent,
    image,
    index = 0,
    compact = false,
    badge,
    onClick,
}: PremiumSelectionCardProps) {
    const style = {
        '--card-accent': accent,
        '--card-accent-soft': `${accent}1a`,
    } as CSSProperties;

    return (
        <motion.button
            type="button"
            onClick={onClick}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                delay: Math.min(index * 0.045, 0.32),
                type: 'spring',
                stiffness: 190,
                damping: 22,
            }}
            className={`comp-premium-card group ${compact ? 'comp-premium-card--compact' : ''}`}
            style={style}
        >
            <span className="comp-premium-card__glow" aria-hidden />
            {image && (
                <span className="comp-premium-card__visual" aria-hidden>
                    <span
                        className="comp-premium-card__image"
                        style={{ backgroundImage: `url(${image})` }}
                    />
                    <span className="comp-premium-card__image-overlay" />
                </span>
            )}

            <span className="comp-premium-card__body">
                <span className="comp-premium-card__topline">
                    <span className="comp-premium-card__icon">{icon}</span>
                    {badge && <span className="comp-premium-card__badge">{badge}</span>}
                    <span className="comp-premium-card__arrow">
                        <ArrowUpRight className="h-4 w-4" />
                    </span>
                </span>

                <span className="comp-premium-card__copy">
                    {eyebrow && <span className="comp-premium-card__eyebrow">{eyebrow}</span>}
                    <span className="comp-premium-card__title">{title}</span>
                    {description && (
                        <span className="comp-premium-card__description">{description}</span>
                    )}
                </span>

                {meta && (
                    <span className="comp-premium-card__footer">
                        <span className="min-w-0">{meta}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                )}
            </span>
        </motion.button>
    );
}

interface PremiumMetricCardProps {
    label: string;
    value: string;
    icon: ReactNode;
    accent: string;
    detail?: string;
}

export function PremiumMetricCard({
    label,
    value,
    icon,
    accent,
    detail,
}: PremiumMetricCardProps) {
    return (
        <div
            className="comp-metric-card"
            style={{ '--metric-accent': accent } as CSSProperties}
        >
            <div className="comp-metric-card__top">
                <span className="comp-metric-card__icon">{icon}</span>
                <span className="comp-metric-card__signal" aria-hidden />
            </div>
            <div className="comp-metric-card__value">{value}</div>
            <div className="comp-metric-card__label">{label}</div>
            {detail && <div className="comp-metric-card__detail">{detail}</div>}
        </div>
    );
}
