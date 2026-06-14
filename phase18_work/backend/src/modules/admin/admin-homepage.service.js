import { prisma } from '../../prisma/client.js';
import { ApiError } from '../../errors/api-error.js';
import { normalizePlainText } from '../../utils/sanitize.js';
import { validateRemoteImageUrl } from '../../utils/safe-url.js';

const HOMEPAGE_SETTING_KEY = 'homepage.sections';
const HOMEPAGE_SETTING_GROUP = 'homepage';
const HOMEPAGE_SECTION_TYPES = new Set([
  'HERO',
  'FEATURED_PRODUCTS',
  'FEATURED_POSTS',
  'FEATURED_CATEGORIES',
  'BRAND_INTRO',
  'CUSTOM_TEXT',
]);

const FEATURED_LIMIT = 12;
const DEFAULT_HERO_SUBTITLE = 'MIdiCosmetics mỹ phẩm & nước hoa chính hãng';
const LEGACY_HERO_SUBTITLES = new Set([
  'Midi Cosmetics tuyển chọn sản phẩm làm đẹp thanh lịch, dễ dùng mỗi ngày.',
]);
const DEFAULT_SECTIONS = Object.freeze([
  {
    id: 'hero',
    type: 'HERO',
    title: 'Vẻ đẹp tối giản, tinh tế và dễ chạm vào mỗi ngày.',
    subtitle: DEFAULT_HERO_SUBTITLE,
    isEnabled: true,
    sortOrder: 10,
    config: {
      eyebrow: '',
      imageUrl: '',
      ctaLabel: 'Xem sản phẩm',
      ctaHref: '/products',
      secondaryLabel: 'Đọc blog',
      secondaryHref: '/blog',
    },
  },
  {
    id: 'featured-products',
    type: 'FEATURED_PRODUCTS',
    title: 'Sản phẩm nổi bật',
    subtitle: 'Những sản phẩm được chọn lọc cho routine hằng ngày.',
    isEnabled: true,
    sortOrder: 20,
    config: { limit: 8 },
  },
  {
    id: 'featured-posts',
    type: 'FEATURED_POSTS',
    title: 'Bài viết nổi bật',
    subtitle: 'Cảm hứng chăm sóc da và làm đẹp.',
    isEnabled: true,
    sortOrder: 30,
    config: { limit: 6 },
  },
  {
    id: 'featured-categories',
    type: 'FEATURED_CATEGORIES',
    title: 'Danh mục nổi bật',
    subtitle: 'Khám phá sản phẩm theo nhu cầu chăm sóc da.',
    isEnabled: true,
    sortOrder: 40,
    config: { limit: 8 },
  },
  {
    id: 'brand-intro',
    type: 'BRAND_INTRO',
    title: 'Midi Cosmetics',
    subtitle: 'Một không gian mỹ phẩm nhẹ nhàng, tối giản và dễ dùng cho mỗi ngày.',
    isEnabled: true,
    sortOrder: 50,
    config: {
      body: 'Chúng tôi chọn lọc sản phẩm theo tinh thần thanh lịch, dễ hiểu và phù hợp với nhịp sống hiện đại.',
      imageUrl: '',
    },
  },
  {
    id: 'custom-text',
    type: 'CUSTOM_TEXT',
    title: 'Thông điệp từ Midi',
    subtitle: '',
    isEnabled: false,
    sortOrder: 60,
    config: { body: '' },
  },
]);

const safeText = (value, max = 500) => normalizePlainText(value ?? '', max).replace(/[<>]/g, '').trim();

const safeHref = (value, fallback = '') => {
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  if (/^\/(products|blog|about)(\/[-a-zA-Z0-9_/?=&]*)?$/.test(text)) return text;
  return fallback;
};

const safeImageUrl = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (/^\/uploads\/[a-zA-Z0-9._-]+$/.test(text) && !text.includes('..')) return text;
  const validation = validateRemoteImageUrl(text);
  return validation.ok ? validation.url : '';
};

const safeLimit = (value, fallback = 6) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) return fallback;
  return Math.min(FEATURED_LIMIT, Math.max(1, number));
};

