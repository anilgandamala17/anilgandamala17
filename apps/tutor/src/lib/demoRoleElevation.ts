import type { AppRole } from '@/types';

/**
 * Phase 7 / 8: demo role auto-elevation must only happen in local DEV.
 * Production builds must never elevate student → teacher/admin via URL.
 */
export function shouldAutoElevateDemoRole(params: {
  isDev: boolean;
  isDemo: boolean;
  pathRole: AppRole | null | undefined;
  allowedRole: AppRole;
  currentRole: AppRole | null | undefined;
}): boolean {
  const { isDev, isDemo, pathRole, allowedRole, currentRole } = params;
  return Boolean(
    isDev && isDemo && pathRole && pathRole === allowedRole && currentRole !== allowedRole,
  );
}
