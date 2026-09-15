/**
 * Centralized Animation Configuration
 * 
 * This file provides consistent animation presets, variants, and utilities
 * for use throughout the application with Framer Motion.
 */

import type { Variants, Transition } from 'framer-motion';

// ============================================
// TRANSITION PRESETS
// ============================================

export const transitions = {
    // Fast, snappy transitions for micro-interactions
    fast: {
        duration: 0.15,
        ease: [0.25, 0.1, 0.25, 1]
    } as Transition,

    // Standard transitions for most UI elements
    default: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
    } as Transition,

    // Smooth transitions for larger elements
    smooth: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
    } as Transition,

    // Slow, elegant transitions for modals/overlays
    elegant: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
    } as Transition,

    // Spring physics for bouncy effects
    spring: {
        type: 'spring',
        stiffness: 300,
        damping: 25
    } as Transition,

    // Gentle spring for subtle bounce
    gentleSpring: {
        type: 'spring',
        stiffness: 200,
        damping: 20
    } as Transition,

    // Bouncy spring for playful interactions
    bouncy: {
        type: 'spring',
        stiffness: 400,
        damping: 15
    } as Transition
};

// ============================================
// ANIMATION VARIANTS
// ============================================

// Fade animations
export const fadeVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
};

// Fade with scale
export const fadeScaleVariants: Variants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
};

// Slide from bottom
export const slideUpVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

// Slide from right
export const slideRightVariants: Variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
};

// Slide from left
export const slideLeftVariants: Variants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
};

// Pop in animation
export const popVariants: Variants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: transitions.spring
    },
    exit: { opacity: 0, scale: 0.8 }
};

// Page transition variants
export const pageVariants: Variants = {
    initial: {
        opacity: 1,
        y: 0
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: transitions.smooth
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: transitions.fast
    }
};

// Stagger container for lists
export const staggerContainerVariants: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
};

// Stagger item
export const staggerItemVariants: Variants = {
    initial: { opacity: 0, y: 15 },
    animate: {
        opacity: 1,
        y: 0,
        transition: transitions.default
    }
};

// Card hover effect
export const cardHoverVariants: Variants = {
    rest: {
        scale: 1,
        y: 0,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    hover: {
        scale: 1.02,
        y: -4,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        transition: transitions.spring
    },
    tap: {
        scale: 0.98,
        transition: transitions.fast
    }
};

// Button hover effect
export const buttonHoverVariants: Variants = {
    rest: { scale: 1 },
    hover: {
        scale: 1.05,
        transition: transitions.spring
    },
    tap: {
        scale: 0.95,
        transition: transitions.fast
    }
};

// Icon pulse animation
export const pulseVariants: Variants = {
    initial: { scale: 1 },
    animate: {
        scale: [1, 1.05, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    }
};

// Shimmer effect for loading states
export const shimmerVariants: Variants = {
    initial: { x: '-100%' },
    animate: {
        x: '100%',
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
        }
    }
};

// Modal/Overlay variants
export const overlayVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: transitions.fast
    },
    exit: {
        opacity: 0,
        transition: transitions.fast
    }
};

export const modalVariants: Variants = {
    initial: {
        opacity: 0,
        scale: 0.9,
        y: 20
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: transitions.spring
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 20,
        transition: transitions.default
    }
};

// Accordion/Collapse variants
export const collapseVariants: Variants = {
    initial: { height: 0, opacity: 0 },
    animate: {
        height: 'auto',
        opacity: 1,
        transition: transitions.smooth
    },
    exit: {
        height: 0,
        opacity: 0,
        transition: transitions.default
    }
};

// Drawer variants
export const drawerVariants = {
    left: {
        initial: { x: '-100%' },
        animate: { x: 0, transition: transitions.smooth },
        exit: { x: '-100%', transition: transitions.default }
    },
    right: {
        initial: { x: '100%' },
        animate: { x: 0, transition: transitions.smooth },
        exit: { x: '100%', transition: transitions.default }
    },
    bottom: {
        initial: { y: '100%' },
        animate: { y: 0, transition: transitions.smooth },
        exit: { y: '100%', transition: transitions.default }
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Creates a staggered delay for list items
 */
export const getStaggerDelay = (index: number, baseDelay = 0.05): number => {
    return index * baseDelay;
};

/**
 * Creates custom transition with delay
 */
export const withDelay = (transition: Transition, delay: number): Transition => {
    return { ...transition, delay };
};

/**
 * Animation props for hover interactions
 */
export const hoverProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: transitions.spring
};

/**
 * Animation props for button interactions
 */
export const buttonAnimationProps = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: transitions.spring
};

/**
 * Animation props for card interactions
 */
export const cardAnimationProps = {
    whileHover: { y: -4, scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: transitions.spring
};

/**
 * Animation props for subtle hover
 */
export const subtleHoverProps = {
    whileHover: { x: 4 },
    transition: transitions.fast
};

// ============================================
// CSS ANIMATION KEYFRAMES (for index.css)
// ============================================

export const cssAnimations = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeInScale {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}
`;
