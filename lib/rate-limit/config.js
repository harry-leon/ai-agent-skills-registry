export const RATE_LIMIT_CONFIGS = {
  login: {
    keyPrefix: 'login',
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    failClosed: true,
  },
  register: {
    keyPrefix: 'register',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    failClosed: true,
  },
  forgotPassword: {
    keyPrefix: 'forgot-password',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    failClosed: true,
  },
  upload: {
    keyPrefix: 'upload',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30,
    failClosed: false,
  },
  githubImport: {
    keyPrefix: 'github-import',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    failClosed: false,
  },
  fork: {
    keyPrefix: 'fork',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 60,
    failClosed: false,
  },
  shareTokenRead: {
    keyPrefix: 'share-read',
    windowMs: 60 * 1000, // 1 minute
    max: 120,
    failClosed: false,
  },
  authenticatedApi: {
    keyPrefix: 'auth-api',
    windowMs: 60 * 1000, // 1 minute
    max: 120,
    failClosed: false,
  },
};
