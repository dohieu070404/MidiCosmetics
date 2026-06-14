import { toSafeJson } from './safe-json.js';

export const sendSuccess = (res, { statusCode = 200, message = 'Success', data = {}, meta = {} } = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: toSafeJson(data),
    meta: toSafeJson(meta),
  });
};

export const sendError = (res, { statusCode = 500, message = 'Internal server error', errors = [] } = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: toSafeJson(errors),
  });
};
