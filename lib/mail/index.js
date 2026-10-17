import nodemailer from 'nodemailer';
import { env } from '../env.js';
import { logger } from '../logger.js';

let transporter = null;

if (env.NODE_ENV === 'production' && env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD,
          }
        : undefined,
  });
}

/**
 * Sends an email or logs to console in development.
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise<{ messageId: string, url?: string }>}
 */
export async function sendMail({ to, subject, text, html }) {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: env.MAIL_FROM,
        to,
        subject,
        text,
        html,
      });
      logger.info({ messageId: info.messageId, to, subject }, 'Email sent via SMTP');
      return { messageId: info.messageId };
    } catch (err) {
      logger.error({ err: err.message, to, subject }, 'Failed to send email via SMTP');
      throw err;
    }
  }

  // Development & Test: Log directly to console
  console.log('\n================== [SKILLVAULT DEV EMAIL] ==================');
  console.log(`To: ${to}`);
  console.log(`From: ${env.MAIL_FROM}`);
  console.log(`Subject: ${subject}`);
  console.log('------------------------------------------------------------');
  console.log(text);
  console.log('============================================================\n');

  return { messageId: `dev-${Date.now()}` };
}
