import { defineConfig, devices } from '@playwright/test';

const remoteBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: remoteBaseUrl ?? 'http://127.0.0.1:8791',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: remoteBaseUrl
    ? undefined
    : {
        command: 'npm run build && node scripts/start-e2e.mjs',
        url: 'http://127.0.0.1:8791/healthz',
        reuseExistingServer: false,
        timeout: 45_000,
      },
});
