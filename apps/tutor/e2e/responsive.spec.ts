import { expect, test } from '@playwright/test';
import { seedStudentDemo } from './helpers/auth';

const viewports = [
  { name: '320', width: 320, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

for (const vp of viewports) {
  test(`dashboard has no horizontal overflow at ${vp.name}px`, async ({ page }) => {
    await seedStudentDemo(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/student/dashboard');
    await expect(page.getByRole('tab', { name: /Curriculum/i })).toBeVisible({ timeout: 30_000 });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 2;
    });
    expect(overflow).toBe(false);
  });
}
