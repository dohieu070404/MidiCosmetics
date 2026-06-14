import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../errors/api-error.js';
import { ensureUploadDir } from '../utils/upload-paths.js';

const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const allowedExcelMimeTypes = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/octet-stream',
]);
const allowedExcelExtensions = new Set(['.xlsx']);

const sanitizeExtension = (filename = '') => path.extname(filename).toLowerCase();

const diskStorage = multer.diskStorage({
  destination(req, file, callback) {
    try {
      callback(null, ensureUploadDir());
    } catch (error) {
      callback(error);
    }
  },
  filename(req, file, callback) {
    const extension = sanitizeExtension(file.originalname);
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

// Cloudinary production uploads should not depend on a writable local /uploads folder.
// Multer memory storage keeps the image in memory and admin.service streams it to Cloudinary.
const imageStorage = env.upload.driver === 'cloudinary' ? multer.memoryStorage() : diskStorage;
const excelStorage = diskStorage;

const buildFileFilter = ({ allowedTypes, allowedExtensions, label }) => (req, file, callback) => {
  const extension = sanitizeExtension(file.originalname || '');
  if (!allowedTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
    return callback(ApiError.badRequest(`File ${label} không đúng định dạng. Chỉ hỗ trợ ${Array.from(allowedExtensions).join(', ')}.`));
  }

  return callback(null, true);
};

const readBytesFromPath = async (filePath, length = 16) => {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
};

const readBytes = async (file, length = 16) => {
  if (file?.buffer) return file.buffer.subarray(0, Math.min(file.buffer.length, length));
  return readBytesFromPath(file.path, length);
};

const isJpeg = (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
const isPng = (bytes) => bytes.length >= 8 && bytes.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const isWebp = (bytes) => bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
const isXlsxZip = (bytes) => bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03, 0x05, 0x07].includes(bytes[2]);

const removeRejectedFile = async (file) => {
  if (file?.path) await fs.unlink(file.path).catch(() => null);
};

export const validateUploadedImageFile = async (req, res, next) => {
  try {
    if (!req.file) return next();
    const bytes = await readBytes(req.file, 16);
    if (!isJpeg(bytes) && !isPng(bytes) && !isWebp(bytes)) {
      await removeRejectedFile(req.file);
      return next(ApiError.badRequest('Nội dung file không phải ảnh jpg, png hoặc webp hợp lệ'));
    }
    return next();
  } catch (error) {
    await removeRejectedFile(req.file);
    return next(error);
  }
};

export const validateUploadedXlsxFile = async (req, res, next) => {
  try {
    if (!req.file) return next();
    const bytes = await readBytes(req.file, 8);
    if (!isXlsxZip(bytes)) {
      await removeRejectedFile(req.file);
      return next(ApiError.badRequest('File import phải là .xlsx chuẩn, không chấp nhận CSV/XLS đổi đuôi'));
    }
    return next();
  } catch (error) {
    await removeRejectedFile(req.file);
    return next(error);
  }
};

export const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: env.upload.imageMaxFileSizeMb * 1024 * 1024,
    files: 10,
  },
  fileFilter: buildFileFilter({ allowedTypes: allowedImageMimeTypes, allowedExtensions: allowedImageExtensions, label: 'ảnh' }),
});

export const excelUpload = multer({
  storage: excelStorage,
  limits: {
    fileSize: env.upload.spreadsheetMaxFileSizeMb * 1024 * 1024,
    files: 1,
  },
  fileFilter: buildFileFilter({ allowedTypes: allowedExcelMimeTypes, allowedExtensions: allowedExcelExtensions, label: 'Excel .xlsx' }),
});
