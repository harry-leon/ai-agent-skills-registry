import pino from 'pino';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const isDev = process.env.NODE_ENV !== 'production';

let prettyStream;
if (isDev && process.env.NODE_ENV !== 'test') {
  try {
    const pretty = require('pino-pretty');
    prettyStream = pretty({
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard',
    });
  } catch {
    // Fallback to default json output if pino-pretty is unavailable
  }
}

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    redact: {
      paths: [
        'authorization',
        'cookie',
        'password',
        'token',
        'secret',
        'headers.authorization',
        'headers.cookie',
        '*.password',
        '*.token',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },
  },
  prettyStream
);

