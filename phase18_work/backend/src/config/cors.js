import { env } from './env.js';

export const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (env.cors.origins.length === 0 || env.cors.origins.includes('*')) {
      return callback(null, true);
    }

    if (env.cors.origins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Requested-With'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 86400,
};
