import prismaPackage from '@prisma/client';

const { Prisma } = prismaPackage;
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { HTTP_STATUS } from '../constants/http-status.js';
import { ApiError } from '../errors/api-error.js';
import { sendError } from '../utils/api-response.js';

const mapPrismaError = (error) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const fields = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'field';
      return ApiError.conflict(`Duplicate value for ${fields}`, [
        { field: fields, code: error.code, message: `Duplicate value for ${fields}` },
      ]);
    }

    if (error.code === 'P2025') {
      return ApiError.notFound('Resource not found', [
        { field: null, code: error.code, message: 'Record not found' },
      ]);
    }

    return new ApiError(HTTP_STATUS.BAD_REQUEST, 'Database request failed', [
      { field: null, code: error.code, message: env.isProduction ? 'Database request failed' : error.message },
    ]);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ApiError.badRequest('Invalid database query', [
      { field: null, code: 'PRISMA_VALIDATION_ERROR', message: env.isProduction ? 'Invalid database query' : error.message },
    ]);
  }

  return error;
};


const mapMulterError = (error) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return ApiError.payloadTooLarge('File quá dung lượng cho phép', [
        { field: 'file', code: error.code, message: 'File vượt quá dung lượng cho phép.' },
      ]);
    }

    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
      return ApiError.badRequest('Số lượng file tải lên không hợp lệ', [
        { field: 'file', code: error.code, message: 'Vui lòng kiểm tra lại số lượng file tải lên.' },
      ]);
    }

    return ApiError.badRequest('File tải lên không hợp lệ', [
      { field: 'file', code: error.code, message: error.message },
    ]);
  }

  return error;
};

const mapJwtError = (error) => {
  if (error instanceof jwt.TokenExpiredError) {
    return ApiError.unauthorized('Token expired', [
      { field: 'authorization', code: 'TOKEN_EXPIRED', message: 'Token expired' },
    ]);
  }

  if (error instanceof jwt.JsonWebTokenError) {
    return ApiError.unauthorized('Invalid token', [
      { field: 'authorization', code: 'INVALID_TOKEN', message: 'Invalid token' },
    ]);
  }

  return error;
};

const mapZodError = (error) => {
  if (!(error instanceof ZodError)) return error;

  return ApiError.unprocessable(
    'Validation failed',
    error.issues.map((issue) => ({
      field: issue.path.join('.') || null,
      code: issue.code,
      message: issue.message,
    }))
  );
};

export const errorHandler = (error, req, res, next) => {
  let normalizedError = mapMulterError(error);
  normalizedError = mapPrismaError(normalizedError);
  normalizedError = mapJwtError(normalizedError);
  normalizedError = mapZodError(normalizedError);

  const statusCode = normalizedError.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const isOperational = normalizedError instanceof ApiError && normalizedError.isOperational;
  const message = isOperational || env.isDevelopment ? normalizedError.message : 'Internal server error';
  const errors = Array.isArray(normalizedError.errors) ? normalizedError.errors : [];

  logger.error(
    {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      err: normalizedError,
    },
    'Request failed'
  );

  return sendError(res, {
    statusCode,
    message,
    errors: env.isDevelopment && errors.length === 0 && normalizedError.stack
      ? [{ field: null, code: 'STACK_TRACE', message: normalizedError.stack }]
      : errors,
  });
};
