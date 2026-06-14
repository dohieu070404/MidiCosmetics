import pino from 'pino';
import { env } from './env.js';

const loggerOptions = {
  level: env.logger.level,
  base: {
    service: 'midi-cosmetics-backend',
    env: env.nodeEnv,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      '*.password',
      '*.passwordHash',
      'token',
      '*.token',
      'bootstrapToken',
      '*.bootstrapToken',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'SMTP_PASS',
      'SMTP_USER',
      'smtpPass',
      'smtpUser',
      'env.email.smtpPass',
      'env.email.smtpUser',
    ],
    censor: '[REDACTED]',
  },
};

// IMPORTANT:
// Do not auto-enable pino-pretty just because NODE_ENV=development.
// Docker images often install production dependencies only; auto-loading a dev-only
// transport makes the container crash at boot with:
// "unable to determine transport target for \"pino-pretty\"".
// Enable pretty logs explicitly with LOGGER_PRETTY=true.
if (env.logger.pretty) {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  };
}

export const logger = pino(loggerOptions);
