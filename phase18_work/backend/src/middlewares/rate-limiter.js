import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const buildHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    message,
    errors: [
      {
        field: null,
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
    ],
  });
};

export const globalRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests',
  handler: buildHandler('Too many requests. Please try again later.'),
});

export const authRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: buildHandler('Too many authentication attempts. Please try again later.'),
});


export const uploadRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: Math.max(10, Math.floor(env.rateLimit.authMax * 2)),
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Quá nhiều yêu cầu upload/import. Vui lòng thử lại sau.'),
});
