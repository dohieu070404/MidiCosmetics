import { apiClient } from '@/lib/http/api-client';
import { env } from '@/config/env';
import { PLACEHOLDER_IMAGE_URL } from '@/lib/media';

const q = (params = {}) => ({ params: Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)) });

export const publicApi = {
  home: () => apiClient.get('/home'),
  homepage: () => apiClient.get('/homepage'),
  taxonomies: () => apiClient.get('/taxonomies'),
  listBlogs: (params) => apiClient.get('/blogs', q(params)),
  getBlog: (slug) => apiClient.get(`/blogs/${slug}`),
  relatedBlogs: (slug) => apiClient.get(`/blogs/${slug}/related`),
  listProducts: (params) => apiClient.get('/products', q(params)),
  getProduct: (slug) => apiClient.get(`/products/${slug}`),
  relatedProducts: (slug) => apiClient.get(`/products/${slug}/related`),
};

export const mediaUrl = (url) => {
  if (!url) return PLACEHOLDER_IMAGE_URL;
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (env.API_BASE_URL.startsWith('/')) return url;
  return `${env.API_ORIGIN}${url}`;
};

const normalizeMoney = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  let raw = typeof value === 'object' && typeof value.toString === 'function' ? value.toString() : String(value);
  let normalized = raw.trim().replace(/\s/g, '');
  if (!normalized || normalized.toLowerCase() === 'nan') return null;

  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');
  if (lastComma !== -1 && lastDot !== -1) {
    normalized = lastComma > lastDot
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '');
  } else if (lastComma !== -1) {
    const parts = normalized.split(',');
    const last = parts.at(-1) || '';
    normalized = parts.length > 1 && last.length > 0 && last.length <= 2
      ? `${parts.slice(0, -1).join('')}.${last}`
      : normalized.replace(/,/g, '');
  } else if (lastDot !== -1) {
    const parts = normalized.split('.');
    const last = parts.at(-1) || '';
    normalized = parts.length > 2 || last.length === 3 ? normalized.replace(/\./g, '') : normalized;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
};

export const formatVnd = (value, currency = 'VND') => {
  const number = normalizeMoney(value);
  if (number === null) return 'Liên hệ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(number);
};
