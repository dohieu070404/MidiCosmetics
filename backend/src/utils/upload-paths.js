import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

const normalizeRelativePath = (value) => String(value || 'uploads').replace(/^[/\\]+/, '').replace(/[/\\]+$/, '') || 'uploads';

export const getUploadDir = () => path.resolve(process.cwd(), normalizeRelativePath(env.upload.dir));

export const ensureUploadDir = () => {
  const uploadDir = getUploadDir();
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
};

export const buildLocalUploadPath = (filename) => `/uploads/${encodeURIComponent(filename)}`;

export const buildLocalUploadUrl = (filename) => {
  const relativeUrl = buildLocalUploadPath(filename);
  const base = String(env.upload.publicBaseUrl || '').trim().replace(/\/+$/, '');
  if (!base) return relativeUrl;
  if (base.endsWith('/uploads')) return `${base}/${encodeURIComponent(filename)}`;
  return `${base}${relativeUrl}`;
};

export const localUploadFilePath = (filename) => path.join(getUploadDir(), filename);
