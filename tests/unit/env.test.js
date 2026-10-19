import { describe, it, expect, vi } from 'vitest';
import { validateEnv } from '@/lib/env.js';

describe('lib/env.js validation', () => {
  const validBaseEnv = {
    NODE_ENV: 'test',
    APP_URL: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/skillvault_test',
    BETTER_AUTH_SECRET: 'a_very_secure_secret_with_more_than_32_characters_for_testing',
    STORAGE_DRIVER: 'local',
  };

  it('validates and returns parsed environment with defaults', () => {
    const parsed = validateEnv(validBaseEnv);
    expect(parsed.NODE_ENV).toBe('test');
    expect(parsed.APP_URL).toBe('http://localhost:3000');
    expect(parsed.STORAGE_DRIVER).toBe('local');
    expect(parsed.MAX_FILE_BYTES).toBe(200 * 1024);
    expect(parsed.MAX_ACCOUNT_TOTAL_BYTES).toBe(10 * 1024 * 1024);
  });

  it('fails validation when DATABASE_URL is missing and logs invalid variable name', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const invalidEnv = { ...validBaseEnv, DATABASE_URL: '' };

    expect(() => validateEnv(invalidEnv)).toThrow(
      /Invalid environment configuration: DATABASE_URL/,
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('DATABASE_URL'));
    consoleSpy.mockRestore();
  });

  it('fails validation when BETTER_AUTH_SECRET is shorter than 32 characters', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const invalidEnv = { ...validBaseEnv, BETTER_AUTH_SECRET: 'short_secret' };

    expect(() => validateEnv(invalidEnv)).toThrow(/BETTER_AUTH_SECRET/);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('BETTER_AUTH_SECRET'));
    consoleSpy.mockRestore();
  });

  it('rejects STORAGE_DRIVER=local when NODE_ENV is production', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const prodLocalEnv = {
      ...validBaseEnv,
      NODE_ENV: 'production',
      STORAGE_DRIVER: 'local',
    };

    expect(() => validateEnv(prodLocalEnv)).toThrow(/STORAGE_DRIVER/);
    consoleSpy.mockRestore();
  });
});