const sanitizeConfig = (type, config = {}) => {
  const source = config && typeof config === 'object' && !Array.isArray(config) ? config : {};
  if (type === 'HERO') {
    return {
      eyebrow: safeText(source.eyebrow, 80),
      imageUrl: safeImageUrl(source.imageUrl),
      ctaLabel: safeText(source.ctaLabel, 60) || 'Xem sản phẩm',
      ctaHref: safeHref(source.ctaHref, '/products'),
      secondaryLabel: safeText(source.secondaryLabel, 60) || 'Đọc blog',
      secondaryHref: safeHref(source.secondaryHref, '/blog'),
    };
  }
  if (type === 'FEATURED_PRODUCTS') return { limit: safeLimit(source.limit, 8) };
  if (type === 'FEATURED_POSTS') return { limit: safeLimit(source.limit, 6) };
  if (type === 'FEATURED_CATEGORIES') return { limit: safeLimit(source.limit, 8) };
  if (type === 'BRAND_INTRO') return { body: safeText(source.body, 1500), imageUrl: safeImageUrl(source.imageUrl) };
  if (type === 'CUSTOM_TEXT') return { body: safeText(source.body, 2000) };
  return {};
};

const normalizeSection = (section, fallback = null, index = 0) => {
  const base = fallback || DEFAULT_SECTIONS[index] || {};
  const type = HOMEPAGE_SECTION_TYPES.has(section?.type) ? section.type : base.type;
  if (!type) throw ApiError.badRequest('Homepage section type is invalid');

  const normalizedSubtitle = safeText(section?.subtitle ?? base.subtitle, 500);
  return {
    id: String(section?.id || base.id || type.toLowerCase()).trim(),
    type,
    title: safeText(section?.title ?? base.title, 180),
    subtitle: type === 'HERO' && LEGACY_HERO_SUBTITLES.has(normalizedSubtitle) ? DEFAULT_HERO_SUBTITLE : normalizedSubtitle,
    isEnabled: typeof section?.isEnabled === 'boolean' ? section.isEnabled : Boolean(base.isEnabled),
    sortOrder: Number.isSafeInteger(Number(section?.sortOrder)) ? Math.max(0, Number(section.sortOrder)) : Number(base.sortOrder || index * 10),
    config: sanitizeConfig(type, section?.config ?? base.config),
  };
};

const normalizeSections = (sections) => {
  const byId = new Map(Array.isArray(sections) ? sections.map((section) => [section?.id, section]) : []);
  const normalized = DEFAULT_SECTIONS.map((fallback, index) => normalizeSection({ ...fallback, ...(byId.get(fallback.id) || {}) }, fallback, index));
  return normalized.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
};

const loadSections = async () => {
  const setting = await prisma.siteSetting.findUnique({ where: { key: HOMEPAGE_SETTING_KEY } });
  if (!setting) return normalizeSections(DEFAULT_SECTIONS);
  return normalizeSections(setting.value);
};

const saveSections = async (sections) => {
  const normalized = normalizeSections(sections);
  await prisma.siteSetting.upsert({
    where: { key: HOMEPAGE_SETTING_KEY },
    update: { value: normalized, type: 'JSON', group: HOMEPAGE_SETTING_GROUP, isPublic: true, description: 'Homepage section configuration' },
    create: { key: HOMEPAGE_SETTING_KEY, value: normalized, type: 'JSON', group: HOMEPAGE_SETTING_GROUP, isPublic: true, description: 'Homepage section configuration' },
  });
  return normalized;
};

const getSectionOrThrow = (sections, sectionId) => {
  const found = sections.find((section) => section.id === sectionId);
  if (!found) throw ApiError.notFound('Homepage section not found');
  return found;
};

const productInclude = {
  category: { select: { uuid: true, name: true, slug: true } },
  brand: { select: { uuid: true, name: true, slug: true } },
  images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], include: { mediaAsset: { select: { uuid: true, secureUrl: true, altText: true } } } },
};

const postInclude = {
  category: { select: { uuid: true, name: true, slug: true } },
  featuredImage: { select: { uuid: true, secureUrl: true, altText: true } },
};

