/**
 * Teaching workspace layout modes — presentation only.
 * Breakpoints: mobile <768 | tablet 768–1199 | desktop ≥1200
 * Tablet portrait → compact (tabbed single panel)
 * Tablet landscape → multi-panel (desktop-like, teaching-dominant)
 */

export const TEACHING_MOBILE_MAX = 767;
export const TEACHING_TABLET_MIN = 768;
export const TEACHING_TABLET_MAX = 1199;
export const TEACHING_DESKTOP_MIN = 1200;
/** Below this width in landscape tablet range, fall back to compact tabs. */
export const TEACHING_MULTI_PANEL_MIN_WIDTH = 900;

export type TeachingLayoutMode =
  | 'mobile'
  | 'tablet-portrait'
  | 'tablet-landscape'
  | 'desktop';

export type TeachingLayoutFlags = {
  mode: TeachingLayoutMode;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Single active panel + Chat | Teaching | Studio tabs */
  isCompactLayout: boolean;
  /** Three panels side-by-side */
  isMultiPanel: boolean;
  isTabletPortrait: boolean;
  isTabletLandscape: boolean;
};

export function resolveTeachingLayoutMode(
  width: number,
  height: number,
): TeachingLayoutMode {
  if (width <= TEACHING_MOBILE_MAX) return 'mobile';
  if (width >= TEACHING_DESKTOP_MIN) return 'desktop';

  const portrait = height >= width;
  if (portrait) return 'tablet-portrait';

  // Landscape tablet: prefer multi-panel; gracefully compact if too narrow.
  if (width < TEACHING_MULTI_PANEL_MIN_WIDTH) return 'tablet-portrait';
  return 'tablet-landscape';
}

export function getTeachingLayoutFlags(
  width: number,
  height: number,
): TeachingLayoutFlags {
  const mode = resolveTeachingLayoutMode(width, height);
  const isPhone = mode === 'mobile';
  const isTablet = mode === 'tablet-portrait' || mode === 'tablet-landscape';
  const isDesktop = mode === 'desktop';
  const isTabletPortrait = mode === 'tablet-portrait';
  const isTabletLandscape = mode === 'tablet-landscape';
  const isCompactLayout = isPhone || isTabletPortrait;
  const isMultiPanel = isDesktop || isTabletLandscape;

  return {
    mode,
    isPhone,
    isTablet,
    isDesktop,
    isCompactLayout,
    isMultiPanel,
    isTabletPortrait,
    isTabletLandscape,
  };
}

/** Flex grow/shrink/basis for multi-panel workspace; teaching stays dominant. */
export function teachingPanelFlexRatio(
  panel: 'chat' | 'teach' | 'studio',
  layout: TeachingLayoutMode,
): string {
  if (layout === 'tablet-landscape') {
    if (panel === 'chat') return '0.8 1 180px';
    if (panel === 'studio') return '0.8 1 180px';
    return '2.2 1 0%';
  }
  // Desktop (and fallback)
  if (panel === 'chat') return '23 23 0%';
  if (panel === 'studio') return '22 22 0%';
  return '55 55 0%';
}
