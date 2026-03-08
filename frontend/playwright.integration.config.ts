import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/integration',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-integration' }]],
  use: {
    baseURL: process.env.API_URL || 'http://127.0.0.1:4000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'api-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
