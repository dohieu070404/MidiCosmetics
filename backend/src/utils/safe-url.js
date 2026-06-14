const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export const normalizeUrlInput = (value = '') =>
  String(value || '')
    .replace(CONTROL_CHARS, '')
    .trim();

export const isPrivateOrLocalHostname = (hostname) => {
  const normalized = String(hostname || '').trim().toLowerCase().replace(/[\[\]]/g, '');
  if (!normalized) return true;
  if (['localhost', 'localhost.localdomain'].includes(normalized)) return true;
  if (normalized.endsWith('.localhost')) return true;

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
    const parts = normalized.split('.').map((part) => Number(part));
    if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }

  if (normalized === '::1') return true;
  if (/^(fc|fd|fe80)/i.test(normalized)) return true;
  return false;
};

export const validateRemoteHttpUrl = (value, options = {}) => {
  const {
    allowPrivateHost = false,
    label = 'URL',
    allowedExtensions,
  } = options;

  const raw = normalizeUrlInput(value);
  if (!raw) return { ok: false, code: 'EMPTY_URL', message: `${label} rỗng` };

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, code: 'INVALID_URL', message: `${label} không hợp lệ: ${raw}` };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, code: 'UNSUPPORTED_URL_PROTOCOL', message: `${label} chỉ được bắt đầu bằng http:// hoặc https://` };
  }

  if (!allowPrivateHost && isPrivateOrLocalHostname(parsed.hostname)) {
    return { ok: false, code: 'UNSAFE_URL_HOST', message: `${label} không được trỏ tới localhost/private IP` };
  }

  if (allowedExtensions?.length) {
    const pathname = parsed.pathname.toLowerCase();
    if (!allowedExtensions.some((ext) => pathname.endsWith(ext))) {
      return { ok: false, code: 'UNSUPPORTED_URL_EXTENSION', message: `${label} không đúng định dạng ảnh được hỗ trợ` };
    }
  }

  return { ok: true, url: parsed.toString() };
};

export const validateRemoteImageUrl = (value) =>
  validateRemoteHttpUrl(value, {
    label: 'URL ảnh',
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  });

export const isSafeLocalUploadPath = (value) => {
  const raw = normalizeUrlInput(value);
  return /^\/uploads\/[a-zA-Z0-9._-]+$/.test(raw) && !raw.includes('..');
};
