import { describe, expect, it } from 'vitest';
import {
  getTeachingLayoutFlags,
  resolveTeachingLayoutMode,
  teachingPanelFlexRatio,
  TEACHING_DESKTOP_MIN,
  TEACHING_MULTI_PANEL_MIN_WIDTH,
} from '@/features/teaching/layout/teachingLayoutMode';

describe('teachingLayoutMode', () => {
  it('classifies phone, tablet portrait, tablet landscape, and desktop', () => {
    expect(resolveTeachingLayoutMode(390, 844)).toBe('mobile');
    expect(resolveTeachingLayoutMode(767, 1024)).toBe('mobile');
    expect(resolveTeachingLayoutMode(768, 1024)).toBe('tablet-portrait');
    expect(resolveTeachingLayoutMode(834, 1194)).toBe('tablet-portrait');
    expect(resolveTeachingLayoutMode(1024, 768)).toBe('tablet-landscape');
    expect(resolveTeachingLayoutMode(1180, 820)).toBe('tablet-landscape');
    expect(resolveTeachingLayoutMode(TEACHING_DESKTOP_MIN, 800)).toBe('desktop');
    expect(resolveTeachingLayoutMode(1920, 1080)).toBe('desktop');
  });

  it('uses compact tabs for tablet portrait and multi-panel for landscape', () => {
    const portrait = getTeachingLayoutFlags(820, 1180);
    expect(portrait.isCompactLayout).toBe(true);
    expect(portrait.isMultiPanel).toBe(false);
    expect(portrait.isTabletPortrait).toBe(true);

    const landscape = getTeachingLayoutFlags(1024, 768);
    expect(landscape.isCompactLayout).toBe(false);
    expect(landscape.isMultiPanel).toBe(true);
    expect(landscape.isTabletLandscape).toBe(true);
  });

  it('falls back to compact when landscape tablet is too narrow for three panels', () => {
    const narrow = getTeachingLayoutFlags(TEACHING_MULTI_PANEL_MIN_WIDTH - 1, 600);
    expect(narrow.mode).toBe('tablet-portrait');
    expect(narrow.isCompactLayout).toBe(true);
  });

  it('keeps teaching flex ratio dominant on tablet landscape', () => {
    const chat = teachingPanelFlexRatio('chat', 'tablet-landscape');
    const teach = teachingPanelFlexRatio('teach', 'tablet-landscape');
    const studio = teachingPanelFlexRatio('studio', 'tablet-landscape');
    expect(teach.startsWith('2.2')).toBe(true);
    expect(chat.startsWith('0.8')).toBe(true);
    expect(studio.startsWith('0.8')).toBe(true);
  });
});
