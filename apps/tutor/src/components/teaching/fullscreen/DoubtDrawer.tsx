import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, X } from 'lucide-react';

export type DoubtDrawerProps = {
  open: boolean;
  reduceAnimations: boolean;
  isMobile: boolean;
  onResumeLesson: () => void;
  onClose?: () => void;
  children: React.ReactNode;
};

/**
 * Slide-over doubt chat for immersive fullscreen mode.
 * Preserves fullscreen board underneath (dimmed).
 * Must be portaled into `.immersive-teaching-overlay` for Fullscreen API.
 */
export default function DoubtDrawer({
  open,
  reduceAnimations,
  isMobile,
  onResumeLesson,
  onClose,
  children,
}: DoubtDrawerProps) {
  const dismiss = onClose ?? onResumeLesson;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="doubt-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceAnimations ? 0 : 0.25 }}
            aria-hidden
            onClick={dismiss}
          />
          <motion.aside
            className={`doubt-drawer ${isMobile ? 'doubt-drawer--mobile' : ''}`}
            role="dialog"
            aria-label="Ask your doubt"
            initial={reduceAnimations ? false : { x: isMobile ? 0 : '100%', y: isMobile ? '100%' : 0 }}
            animate={{ x: 0, y: 0 }}
            exit={reduceAnimations ? undefined : { x: isMobile ? 0 : '100%', y: isMobile ? '100%' : 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320, duration: reduceAnimations ? 0 : undefined }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="doubt-drawer__header">
              <div>
                <h3 className="doubt-drawer__title">Ask AIra</h3>
                <p className="doubt-drawer__subtitle">Lesson paused — your place is saved</p>
              </div>
              <div className="doubt-drawer__header-actions">
                <button
                  type="button"
                  className="doubt-drawer__resume touch-target"
                  onClick={onResumeLesson}
                  aria-label="Resume Lesson"
                >
                  <PlayCircle className="w-4 h-4 shrink-0" />
                  Resume Lesson
                </button>
                {onClose && (
                  <button
                    type="button"
                    className="doubt-drawer__close touch-target"
                    onClick={onClose}
                    aria-label="Close doubt panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="doubt-drawer__body flex flex-col min-h-0 flex-1">
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
