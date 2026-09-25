import { expect, test } from '@playwright/test';
import { seedStudentDemo } from './helpers/auth';

test.describe('Curriculum streams', () => {
  test.beforeEach(async ({ page }) => {
    await seedStudentDemo(page);
  });

  test('Class 11 MPC deep link shows MPC subjects only', async ({ page }) => {
    await page.goto('/student/curriculum?grade=grade-11-science&stream=mpc');
    await expect(page.getByRole('heading', { name: /Class 11 · MPC/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('button', { name: /Open Mathematics/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Open Biology/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Open Computer Science/i })).toHaveCount(0);
  });

  test('Class 11 BiPC deep link shows BiPC subjects only', async ({ page }) => {
    await page.goto('/student/curriculum?grade=grade-11-science&stream=bipc');
    await expect(page.getByRole('heading', { name: /Class 11 · BiPC/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('button', { name: /Open Biology/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Open Mathematics/i })).toHaveCount(0);
  });

  test('Class 12 MPC deep link preserves stream', async ({ page }) => {
    await page.goto('/student/curriculum?grade=grade-12-science&stream=mpc');
    await expect(page.getByRole('heading', { name: /Class 12 · MPC/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('button', { name: /Open Physics/i })).toBeVisible();
  });
});
