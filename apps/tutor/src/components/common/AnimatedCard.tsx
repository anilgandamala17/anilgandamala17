import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode, forwardRef, ComponentPropsWithoutRef } from 'react';
import { transitions } from '../../utils/animations';
import { useSettingsStore } from '../../stores/settingsStore';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: ReactNode;
    variant?: 'default' | 'hover-lift' | 'hover-scale' | 'interactive';
    delay?: number;
    className?: string;
}

const variantConfig = {
    default: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        whileHover: {},
        whileTap: {}
    },
    'hover-lift': {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        whileHover: { y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
        whileTap: { scale: 0.98 }
    },
    'hover-scale': {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 }
    },
    interactive: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        whileHover: { y: -4, scale: 1.02 },
        whileTap: { scale: 0.98 }
    }
};

const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(({
    children,
    variant = 'default',
    delay = 0,
    className = '',
    ...props
}, ref) => {
    const reduceAnimations = useSettingsStore((state) => state.settings.accessibility.reduceAnimations);

    const config = variantConfig[variant];

    if (reduceAnimations) {
        return (
            <div ref={ref} className={className} {...(props as ComponentPropsWithoutRef<'div'>)}>
                {children}
            </div>
        );
    }

    return (
        <motion.div
            ref={ref}
            initial={config.initial}
            animate={config.animate}
            whileHover={config.whileHover}
            whileTap={config.whileTap}
            transition={{ ...transitions.default, delay }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
});

AnimatedCard.displayName = 'AnimatedCard';

export default AnimatedCard;

// Pre-configured variants for common use cases
export function HoverLiftCard({ children, className = '', delay = 0, ...props }: Omit<AnimatedCardProps, 'variant'>) {
    return (
        <AnimatedCard variant="hover-lift" delay={delay} className={className} {...props}>
            {children}
        </AnimatedCard>
    );
}

export function InteractiveCard({ children, className = '', delay = 0, ...props }: Omit<AnimatedCardProps, 'variant'>) {
    return (
        <AnimatedCard variant="interactive" delay={delay} className={className} {...props}>
            {children}
        </AnimatedCard>
    );
}
