import { expect, test } from '@playwright/test';
import { seedStudentDemo } from './helpers/auth';

test.describe('Auth / RoleGuard production behavior', () => {
  test('student session cannot open admin dashboard as admin UI', async ({ page }) => {
    await seedStudentDemo(page);
    await page.goto('/admin/dashboard');
    // Production RoleGuard redirects away from admin for student role.
    await expect(page).not.toHaveURL(/\/admin\/dashboard/, { timeout: 30_000 });
  });

  test('malformed demo session does not blank the app shell', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('aira:demo-session', '{broken');
    });
    await page.goto('/student/dashboard');
    // Should redirect to login or show a recoverable state — never an empty document forever.
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 30_000 });
  });
});
