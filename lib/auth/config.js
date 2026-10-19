import crypto from 'node:crypto';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { db } from '../db.js';
import { env } from '../env.js';
import { sendMail } from '../mail/index.js';
import { validateHandle } from './handle.js';

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.APP_URL,
  advanced: {
    generateId: () => crypto.randomUUID(),
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  trustedOrigins: [
    env.APP_URL,
    'https://skillary.harryleon.id.vn',
    'https://skillary.vercel.app',
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    ...(env.NODE_ENV === 'development' || env.NODE_ENV === 'test'
      ? [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days (Rule S1)
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: false, // Rule S1: DB is source of truth, resolved on every request
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION,
    async sendResetPassword({ user, url }) {
      await sendMail({
        to: user.email,
        subject: 'Reset your SkillVault password',
        text: `Hello,\n\nPlease click the following link to reset your SkillVault account password:\n${url}\n\nThis link is valid for 1 hour. If you did not request this, please ignore this email.`,
        html: `<p>Hello,</p><p>Please click the link below to reset your password:</p><p><a href="${url}">${url}</a></p><p>This link is valid for 1 hour. If you did not request this, please ignore this email.</p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: env.REQUIRE_EMAIL_VERIFICATION,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      await sendMail({
        to: user.email,
        subject: 'Verify your SkillVault account',
        text: `Hello,\n\nPlease click the following link to activate your SkillVault account:\n${url}\n\nThis link is valid for 1 hour.`,
        html: `<p>Hello,</p><p>Please click the link below to verify your SkillVault account:</p><p><a href="${url}">${url}</a></p><p>This link is valid for 1 hour.</p>`,
      });
    },
  },
  socialProviders: {
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  user: {
    additionalFields: {
      handle: {
        type: 'string',
        required: true,
        input: true,
        validator: (value) => {
          const res = validateHandle(value);
          return res.valid;
        },
      },
      status: {
        type: 'string',
        defaultValue: 'ACTIVE',
      },
    },
  },
});
