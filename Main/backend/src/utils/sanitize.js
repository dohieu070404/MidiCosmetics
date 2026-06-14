import { isPrivateOrLocalHostname, isSafeLocalUploadPath } from './safe-url.js';

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const ALLOWED_TAGS = new Set(['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h2', 'h3', 'blockquote', 'a', 'img']);
const SELF_CLOSING_TAGS = new Set(['br', 'img']);
const BLOCKED_CONTENT_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link', 'base', 'svg', 'math'];

const escapeAttribute = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const decodeBasicEntities = (value = '') =>
  String(value)
    .replace(/&colon;/gi, ':')
    .replace(/&#58;/gi, ':')
    .replace(/&#x3a;/gi, ':')
    .replace(/&sol;/gi, '/')
    .replace(/&#47;/gi, '/')
    .replace(/&#x2f;/gi, '/');

const normalizeUrl = (value = '') => decodeBasicEntities(value).replace(CONTROL_CHARS, '').trim();

const isSafeAnchorHref = (href = '') => {
  const normalized = normalizeUrl(href);
  return normalized.startsWith('http://') || normalized.startsWith('https://') || (normalized.startsWith('/') && !normalized.startsWith('//') && !normalized.includes('..'));
};

const isSafeImageSrc = (src = '') => {
  const normalized = normalizeUrl(src);
  if (isSafeLocalUploadPath(normalized)) return true;
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) return false;
  try {
    const parsed = new URL(normalized);
    return !isPrivateOrLocalHostname(parsed.hostname);
  } catch {
    return false;
  }
};

const getAttribute = (raw = '', name) => {
  const pattern = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = raw.match(pattern);
  return match ? (match[2] ?? match[3] ?? match[4] ?? '') : '';
};

const sanitizeAllowedTag = (rawTag = '') => {
  const tagMatch = rawTag.match(/^<\s*(\/)?\s*([a-z0-9:-]+)([\s\S]*?)(\/)?\s*>$/i);
  if (!tagMatch) return '';

  const isClosing = Boolean(tagMatch[1]);
  const tagName = tagMatch[2].toLowerCase();
  const attrs = tagMatch[3] || '';

  if (!ALLOWED_TAGS.has(tagName)) return '';
  if (isClosing) return SELF_CLOSING_TAGS.has(tagName) ? '' : `</${tagName}>`;
  if (tagName === 'br') return '<br>';

  if (tagName === 'a') {
    const href = normalizeUrl(getAttribute(attrs, 'href'));
    const title = getAttribute(attrs, 'title');
    const target = getAttribute(attrs, 'target');
    const safeHref = isSafeAnchorHref(href) ? ` href="${escapeAttribute(href)}" rel="noopener noreferrer"` : '';
    const safeTarget = target === '_blank' ? ' target="_blank"' : '';
    const safeTitle = title ? ` title="${escapeAttribute(title).slice(0, 255)}"` : '';
    return `<a${safeHref}${safeTarget}${safeTitle}>`;
  }

  if (tagName === 'img') {
    const src = normalizeUrl(getAttribute(attrs, 'src'));
    if (!isSafeImageSrc(src)) return '';
    const alt = getAttribute(attrs, 'alt');
    return `<img src="${escapeAttribute(src)}"${alt ? ` alt="${escapeAttribute(alt).slice(0, 255)}"` : ''}>`;
  }

  return `<${tagName}>`;
};

export const stripDangerousText = (value = '') =>
  String(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(CONTROL_CHARS, '')
    .trim();

export const normalizePlainText = (value = '', max = 5000) => stripDangerousText(value).slice(0, max);

export const looksLikeSpam = (value = '') => {
  const text = String(value).toLowerCase();
  const urlCount = (text.match(/https?:\/\//g) || []).length + (text.match(/www\./g) || []).length;
  const blocked = ['casino', 'betting', 'viagra', 'crypto pump', 'telegram @'];
  return urlCount > 1 || blocked.some((word) => text.includes(word)) || /(.)\1{12,}/.test(text);
};

export const sanitizeRichHtml = (value = '', max = 200000) => {
  let html = String(value || '').slice(0, max).replace(CONTROL_CHARS, '');

  for (const tag of BLOCKED_CONTENT_TAGS) {
    html = html.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
    html = html.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi'), '');
  }

  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/<[^>]*>/g, (rawTag) => sanitizeAllowedTag(rawTag));

  return html.trim();
};
