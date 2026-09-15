import { useCallback, useEffect, useRef, useState } from 'react';

export type LayoutSnapshot = {
  chatPanelVisible: boolean;
  rightPanelVisible: boolean;
  centerPanelVisible: boolean;
  mobilePanel: 'home' | 'teach' | 'studio';
};

export type UseImmersiveTeachingOptions = {
  overlayRef: React.RefObject<HTMLElement | null>;
  onExit?: () => void;
  /** When true, Escape closes settings first and must not exit immersive. */
  blockEscapeExit?: boolean;
};

const BODY_CLASS = 'immersive-teaching-active';

/**
 * Manages immersive fullscreen teaching presentation layer.
 * Uses CSS fixed overlay as primary; optionally requests browser fullscreen.
 */
export function useImmersiveTeaching({ overlayRef, onExit, blockEscapeExit = false }: UseImmersiveTeachingOptions) {
  const [isImmersiveFullscreen, setIsImmersiveFullscreen] = useState(false);
  const snapshotRef = useRef<LayoutSnapshot | null>(null);

  const enterImmersive = useCallback((snapshot: LayoutSnapshot) => {
    snapshotRef.current = snapshot;
    setIsImmersiveFullscreen(true);
    document.body.classList.add(BODY_CLASS);

    const el = overlayRef.current;
    if (el && !document.fullscreenElement) {
      void el.requestFullscreen?.().catch(() => {
        /* CSS overlay fallback — no toast */
      });
    }
  }, [overlayRef]);

  const exitImmersive = useCallback(() => {
    setIsImmersiveFullscreen(false);
    document.body.classList.remove(BODY_CLASS);

    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => {
        /* ignore */
      });
    }
    onExit?.();
  }, [onExit]);

  const toggleImmersive = useCallback((snapshot: LayoutSnapshot) => {
    if (isImmersiveFullscreen) {
      exitImmersive();
    } else {
      enterImmersive(snapshot);
    }
  }, [enterImmersive, exitImmersive, isImmersiveFullscreen]);

  const getSnapshot = useCallback(() => snapshotRef.current, []);
  const lastFullscreenElRef = useRef<Element | null>(null);

  // Sync state when user presses ESC or exits browser fullscreen.
  // Lesson-video native fullscreen must not tear down immersive teaching chrome
  // (Raise Doubt / listening stay mounted).
  useEffect(() => {
    const onFullscreenChange = () => {
      const fs = document.fullscreenElement;
      const prev = lastFullscreenElRef.current;
      lastFullscreenElRef.current = fs;

      if (fs instanceof HTMLVideoElement) {
        return;
      }

      if (!fs && prev instanceof HTMLVideoElement && isImmersiveFullscreen) {
        const el = overlayRef.current;
        if (el && el.requestFullscreen) {
          void el.requestFullscreen().catch(() => {
            /* CSS overlay remains */
          });
        }
        return;
      }

      if (!fs && isImmersiveFullscreen) {
        setIsImmersiveFullscreen(false);
        document.body.classList.remove(BODY_CLASS);
        onExit?.();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !isImmersiveFullscreen) return;
      if (blockEscapeExit) return;
      if (document.fullscreenElement instanceof HTMLVideoElement) return;
      exitImmersive();
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [blockEscapeExit, exitImmersive, isImmersiveFullscreen, onExit, overlayRef]);

  // Cleanup body class on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove(BODY_CLASS);
    };
  }, []);

  return {
    isImmersiveFullscreen,
    enterImmersive,
    exitImmersive,
    toggleImmersive,
    getSnapshot,
  };
}