export const adminHomepageService = {
  async getHomepageSettings() {
    return { sections: await loadSections() };
  },

  async updateSection(sectionId, body) {
    const sections = await loadSections();
    const current = getSectionOrThrow(sections, sectionId);
    const next = normalizeSection({ ...current, ...body, id: current.id, type: current.type }, current);
    const saved = await saveSections(sections.map((section) => (section.id === sectionId ? next : section)));
    return getSectionOrThrow(saved, sectionId);
  },

  async toggleSection(sectionId, body = {}) {
    const sections = await loadSections();
    const current = getSectionOrThrow(sections, sectionId);
    const nextEnabled = typeof body.isEnabled === 'boolean' ? body.isEnabled : !current.isEnabled;
    const saved = await saveSections(sections.map((section) => (section.id === sectionId ? { ...section, isEnabled: nextEnabled } : section)));
    return getSectionOrThrow(saved, sectionId);
  },

  async reorderSections(body) {
    const sections = await loadSections();
    const orderMap = new Map((body.sections || []).map((item) => [item.id, item.sortOrder]));
    const saved = await saveSections(sections.map((section) => ({ ...section, sortOrder: orderMap.has(section.id) ? Number(orderMap.get(section.id)) : section.sortOrder })));
    return saved;
  },

  async addFeaturedItem(sectionId, body) {
    const sections = await loadSections();
    const section = getSectionOrThrow(sections, sectionId);
    const order = Number.isSafeInteger(Number(body.sortOrder)) ? Math.max(0, Number(body.sortOrder)) : 0;

    if (section.type === 'FEATURED_PRODUCTS' && body.entityType === 'PRODUCT') {
      const product = await prisma.product.findFirst({ where: { uuid: body.entityUuid, deletedAt: null }, include: productInclude });
      if (!product) throw ApiError.notFound('Product not found');
      return prisma.product.update({ where: { id: product.id }, data: { isFeatured: true, featuredOrder: order }, include: productInclude });
    }

    if (section.type === 'FEATURED_POSTS' && body.entityType === 'POST') {
      const post = await prisma.blogPost.findFirst({ where: { uuid: body.entityUuid, deletedAt: null }, include: postInclude });
      if (!post) throw ApiError.notFound('Blog post not found');
      return prisma.blogPost.update({ where: { id: post.id }, data: { isFeatured: true, featuredOrder: order }, include: postInclude });
    }

    throw ApiError.badRequest('Section does not support this featured item type');
  },

  async removeFeaturedItem(sectionId, itemId) {
    const sections = await loadSections();
    const section = getSectionOrThrow(sections, sectionId);

    if (section.type === 'FEATURED_PRODUCTS') {
      const product = await prisma.product.findFirst({ where: { uuid: itemId, deletedAt: null }, include: productInclude });
      if (!product) throw ApiError.notFound('Product not found');
      return prisma.product.update({ where: { id: product.id }, data: { isFeatured: false }, include: productInclude });
    }

    if (section.type === 'FEATURED_POSTS') {
      const post = await prisma.blogPost.findFirst({ where: { uuid: itemId, deletedAt: null }, include: postInclude });
      if (!post) throw ApiError.notFound('Blog post not found');
      return prisma.blogPost.update({ where: { id: post.id }, data: { isFeatured: false }, include: postInclude });
    }

    throw ApiError.badRequest('Section does not support featured items');
  },

  async reorderFeaturedItems(sectionId, body) {
    const sections = await loadSections();
    const section = getSectionOrThrow(sections, sectionId);
    const items = body.items || [];

    if (section.type === 'FEATURED_PRODUCTS') {
      await prisma.$transaction(items.map((item) => prisma.product.updateMany({ where: { uuid: item.entityUuid, deletedAt: null }, data: { featuredOrder: Number(item.sortOrder) } })));
      return true;
    }
    if (section.type === 'FEATURED_POSTS') {
      await prisma.$transaction(items.map((item) => prisma.blogPost.updateMany({ where: { uuid: item.entityUuid, deletedAt: null }, data: { featuredOrder: Number(item.sortOrder) } })));
      return true;
    }
    throw ApiError.badRequest('Section does not support item reorder');
  },
};

export const homepageSectionDefaults = DEFAULT_SECTIONS;
export const loadHomepageSections = loadSections;
