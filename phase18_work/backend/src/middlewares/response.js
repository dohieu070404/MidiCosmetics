import { sendSuccess } from '../utils/api-response.js';

export const responseFormatter = (req, res, next) => {
  res.success = (payload = {}) => sendSuccess(res, payload);
  next();
};
