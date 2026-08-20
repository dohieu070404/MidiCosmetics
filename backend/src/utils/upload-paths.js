import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { env } from '../config/env.js';

const SAFE_FILENAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}$/;
const isWithin = (parent, child) => child === parent || child.startsWith(`${parent}${path.sep}`);

const resolveConfiguredDir = (value, fallback) => {
  const raw = String(value || fallback).trim();
  const resolved = path.resolve(raw);
  const appRoot = path.resolve(process.cwd());
  const tempRoot = path.resolve(os.tmpdir());
  if (!isWithin(appRoot, resolved) && !isWithin(tempRoot, resolved)) {
    throw new Error('Upload directories must stay inside the application directory or the operating-system temp directory');
  }
  return resolved;
};

const safeFilePath = (directory, filename) => {
  const normalized = String(filename || '');
  if (!SAFE_FILENAME.test(normalized) || path.basename(normalized) !== normalized) {
    throw new Error('Unsafe upload filename');
  }
  return path.join(directory, normalized);
};

export const getUploadDir = () => resolveConfiguredDir(env.upload.dir, 'uploads');
export const getPrivateUploadDir = () => resolveConfiguredDir(env.upload.privateDir, '.private/imports');

export const ensureUploadDir = () => {
  const uploadDir = getUploadDir();
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
};

export const ensurePrivateUploadDir = () => {
  const uploadDir = getPrivateUploadDir();
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o700 });
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

export const localUploadFilePath = (filename) => safeFilePath(getUploadDir(), filename);
export const privateUploadFilePath = (filename) => safeFilePath(getPrivateUploadDir(), filename);
