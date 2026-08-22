import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../errors/api-error.js';
import { ensurePrivateUploadDir, ensureUploadDir } from '../utils/upload-paths.js';

const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const allowedExcelMimeTypes = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/octet-stream',
]);
const allowedExcelExtensions = new Set(['.xlsx']);

const sanitizeExtension = (filename = '') => path.extname(filename).toLowerCase();

const buildStorage = (resolveDestination) =>
  multer.diskStorage({
    destination(req, file, callback) {
      try {
        callback(null, resolveDestination());
      } catch (error) {
        callback(error);
      }
    },
    filename(req, file, callback) {
      const extension = sanitizeExtension(file.originalname);
      callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    },
  });

const imageStorage = buildStorage(ensureUploadDir);
const spreadsheetStorage = buildStorage(ensurePrivateUploadDir);

const buildFileFilter =
  ({ allowedTypes, allowedExtensions, label }) =>
  (req, file, callback) => {
    const extension = sanitizeExtension(file.originalname || '');
    if (!allowedTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return callback(
        ApiError.badRequest(
          `File ${label} không đúng định dạng. Chỉ hỗ trợ ${Array.from(allowedExtensions).join(', ')}.`,
        ),
      );
    }

    return callback(null, true);
  };

const readBytes = async (filePath, length = 16) => {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
};

const isJpeg = (bytes) =>
  bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
const isPng = (bytes) =>
  bytes.length >= 8 &&
  bytes.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const isWebp = (bytes) =>
  bytes.length >= 12 &&
  bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
  bytes.subarray(8, 12).toString('ascii') === 'WEBP';
const isXlsxZip = (bytes) =>
  bytes.length >= 4 &&
  bytes[0] === 0x50 &&
  bytes[1] === 0x4b &&
  [0x03, 0x05, 0x07].includes(bytes[2]);

const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_SIGNATURE = 0x02014b50;
const MAX_XLSX_UNCOMPRESSED_BYTES = 80 * 1024 * 1024;
const MAX_XLSX_ENTRIES = 2000;

const findEndOfCentralDirectory = (buffer) => {
  const start = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= start; offset -= 1) {
    if (buffer.readUInt32LE(offset) === ZIP_EOCD_SIGNATURE) return offset;
  }
  return -1;
};

const validateXlsxArchiveStructure = (buffer) => {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset < 0) return false;

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralSize = buffer.readUInt32LE(eocdOffset + 12);
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  if (!entryCount || entryCount > MAX_XLSX_ENTRIES || entryCount === 0xffff) return false;
  if (centralOffset + centralSize > eocdOffset || centralOffset >= buffer.length) return false;

  let offset = centralOffset;
  let totalCompressed = 0;
  let totalUncompressed = 0;
  let hasContentTypes = false;
  let hasWorkbook = false;

  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== ZIP_CENTRAL_SIGNATURE)
      return false;
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const filenameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) return false;
    const end = offset + 46 + filenameLength + extraLength + commentLength;
    if (end > buffer.length) return false;
    const filename = buffer
      .subarray(offset + 46, offset + 46 + filenameLength)
      .toString('utf8')
      .replace(/\\/g, '/');
    if (filename.startsWith('/') || filename.split('/').includes('..')) return false;
    hasContentTypes ||= filename === '[Content_Types].xml';
    hasWorkbook ||= filename === 'xl/workbook.xml';
    totalCompressed += compressedSize;
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_XLSX_UNCOMPRESSED_BYTES) return false;
    offset = end;
  }

  if (!hasContentTypes || !hasWorkbook) return false;
  if (totalCompressed > 0 && totalUncompressed / totalCompressed > 200) return false;
  return true;
};

const removeRejectedFile = async (file) => {
  if (file?.path) await fs.unlink(file.path).catch(() => null);
};

export const validateUploadedImageFile = async (req, res, next) => {
  try {
    if (!req.file) return next();
    const bytes = await readBytes(req.file.path, 16);
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
    const bytes = await readBytes(req.file.path, 8);
    const archive = isXlsxZip(bytes) ? await fs.readFile(req.file.path) : null;
    if (!archive || !validateXlsxArchiveStructure(archive)) {
      await removeRejectedFile(req.file);
      return next(
        ApiError.badRequest(
          'File import phải là .xlsx hợp lệ, không vượt giới hạn giải nén và không chấp nhận CSV/XLS đổi đuôi',
        ),
      );
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
  fileFilter: buildFileFilter({
    allowedTypes: allowedImageMimeTypes,
    allowedExtensions: allowedImageExtensions,
    label: 'ảnh',
  }),
});

export const excelUpload = multer({
  storage: spreadsheetStorage,
  limits: {
    fileSize: env.upload.spreadsheetMaxFileSizeMb * 1024 * 1024,
    files: 1,
  },
  fileFilter: buildFileFilter({
    allowedTypes: allowedExcelMimeTypes,
    allowedExtensions: allowedExcelExtensions,
    label: 'Excel .xlsx',
  }),
});
