import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (payload) =>
  jwt.sign(payload, env.auth.jwtAccessSecret, {
    expiresIn: env.auth.accessExpiresIn,
    issuer: 'midi-cosmetics-api',
    audience: 'midi-cosmetics-client',
  });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, env.auth.jwtRefreshSecret, {
    expiresIn: env.auth.refreshExpiresIn,
    issuer: 'midi-cosmetics-api',
    audience: 'midi-cosmetics-client',
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.auth.jwtAccessSecret, {
    issuer: 'midi-cosmetics-api',
    audience: 'midi-cosmetics-client',
  });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.auth.jwtRefreshSecret, {
    issuer: 'midi-cosmetics-api',
    audience: 'midi-cosmetics-client',
  });
