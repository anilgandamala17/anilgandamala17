import { expect, test } from '@playwright/test';
import { seedStudentDemo } from './helpers/auth';

test.describe('Dashboard modes', () => {
  test.beforeEach(async ({ page }) => {
    await seedStudentDemo(page);
  });

  test('default dashboard stays on /student/dashboard', async ({ page }) => {
    await page.goto('/student/dashboard');
    await expect(page).toHaveURL(/\/student\/dashboard/);
    await expect(page.getByRole('tab', { name: /Curriculum/i })).toBeVisible({ timeout: 30_000 });
  });

  test('mode=competitive stays on same route and shows competitive UI', async ({ page }) => {
    await page.goto('/student/dashboard?mode=competitive');
    await expect(page).toHaveURL(/\/student\/dashboard\?mode=competitive/);
    await expect(page.getByRole('tab', { name: /Competitive/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /Overview|Continue preparation/i }).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('switching mode does not navigate to a second dashboard path', async ({ page }) => {
    await page.goto('/student/dashboard?mode=curriculum');
    await expect(page.getByRole('tab', { name: /Curriculum/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole('tab', { name: /Competitive/i }).click();
    await expect(page).toHaveURL(/\/student\/dashboard/);
    expect(page.url()).not.toMatch(/\/student\/dashboard\/competitive/);
  });
});
