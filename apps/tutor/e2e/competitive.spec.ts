import { expect, test } from '@playwright/test';
import { seedStudentDemo } from './helpers/auth';

test.describe('Competitive hub', () => {
  test.beforeEach(async ({ page }) => {
    await seedStudentDemo(page);
  });

  test('exams section loads without manual refresh', async ({ page }) => {
    await page.goto('/student/competitive?section=exams');
    // Catalog content proves load; desktop h2 is lg-only, so assert exam cards.
    await expect(page.getByRole('heading', { name: /JEE Main/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('heading', { name: /NEET/i }).first()).toBeVisible();
  });

  test('section switch weekly loads content without refresh', async ({ page }) => {
    await page.goto('/student/competitive?section=exams');
    await expect(page.getByRole('heading', { name: /JEE Main/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    await page.goto('/student/competitive?section=weekly');
    await expect(page).toHaveURL(/section=weekly/);
    await expect(page.getByRole('heading', { name: /Weekly assessments/i })).toBeVisible({
      timeout: 30_000,
    });
  });
});
