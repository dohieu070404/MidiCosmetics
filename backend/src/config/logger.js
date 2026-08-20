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
      'req.headers.referer',
      'req.headers.referrer',
      'req.url',
      'url',
      'req.body.password',
      'req.body.bootstrapToken',
      'req.body.recaptchaToken',
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
      'DATABASE_URL',
      'DIRECT_URL',
      'POSTGRES_PASSWORD',
      'RECAPTCHA_SECRET_KEY',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'smtpPass',
      'smtpUser',
      'env.email.smtpPass',
      'env.email.smtpUser',
    ],
    censor: '[REDACTED]',
  },
  ...(env.isProduction ? {
    serializers: {
      err(error) {
        return {
          type: error?.name || 'Error',
          code: error?.code || undefined,
          statusCode: error?.statusCode || undefined,
          message: '[REDACTED_IN_PRODUCTION]',
        };
      },
    },
  } : {}),
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
