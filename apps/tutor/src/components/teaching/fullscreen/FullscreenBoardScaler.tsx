import { useEffect, useRef, useState } from 'react';

/** Reference canvas — matches --teaching-board-safe-aspect 16:9 */
export const BOARD_REF_WIDTH = 1280;
export const BOARD_REF_HEIGHT = 720;

const H_MARGIN = 16;
const V_MARGIN = 12;
const FILL_PAD = 8;
const DEFAULT_TOOLBAR_RESERVE_PX = 72;

const FILL_MEDIA = '(max-width: 768px)';

function isMobileFillViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(FILL_MEDIA).matches;
}

type FullscreenBoardScalerProps = {
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
  /** Space reserved for floating toolbar (measured or default). Ignored in mobile fill mode. */
  toolbarReservePx?: number;
};

/**
 * Scales the teaching board as a single educational canvas to fill the
 * available fullscreen area while preserving aspect ratio (contain-fit).
 * On phones (≤768px, portrait or landscape), fills the stage instead of letterboxing 16:9.
 * Scale may exceed 1 on large monitors.
 */
export default function FullscreenBoardScaler({
  children,
  className = '',
  enabled = true,
  toolbarReservePx = DEFAULT_TOOLBAR_RESERVE_PX,
}: FullscreenBoardScalerProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [fillMode, setFillMode] = useState(false);
  const [fillSize, setFillSize] = useState({ width: BOARD_REF_WIDTH, height: BOARD_REF_HEIGHT });

  useEffect(() => {
    if (!enabled) return;
    const stage = stageRef.current;
    if (!stage) return;

    const update = () => {
      const useFill = isMobileFillViewport();
      setFillMode(useFill);

      const stageW = stage.clientWidth;
      const stageH = stage.clientHeight;
      if (stageW <= 0 || stageH <= 0) return;

      if (useFill) {
        const availW = Math.max(1, stageW - FILL_PAD * 2);
        const availH = Math.max(1, stageH - FILL_PAD * 2);
        setFillSize({ width: availW, height: availH });
        setScale(1);
        return;
      }

      const availW = stageW - H_MARGIN * 2;
      const availH = stageH - toolbarReservePx - V_MARGIN * 2;
      if (availW <= 0 || availH <= 0) return;

      const nextScale = Math.min(
        availW / BOARD_REF_WIDTH,
        availH / BOARD_REF_HEIGHT,
      );
      setScale(nextScale);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    window.addEventListener('orientationchange', update);
    window.addEventListener('resize', update);
    const mq = window.matchMedia(FILL_MEDIA);
    const onMq = () => update();
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onMq);
    else mq.addListener(onMq);

    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('resize', update);
      if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', onMq);
      else mq.removeListener(onMq);
    };
  }, [enabled, toolbarReservePx]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={stageRef}
      className={`fullscreen-board-scaler fullscreen-board-scaler__stage ${fillMode ? 'fullscreen-board-scaler__stage--fill' : ''} ${className}`.trim()}
    >
      <div
        className={`fullscreen-board-scaler__canvas${fillMode ? ' fullscreen-board-scaler__canvas--fill' : ''}`}
        style={
          fillMode
            ? {
                width: fillSize.width,
                height: fillSize.height,
                transform: 'none',
              }
            : {
                width: BOARD_REF_WIDTH,
                height: BOARD_REF_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
              }
        }
      >
        {children}
      </div>
    </div>
  );
}
