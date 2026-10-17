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
        subject: 'Đặt lại mật khẩu SkillVault',
        text: `Chào bạn, vui lòng truy cập đường dẫn sau để đặt lại mật khẩu cho tài khoản SkillVault của bạn:\n${url}\n\nLiên kết này có hiệu lực trong vòng 1 giờ. Nếu bạn không yêu cầu, vui lòng bỏ qua thư này.`,
        html: `<p>Chào bạn,</p><p>Vui lòng nhấp vào liên kết sau để đặt lại mật khẩu:</p><p><a href="${url}">${url}</a></p><p>Liên kết có hiệu lực trong vòng 1 giờ.</p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: env.REQUIRE_EMAIL_VERIFICATION,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      await sendMail({
        to: user.email,
        subject: 'Xác thực tài khoản SkillVault',
        text: `Chào bạn, vui lòng truy cập liên kết sau để kích hoạt tài khoản SkillVault của bạn:\n${url}\n\nLiên kết này có hiệu lực trong 1 giờ.`,
        html: `<p>Chào bạn,</p><p>Vui lòng nhấp vào liên kết sau để xác thực tài khoản SkillVault:</p><p><a href="${url}">${url}</a></p>`,
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
