import { ApiError } from '../errors/api-error.js';
import { hasPermission } from '../constants/roles.js';

export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }

  return next();
};

export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  if (!hasPermission(req.user.role, permission)) {
    return next(ApiError.forbidden(`Missing permission: ${permission}`));
  }

  return next();
};
