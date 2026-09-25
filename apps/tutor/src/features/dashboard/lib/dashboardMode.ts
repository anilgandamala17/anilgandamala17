import type { DashboardMode } from '@/features/dashboard/components/DashboardModeSwitcher';

export const DASHBOARD_MODE_PARAM = 'mode';

/** Canonical dashboard modes for `/student/dashboard?mode=`. */
export function parseDashboardMode(raw: string | null | undefined): DashboardMode {
  return raw === 'competitive' ? 'competitive' : 'curriculum';
}

/** True when the query value is empty or an allowed mode (invalid values should be stripped). */
export function isCanonicalDashboardModeParam(raw: string | null | undefined): boolean {
  return raw == null || raw === '' || raw === 'curriculum' || raw === 'competitive';
}
