import { defineConfig, devices } from '@playwright/test';

/**
 * E2E against the Vite tutor preview (same SPA routes as via landing proxy).
 * Start with: npm run build && npx playwright test
 * Or against a running monorepo: PLAYWRIGHT_BASE_URL=http://localhost:3010
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run preview -- --host 127.0.0.1 --port 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
