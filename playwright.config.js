import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
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
