import { expect, test } from '@playwright/test';
import { seedStudentDemo } from './helpers/auth';

test.describe('Teaching smoke', () => {
  test.beforeEach(async ({ page }) => {
    await seedStudentDemo(page);
  });

  test('curated deep link opens teaching workspace panels', async ({ page }) => {
    await page.goto(
      '/student/learn/bio-11-8-mitochondria?grade=grade-11-science&subject=biology&stream=bipc',
    );
    await expect(page.getByRole('heading', { name: /Mitochondria/i }).first()).toBeVisible({
      timeout: 45_000,
    });
    const ask = page.getByRole('button', { name: /Ask AIra/i });
    const teachingPanel = page.getByRole('heading', { name: /Teaching Panel/i });
    const switchTeaching = page.getByRole('button', { name: /Switch to Teaching panel/i });
    await expect(ask.or(teachingPanel).or(switchTeaching).first()).toBeVisible({ timeout: 20_000 });
  });

  test('non-curated topic opens teachable lesson (not preparing gate)', async ({ page }) => {
    await page.goto('/student/learn/math-8-3-angle-sum?grade=grade-8&subject=mathematics');
    await expect(page.getByRole('heading', { name: /Angle Sum/i }).first()).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByRole('heading', { name: /Lesson is being prepared/i })).toHaveCount(0);
    const ask = page.getByRole('button', { name: /Ask AIra/i });
    const teachingPanel = page.getByRole('heading', { name: /Teaching Panel/i });
    const switchTeaching = page.getByRole('button', { name: /Switch to Teaching panel/i });
    await expect(ask.or(teachingPanel).or(switchTeaching).first()).toBeVisible({ timeout: 20_000 });
  });
});
