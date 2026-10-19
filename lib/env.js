import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    APP_URL: z.string().url().default('http://localhost:3000'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters long'),
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    STORAGE_LOCAL_DIR: z.string().default('./storage/blobs'),
    S3_ENDPOINT: z.string().optional(),
    S3_REGION: z.string().default('us-east-1'),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_FORCE_PATH_STYLE: z
      .string()
      .optional()
      .transform((v) => v === 'true' || v === '1'),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 587)),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().default('SkillVault <no-reply@skillvault.local>'),
    REQUIRE_EMAIL_VERIFICATION: z
      .string()
      .optional()
      .transform((v) => v === 'true' || v === '1')
      .default('false'),
    TRUSTED_PROXY_HEADER: z.string().optional(),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    GITHUB_TOKEN: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    MAX_FILE_BYTES: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 200 * 1024)), // 200 KB per file
    MAX_SKILL_TOTAL_BYTES: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 5 * 1024 * 1024)), // 5 MB per skill total
    MAX_ACCOUNT_TOTAL_BYTES: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 10 * 1024 * 1024)), // 10 MB per account total
    MAX_SKILL_FILES: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 100)), // max 100 files per skill
    MAX_ZIP_COMPRESSED_BYTES: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 5 * 1024 * 1024)), // 5 MB compressed zip
    MAX_ZIP_UNCOMPRESSED_BYTES: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 15 * 1024 * 1024)), // 15 MB uncompressed zip
    MAX_ZIP_COMPRESSION_RATIO: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 50)),
    MAX_ZIP_ENTRIES: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 500)),
    MAX_PATH_DEPTH: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 10)),
    MAX_PATH_LENGTH: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 255)),
    GITHUB_IMPORT_MAX_BYTES: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 10 * 1024 * 1024)), // 10 MB GitHub import limit
    CRON_SECRET: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (data.STORAGE_DRIVER === 'local') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['STORAGE_DRIVER'],
          message: 'STORAGE_DRIVER=local is rejected in production environments',
        });
      }
      if (!data.S3_BUCKET && data.STORAGE_DRIVER === 's3') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['S3_BUCKET'],
          message: 'S3_BUCKET is required when STORAGE_DRIVER=s3',
        });
      }
    }
  });

export function validateEnv(source = process.env) {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const invalidFields = result.error.issues.map((i) => i.path.join('.'));
    // Rule S9: On failure log the NAMES of invalid variables (never values) and exit with code 1
    console.error(
      `[FATAL] Invalid environment configuration. The following variables failed validation: ${invalidFields.join(', ')}`,
    );
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw new Error(`Invalid environment configuration: ${invalidFields.join(', ')}`);
  }
  return result.data;
}

export const env = validateEnv();
