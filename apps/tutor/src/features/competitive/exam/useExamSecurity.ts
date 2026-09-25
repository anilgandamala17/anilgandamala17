import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExamSecurityPolicy } from './examConfig';

export type ExamSecuritySnapshot = {
  isFullscreen: boolean;
  isExamActive: boolean;
  visibilityState: DocumentVisibilityState;
  windowFocused: boolean;
  violationCount: number;
  lastViolationAt: number | null;
  autoSubmitTriggered: boolean;
};

type UseExamSecurityOptions = {
  enabled: boolean;
  policy: ExamSecurityPolicy;
  onAutoSubmit: () => void;
  /** Suppress violations while confirmation dialogs are open */
  suppressViolations?: boolean;
};

const DEBOUNCE_MS = 800;
const SAME_EVENT_WINDOW_MS = 1500;

/**
 * Browser-realistic exam environment monitoring (Phase 5).
 * Debounced visibility / blur / fullscreenexit → warnings → auto-submit.
 */
export function useExamSecurity({
  enabled,
  policy,
  onAutoSubmit,
  suppressViolations = false,
}: UseExamSecurityOptions) {
  const [violationCount, setViolationCount] = useState(0);
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [needsFullscreenReturn, setNeedsFullscreenReturn] = useState(false);

  const lastEventAt = useRef(0);
  const debounceTimer = useRef<number | null>(null);
  const autoFired = useRef(false);
  const warningOpenRef = useRef(false);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  onAutoSubmitRef.current = onAutoSubmit;
  warningOpenRef.current = warningOpen;

  const requestFullscreen = useCallback(async () => {
    const el = document.documentElement as HTMLElement & {
      requestFullscreen?: () => Promise<void>;
      webkitRequestFullscreen?: () => void;
    };
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      setNeedsFullscreenReturn(false);
    } catch {
      setNeedsFullscreenReturn(true);
    }
  }, []);

  const registerViolation = useCallback(
    (reason: string) => {
      if (!enabled || !policy.tabMonitoringEnabled || suppressViolations || autoFired.current) return;
      // Coalesce while the warning dialog is already open (blur/focus from the dialog itself).
      if (warningOpenRef.current) return;
      const now = Date.now();
      if (now - lastEventAt.current < SAME_EVENT_WINDOW_MS) return;
      lastEventAt.current = now;

      setViolationCount((prev) => {
        const next = prev + 1;
        if (next >= policy.maxSecurityViolations) {
          autoFired.current = true;
          setAutoSubmitted(true);
          setWarningOpen(false);
          setWarningMessage(
            'The examination was automatically submitted because the examination environment was exited repeatedly. Your recorded answers have been submitted.',
          );
          onAutoSubmitRef.current();
          return next;
        }
        setWarningMessage(
          `You have left the examination environment. Please return to the examination.\n\nWarning ${next} of ${policy.maxSecurityViolations}`,
        );
        setWarningOpen(true);
        return next;
      });
      void reason;
    },
    [enabled, policy.maxSecurityViolations, policy.tabMonitoringEnabled, suppressViolations],
  );

  useEffect(() => {
    if (!enabled) return;

    const schedule = (reason: string, isFullscreenExit = false) => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
      debounceTimer.current = window.setTimeout(() => {
        if (!enabled || autoFired.current) return;
        if (document.visibilityState === 'visible' && document.hasFocus() && document.fullscreenElement) {
          // Stabilized back — ignore transient flicker
          if (!isFullscreenExit) return;
        }
        if (isFullscreenExit || !document.fullscreenElement) {
          setNeedsFullscreenReturn(true);
        }
        registerViolation(reason);
      }, DEBOUNCE_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') schedule('visibility');
    };
    const onBlur = () => schedule('blur');
    const onFs = () => {
      if (!document.fullscreenElement) schedule('fullscreen-exit', true);
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFs);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFs);
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [enabled, registerViolation]);

  const dismissWarning = useCallback(() => {
    setWarningOpen(false);
  }, []);

  return {
    violationCount,
    warningOpen,
    warningMessage,
    autoSubmitted,
    needsFullscreenReturn,
    requestFullscreen,
    dismissWarning,
    setNeedsFullscreenReturn,
    snapshot: {
      isFullscreen: !!document.fullscreenElement,
      isExamActive: enabled,
      visibilityState: document.visibilityState,
      windowFocused: typeof document.hasFocus === 'function' ? document.hasFocus() : true,
      violationCount,
      lastViolationAt: lastEventAt.current || null,
      autoSubmitTriggered: autoSubmitted,
    } satisfies ExamSecuritySnapshot,
  };
}
