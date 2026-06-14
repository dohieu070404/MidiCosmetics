import { HTTP_STATUS } from '../../constants/http-status.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { authService } from './auth.service.js';

const getIpAddress = (req) => req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || null;
const refreshCookieName = 'midi_refresh_token';
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const setRefreshCookie = (res, token) => res.cookie(refreshCookieName, token, refreshCookieOptions);
const clearRefreshCookie = (res) => res.clearCookie(refreshCookieName, { ...refreshCookieOptions, maxAge: undefined });
const readRefreshToken = (req) => req.validated?.body?.refreshToken || req.cookies?.[refreshCookieName];
const stripRefreshToken = (result) => ({
  ...result,
  tokens: {
    accessToken: result.tokens.accessToken,
    tokenType: result.tokens.tokenType,
  },
});

export const authController = {
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.validated.body;
    const result = await authService.login({
      email,
      password,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: getIpAddress(req),
    });
    setRefreshCookie(res, result.tokens.refreshToken);
    return res.success({ statusCode: HTTP_STATUS.OK, message: 'Login successful', data: stripRefreshToken(result) });
  }),

  refresh: asyncHandler(async (req, res) => {
    const refreshToken = readRefreshToken(req);
    const result = await authService.refresh({ refreshToken, userAgent: req.headers['user-agent'] || null, ipAddress: getIpAddress(req) });
    setRefreshCookie(res, result.tokens.refreshToken);
    return res.success({ statusCode: HTTP_STATUS.OK, message: 'Token refreshed successfully', data: stripRefreshToken(result) });
  }),

  logout: asyncHandler(async (req, res) => {
    const refreshToken = readRefreshToken(req);
    if (refreshToken) await authService.logout({ refreshToken });
    clearRefreshCookie(res);
    return res.success({ statusCode: HTTP_STATUS.OK, message: 'Logout successful', data: {} });
  }),

  registerDisabled: asyncHandler(async (req, res) => res.status(403).json({ success: false, message: 'Public registration is disabled', errors: [{ field: null, code: 'REGISTRATION_DISABLED', message: 'This project only uses one shop admin account configured by environment variables' }] })),

  me: asyncHandler(async (req, res) => res.success({ statusCode: HTTP_STATUS.OK, message: 'Authenticated user fetched successfully', data: { user: req.user } })),
};
