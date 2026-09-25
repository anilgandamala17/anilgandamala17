import { describe, expect, it } from 'vitest';
import {
  isCanonicalDashboardModeParam,
  parseDashboardMode,
} from '@/features/dashboard/lib/dashboardMode';

describe('dashboard mode', () => {
  it('defaults to curriculum', () => {
    expect(parseDashboardMode(null)).toBe('curriculum');
    expect(parseDashboardMode(undefined)).toBe('curriculum');
    expect(parseDashboardMode('')).toBe('curriculum');
    expect(parseDashboardMode('garbage')).toBe('curriculum');
  });

  it('accepts competitive', () => {
    expect(parseDashboardMode('competitive')).toBe('competitive');
  });

  it('canonicalizes valid mode params', () => {
    expect(isCanonicalDashboardModeParam(null)).toBe(true);
    expect(isCanonicalDashboardModeParam('')).toBe(true);
    expect(isCanonicalDashboardModeParam('curriculum')).toBe(true);
    expect(isCanonicalDashboardModeParam('competitive')).toBe(true);
    expect(isCanonicalDashboardModeParam('admin')).toBe(false);
  });
});
