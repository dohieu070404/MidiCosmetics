import { HTTP_STATUS } from '../constants/http-status.js';

export class ApiError extends Error {
  constructor(statusCode, message, errors = [], options = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = options.isOperational ?? true;
    this.code = options.code;

    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
  }

  static unauthorized(message = 'Unauthorized', errors = []) {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, errors);
  }

  static forbidden(message = 'Forbidden', errors = []) {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, errors);
  }

  static notFound(message = 'Resource not found', errors = []) {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, errors);
  }

  static conflict(message = 'Conflict', errors = []) {
    return new ApiError(HTTP_STATUS.CONFLICT, message, errors);
  }

  static unprocessable(message = 'Unprocessable entity', errors = []) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
  }

  static payloadTooLarge(message = 'Payload too large', errors = []) {
    return new ApiError(HTTP_STATUS.PAYLOAD_TOO_LARGE, message, errors);
  }
}
