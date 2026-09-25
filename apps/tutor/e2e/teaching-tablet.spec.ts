import { expect, test } from '@playwright/test';
import { seedStudentDemo } from './helpers/auth';

const LEARN_URL =
  '/student/learn/bio-11-8-mitochondria?grade=grade-11-science&subject=biology&stream=bipc';

async function openTeaching(page: import('@playwright/test').Page) {
  await seedStudentDemo(page);
  await page.goto(LEARN_URL);
  await expect(page.getByRole('heading', { name: /Mitochondria/i }).first()).toBeVisible({
    timeout: 45_000,
  });
}

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > window.innerWidth;
  });
  expect(overflow).toBe(false);
}

test.describe('Teaching tablet responsive', () => {
  test('tablet portrait shows compact panel tabs with Teaching selected', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await openTeaching(page);

    const tablist = page.getByRole('tablist', { name: /Teaching workspace panels/i });
    await expect(tablist).toBeVisible();
    await expect(page.getByRole('tab', { name: /Switch to Teaching panel/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('heading', { name: /Teaching Panel/i })).toHaveCount(0);
    await assertNoHorizontalOverflow(page);
  });

  test('tablet portrait can switch Chat and Studio without leaving lesson', async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await openTeaching(page);

    const topic = page.getByRole('heading', { name: /Mitochondria/i }).first();
    await expect(topic).toBeVisible();

    await page.getByRole('tab', { name: /Switch to Chat panel/i }).click();
    await expect(page.getByRole('tab', { name: /Switch to Chat panel/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(topic).toBeVisible();

    await page.getByRole('tab', { name: /Switch to Studio panel/i }).click();
    await expect(page.getByRole('tab', { name: /Switch to Studio panel/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(topic).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test('tablet landscape shows three-panel workspace without compact tabs', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openTeaching(page);

    await expect(page.getByRole('tablist', { name: /Teaching workspace panels/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Teaching Panel/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Chat Panel/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Studio Panel/i })).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test('orientation change swaps compact tabs and multi-panel without losing topic', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await openTeaching(page);
    await expect(page.getByRole('tablist', { name: /Teaching workspace panels/i })).toBeVisible();

    await page.setViewportSize({ width: 1180, height: 820 });
    await expect(page.getByRole('tablist', { name: /Teaching workspace panels/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Teaching Panel/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Mitochondria/i }).first()).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 820, height: 1180 });
    await expect(page.getByRole('tablist', { name: /Teaching workspace panels/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Mitochondria/i }).first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  for (const vp of [
    { name: '768x1024', width: 768, height: 1024 },
    { name: '800x1280', width: 800, height: 1280 },
    { name: '1024x768', width: 1024, height: 768 },
    { name: '1194x834', width: 1194, height: 834 },
    { name: '1200x800', width: 1200, height: 800 },
    { name: '390x844', width: 390, height: 844 },
  ] as const) {
    test(`no horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openTeaching(page);
      await assertNoHorizontalOverflow(page);
    });
  }
});
