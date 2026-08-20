import { env } from '../config/env.js';
import { ApiError } from '../errors/api-error.js';

// Cookie-backed authentication endpoints must not accept cross-site browser
// requests. CORS only controls whether a browser may read a response; it does
// not stop the request from reaching the server.
export const requireTrustedOrigin = (req, res, next) => {
  if (!env.isProduction) return next();

  const origin = String(req.headers.origin || '').trim();
  const fetchSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  if (!origin || !env.cors.origins.includes(origin) || fetchSite === 'cross-site') {
    return next(ApiError.forbidden('Request origin is not allowed'));
  }

  return next();
};
