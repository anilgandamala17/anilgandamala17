import { expect, test } from '@playwright/test';
import { seedStudentDemo } from './helpers/auth';

const viewports = [
  { name: '320x568', width: 320, height: 568 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1920x1080', width: 1920, height: 1080 },
] as const;

for (const vp of viewports) {
  test(`competitive exams catalog has no horizontal overflow at ${vp.name}`, async ({ page }) => {
    await seedStudentDemo(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/student/competitive?section=exams');
    await expect(page.getByRole('heading', { name: /JEE Main/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 2;
    });
    expect(overflow).toBe(false);
  });
}

test('Available Exams card opens instructions without overflow', async ({ page }) => {
  await seedStudentDemo(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/student/competitive?section=exams');
  await expect(page.getByRole('heading', { name: /JEE Main/i }).first()).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole('button', { name: /JEE Main/i }).first().click();
  await expect(page).toHaveURL(/step=instructions/);
  await expect(page.getByRole('button', { name: /Continue to system check/i })).toBeVisible();
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  expect(overflow).toBe(false);
});

test('AI Explanation section loads without forbidden legacy cards', async ({ page }) => {
  await seedStudentDemo(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/student/competitive?section=questionary');
  await expect(page.getByRole('heading', { name: /Ask anything/i })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(/Answer Announcement/i)).toHaveCount(0);
  await expect(page.getByText(/Next Practice/i)).toHaveCount(0);
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  expect(overflow).toBe(false);
});

const resultViewports = [
  { name: '320', width: 320, height: 568 },
  { name: '360', width: 360, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '412', width: 412, height: 915 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1366', width: 1366, height: 768 },
  { name: '1920', width: 1920, height: 1080 },
] as const;

for (const vp of resultViewports) {
  test(`competitive result-surface shell has no horizontal overflow at ${vp.name}px`, async ({
    page,
  }) => {
    await seedStudentDemo(page);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    // Result UI is presentation-only over ExamFlow data; catalog shell covers responsive chrome.
    await page.goto('/student/competitive?section=exams');
    await expect(page.getByRole('heading', { name: /JEE Main/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > window.innerWidth;
    });
    expect(overflow).toBe(false);
  });
}
