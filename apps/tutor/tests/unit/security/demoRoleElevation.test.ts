import { describe, expect, it } from 'vitest';
import { shouldAutoElevateDemoRole } from '@/lib/demoRoleElevation';

describe('RoleGuard demo elevation (Phase 7 regression)', () => {
  it('elevates only in DEV for matching demo path', () => {
    expect(
      shouldAutoElevateDemoRole({
        isDev: true,
        isDemo: true,
        pathRole: 'admin',
        allowedRole: 'admin',
        currentRole: 'student',
      }),
    ).toBe(true);
  });

  it('never elevates in production builds', () => {
    expect(
      shouldAutoElevateDemoRole({
        isDev: false,
        isDemo: true,
        pathRole: 'admin',
        allowedRole: 'admin',
        currentRole: 'student',
      }),
    ).toBe(false);
  });

  it('does not elevate non-demo sessions', () => {
    expect(
      shouldAutoElevateDemoRole({
        isDev: true,
        isDemo: false,
        pathRole: 'teacher',
        allowedRole: 'teacher',
        currentRole: 'student',
      }),
    ).toBe(false);
  });
});
