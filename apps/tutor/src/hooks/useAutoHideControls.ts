import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_IDLE_MS = 3500;

export type UseAutoHideControlsOptions = {
  /** Milliseconds of inactivity before hiding controls */
  idleMs?: number;
  /** When true, controls stay visible (e.g. settings open, doubt drawer open) */
  pinned?: boolean;
  /** Only active when immersive mode is on */
  enabled?: boolean;
};

/**
 * Auto-hide floating toolbar in immersive teaching mode.
 * Shows on mousemove, touch, board click; hides after idle period.
 */
export function useAutoHideControls(options: UseAutoHideControlsOptions = {}) {
  const { idleMs = DEFAULT_IDLE_MS, pinned = false, enabled = true } = options;
  const [controlsVisible, setControlsVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearTimer();
    if (!enabled || pinned) return;
    timerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, idleMs);
  }, [clearTimer, enabled, idleMs, pinned]);

  const showControls = useCallback(() => {
    if (!enabled) return;
    setControlsVisible(true);
    scheduleHide();
  }, [enabled, scheduleHide]);

  useEffect(() => {
    if (!enabled) {
      setControlsVisible(true);
      clearTimer();
      return;
    }
    if (pinned) {
      setControlsVisible(true);
      clearTimer();
      return;
    }
    scheduleHide();
    return clearTimer;
  }, [enabled, pinned, scheduleHide, clearTimer]);

  useEffect(() => {
    if (!enabled) return;

    const onActivity = () => showControls();

    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('touchstart', onActivity);
    };
  }, [enabled, showControls]);

  return { controlsVisible: enabled ? controlsVisible : false, showControls, setControlsVisible };
}
