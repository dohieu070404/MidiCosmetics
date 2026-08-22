import crypto from 'node:crypto';

import { env } from '../config/env.js';

const key = crypto
  .createHash('sha256')
  .update(`midi-quote-token\0${env.auth.jwtRefreshSecret}`)
  .digest();

export const encryptQuoteToken = (token) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(token), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    'v1',
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
};

export const decryptQuoteToken = (payload) => {
  if (!payload) return null;
  try {
    const [version, ivText, tagText, encryptedText] = String(payload).split('.');
    if (version !== 'v1' || !ivText || !tagText || !encryptedText) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivText, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedText, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return null;
  }
};
