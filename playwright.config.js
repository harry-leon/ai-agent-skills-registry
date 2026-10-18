import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90000,
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'x-test-bypass-rate-limit': 'true',
    },
  },
  webServer: {
    command: 'npm run dev -- -p 3001',
    url: 'http://localhost:3001/api/health',
    reuseExistingServer: true,
    timeout: 90000,
    env: {
      PORT: '3001',
      APP_URL: 'http://localhost:3001',
    },
  },
  projects: [
    {
      name: 'Mobile 375px',
      use: {
        viewport: { width: 375, height: 667 },
        isMobile: true,
      },
    },
    {
      name: 'Tablet 768px',
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'Desktop 1440px',
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
