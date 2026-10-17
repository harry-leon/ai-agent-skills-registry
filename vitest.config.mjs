import { defineConfig } from 'vitest/config';
import path from 'node:path';
import fs from 'node:fs';

if (fs.existsSync('.env.test')) {
  process.loadEnvFile('.env.test');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
    },
  },
});
