import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { env } from '../config/env.js';

const normalizeRelativePath = (value) => String(value || 'uploads').replace(/^[/\\]+/, '').replace(/[/\\]+$/, '') || 'uploads';

const isVercelRuntime = () => process.env.VERCEL === '1' || Boolean(process.env.VERCEL_REGION);

export const getUploadDir = () => {
  const relativeDir = normalizeRelativePath(env.upload.dir);

  // Vercel Functions only allow durable writes in external storage. Temporary files
  // used during one request, such as Excel parsing, must be written under /tmp.
  if (isVercelRuntime()) return path.join(os.tmpdir(), relativeDir);

  return path.resolve(process.cwd(), relativeDir);
};

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
