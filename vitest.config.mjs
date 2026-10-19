import { defineConfig } from 'vitest/config';
import path from 'node:path';
import fs from 'node:fs';

if (fs.existsSync('.env.test')) {
  process.loadEnvFile('.env.test');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

// In test environment, email verification must be disabled so signUp returns session cookie
process.env.REQUIRE_EMAIL_VERIFICATION = 'false';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false,
    include: ['tests/unit/**/*.test.js', 'tests/integration/**/*.test.js'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
    },
  },
});
