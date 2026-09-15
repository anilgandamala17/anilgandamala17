import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Minimize2, Settings, Volume2, Square } from 'lucide-react';
import { AIRA_BRAND_MARK_SRC } from '../../../constants/brand';

export type FloatingTeachingToolbarProps = {
  visible: boolean;
  reduceAnimations: boolean;
  subjectName: string;
  topicName: string;
  currentStep: number;
  totalSteps: number;
  isInDoubtMode: boolean;
  showStopListening: boolean;
  showResumeListening: boolean;
  showStartListening: boolean;
  onRaiseDoubt: () => void;
  onPauseResume: () => void;
  onSettings: () => void;
  onMinimize: () => void;
  /** Video-only lessons hide Start / Stop / Resume Listening. */
  showListeningControls?: boolean;
};

const FloatingTeachingToolbar = forwardRef<HTMLDivElement, FloatingTeachingToolbarProps>(function FloatingTeachingToolbar({
  visible,
  reduceAnimations,
  subjectName,
  topicName,
  currentStep,
  totalSteps,
  isInDoubtMode,
  showStopListening,
  showResumeListening,
  showStartListening,
  onRaiseDoubt,
  onPauseResume,
  onSettings,
  onMinimize,
  showListeningControls = true,
}, ref) {
  const pauseLabel = showStopListening
    ? 'Pause'
    : showResumeListening
      ? 'Resume'
      : showStartListening
        ? 'Start'
        : 'Pause';

  const pauseDisabled = !showStopListening && !showResumeListening && !showStartListening;

  return (
    <motion.div
      ref={ref}
      className="floating-teaching-toolbar"
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : -12,
        pointerEvents: visible ? 'auto' : 'none',
      }}
      transition={{ duration: reduceAnimations ? 0 : 0.25, ease: 'easeOut' }}
      role="toolbar"
      aria-label="Teaching controls"
    >
      <div className="floating-teaching-toolbar__brand">
        <img
          src={AIRA_BRAND_MARK_SRC}
          alt=""
          className="floating-teaching-toolbar__logo"
          width={28}
          height={28}
          draggable={false}
          decoding="async"
        />
        <div className="floating-teaching-toolbar__meta min-w-0">
          <span className="floating-teaching-toolbar__subject truncate">{subjectName}</span>
          <span className="floating-teaching-toolbar__topic truncate">{topicName}</span>
        </div>
      </div>

      <div className="floating-teaching-toolbar__step" aria-live="polite">
        Step {currentStep + 1} / {totalSteps}
      </div>

      <div className="floating-teaching-toolbar__actions">
        <button
          type="button"
          className="floating-teaching-toolbar__btn floating-teaching-toolbar__btn--doubt touch-target"
          onClick={onRaiseDoubt}
          disabled={isInDoubtMode}
          aria-label="Raise Doubt"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Raise Doubt</span>
        </button>

        {showListeningControls && (
        <button
          type="button"
          className="floating-teaching-toolbar__btn floating-teaching-toolbar__btn--pause touch-target"
          onClick={onPauseResume}
          disabled={pauseDisabled}
          aria-label={pauseLabel}
        >
          {showStopListening ? (
            <Square className="w-4 h-4 shrink-0" />
          ) : (
            <Volume2 className="w-4 h-4 shrink-0" />
          )}
          <span className="hidden sm:inline">{pauseLabel}</span>
        </button>
        )}

        <button
          type="button"
          className="floating-teaching-toolbar__btn touch-target"
          onClick={onSettings}
          aria-label="Settings"
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Settings</span>
        </button>

        <button
          type="button"
          className="floating-teaching-toolbar__btn floating-teaching-toolbar__btn--minimize touch-target"
          onClick={onMinimize}
          aria-label="Exit full screen"
        >
          <Minimize2 className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Minimize</span>
        </button>
      </div>
    </motion.div>
  );
});

export default FloatingTeachingToolbar;
