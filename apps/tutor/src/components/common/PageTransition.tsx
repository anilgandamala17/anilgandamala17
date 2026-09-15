import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { transitions, pageVariants as defaultPageVariants, fadeVariants, slideUpVariants } from '../../utils/animations';

type TransitionType = 'default' | 'fade' | 'slide' | 'none';

const variantMap = {
    default: defaultPageVariants,
    fade: fadeVariants,
    slide: slideUpVariants,
    none: {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 }
    }
};

const reducedVariants = {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 }
};

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
    type?: TransitionType;
    delay?: number;
}

export default function PageTransition({
    children,
    className = "",
    type = 'default',
    delay = 0
}: PageTransitionProps) {
    const reduceAnimations = useSettingsStore((state) => state.settings.accessibility.reduceAnimations);

    const variants = reduceAnimations ? reducedVariants : variantMap[type];
    const transition = reduceAnimations
        ? { duration: 0 }
        : { ...transitions.smooth, delay };

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={transition}
            className={`w-full ${className}`}
        >
            {children}
        </motion.div>
    );
}

// Animated container for staggered children
export function StaggerContainer({
    children,
    className = "",
    staggerDelay = 0.05
}: {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
}) {
    const reduceAnimations = useSettingsStore((state) => state.settings.accessibility.reduceAnimations);

    return (
        <motion.div
            initial="initial"
            animate="animate"
            className={className}
            variants={{
                initial: {},
                animate: {
                    transition: {
                        staggerChildren: reduceAnimations ? 0 : staggerDelay,
                        delayChildren: reduceAnimations ? 0 : 0.1
                    }
                }
            }}
        >
            {children}
        </motion.div>
    );
}

// Animated item for use within StaggerContainer
export function StaggerItem({
    children,
    className = ""
}: {
    children: ReactNode;
    className?: string;
}) {
    const reduceAnimations = useSettingsStore((state) => state.settings.accessibility.reduceAnimations);

    return (
        <motion.div
            className={className}
            variants={reduceAnimations ? reducedVariants : {
                initial: { opacity: 0, y: 15 },
                animate: {
                    opacity: 1,
                    y: 0,
                    transition: transitions.default
                }
            }}
        >
            {children}
        </motion.div>
    );
}

