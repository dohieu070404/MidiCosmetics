import { prisma } from '../../prisma/client.js';
import { ApiError } from '../../errors/api-error.js';
import { normalizePlainText } from '../../utils/sanitize.js';
import { validateRemoteImageUrl } from '../../utils/safe-url.js';

const HOMEPAGE_SETTING_KEY = 'homepage.sections';
const HOMEPAGE_BACKUP_SETTING_KEY = 'homepage.sections.backup';
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
const DEFAULT_HERO_SLIDES = Object.freeze([
  Object.freeze({
    id: 'skincare',
    kicker: 'Nghi thức phục hồi · 01',
    title: 'Chăm sóc da',
    subtitle: 'Công thức tinh giản cho làn da khỏe và ổn định mỗi ngày.',
    imageUrl: '/images/editorial/hero-skincare-2026.webp',
    href: '/products?group=skincare',
    mobilePosition: '68% center',
  }),
  Object.freeze({
    id: 'makeup',
    kicker: 'Sắc độ mới · 02',
    title: 'Trang điểm',
    subtitle: 'Màu sắc tôn làn da châu Á, tự nhiên từ sáng đến tối.',
    imageUrl: '/images/editorial/hero-makeup-2026.webp',
    href: '/products?group=makeup',
    mobilePosition: '65% center',
  }),
  Object.freeze({
    id: 'body-hair',
    kicker: 'Chăm sóc toàn thân · 03',
    title: 'Cơ thể & tóc',
    subtitle: 'Những nghi thức dịu nhẹ cho cơ thể, da đầu và mái tóc.',
    imageUrl: '/images/editorial/hero-body-hair-2026.webp',
    href: '/products?group=body-hair',
    mobilePosition: '69% center',
  }),
  Object.freeze({
    id: 'fragrance',
    kicker: 'Dấu ấn hương thơm · 04',
    title: 'Nước hoa',
    subtitle: 'Tìm tầng hương khiến bạn nhận ra chính mình.',
    imageUrl: '/images/editorial/editorial-perfume-2026.webp',
    href: '/products?group=fragrance',
    mobilePosition: '39% center',
  }),
]);
const DEFAULT_SECTIONS = Object.freeze([
  {
    id: 'hero',
    type: 'HERO',
    title: 'Chăm sóc da',
    subtitle: 'Công thức tinh giản cho làn da khỏe và ổn định mỗi ngày.',
    isEnabled: true,
    sortOrder: 10,
    config: {
      eyebrow: '',
      imageUrl: '',
      ctaLabel: 'Xem sản phẩm',
      ctaHref: '/products',
      secondaryLabel: 'Đọc blog',
      secondaryHref: '/blog',
      slides: DEFAULT_HERO_SLIDES,
    },
  },
  {
    id: 'brand-intro',
    type: 'BRAND_INTRO',
    title: 'Không cần quá nhiều. Chỉ cần đúng với làn da.',
    subtitle:
      'Chúng tôi chọn từng công thức dựa trên hiệu quả, cảm giác sử dụng và sự phù hợp với khí hậu Việt Nam—để mỗi bước chăm sóc đều đáng giá.',
    isEnabled: false,
    sortOrder: 900,
    config: {
      eyebrow: 'Tuyển chọn bởi Midi Cosmetics',
      body: '',
      imageUrl: '',
      ctaLabel: 'Tìm sản phẩm dành cho bạn',
      ctaHref: '/products',
    },
  },
  {
    id: 'featured-products',
    type: 'FEATURED_PRODUCTS',
    title: 'Những món bạn sẽ muốn dùng mỗi ngày.',
    subtitle: 'Các sản phẩm MIDI đang tuyển chọn và được khách hàng quan tâm.',
    isEnabled: true,
    sortOrder: 20,
    config: { eyebrow: 'Được quan tâm', limit: 8 },
  },
  {
    id: 'custom-text',
    type: 'CUSTOM_TEXT',
    title: 'Hương thơm là cách ký ức ở lại.',
    subtitle:
      'Từ hương sạch ban ngày đến những tầng hổ phách sâu hơn khi đêm xuống—hãy chọn mùi hương khiến bạn nhận ra chính mình.',
    isEnabled: true,
    sortOrder: 30,
    config: {
      eyebrow: 'Tạp chí Midi · Nghệ thuật mùi hương',
      body: '',
      imageUrl: '/images/editorial/editorial-perfume-2026.webp',
      ctaLabel: 'Khám phá nước hoa',
      ctaHref: '/products?group=fragrance',
    },
  },
  {
    id: 'skincare-editorial',
    type: 'CUSTOM_TEXT',
    title: 'Làn da đẹp bắt đầu từ một nhịp chăm sóc vừa đủ.',
    subtitle:
      'Từ làm sạch dịu nhẹ đến phục hồi hàng rào bảo vệ—hãy xây một chu trình phù hợp với làn da và khí hậu Việt Nam.',
    isEnabled: true,
    sortOrder: 40,
    config: {
      eyebrow: 'Nghi thức chăm da · Dùng đúng, đủ và đều',
      body: '',
      imageUrl: '/images/editorial/editorial-skincare-2026.webp',
      ctaLabel: 'Khám phá chăm sóc da',
      ctaHref: '/products?group=skincare',
    },
  },
  {
    id: 'featured-posts',
    type: 'FEATURED_POSTS',
    title: 'Đọc chậm, chọn kỹ.',
    subtitle: 'Cảm hứng chăm sóc da, trang điểm và nghệ thuật mùi hương.',
    isEnabled: true,
    sortOrder: 50,
    config: { eyebrow: 'Tạp chí Midi', limit: 3 },
  },
  {
    id: 'featured-categories',
    type: 'FEATURED_CATEGORIES',
    title: 'Danh mục nổi bật',
    subtitle: 'Khám phá sản phẩm theo nhu cầu chăm sóc da.',
    isEnabled: false,
    sortOrder: 1000,
    config: { limit: 8 },
  },
]);

const safeText = (value, max = 500) =>
  normalizePlainText(value ?? '', max)
    .replace(/[<>]/g, '')
    .trim();

const safeHref = (value, fallback = '') => {
  const text = String(value ?? '').trim();
  if (!text) return fallback;
  if (/^\/(?:products|blog|about)(?:\/[-a-zA-Z0-9_/?=&]*|\?[-a-zA-Z0-9_=&-]+)?$/.test(text))
    return text;
  return fallback;
};

const safeImageUrl = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (
    /^\/(?:uploads|images|brand)\/[a-zA-Z0-9._/-]+$/.test(text) &&
    !text.includes('..') &&
    !text.includes('//')
  )
    return text;
  const validation = validateRemoteImageUrl(text);
  return validation.ok ? validation.url : '';
};

const safeMobilePosition = (value, fallback = 'center center') => {
  const text = String(value ?? '')
    .trim()
    .toLowerCase();
  if (/^(?:(?:left|center|right|\d{1,3}%)(?:\s+(?:top|center|bottom|\d{1,3}%))?)$/.test(text))
    return text;
  return fallback;
};

const safeLimit = (value, fallback = 6) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) return fallback;
  return Math.min(FEATURED_LIMIT, Math.max(1, number));
};

const sanitizeHeroSlides = (slides) => {
  const source = Array.isArray(slides) ? slides : [];
  return DEFAULT_HERO_SLIDES.map((fallback, index) => {
    const candidate = source.find((item) => item?.id === fallback.id) || source[index] || {};
    return {
      id: fallback.id,
      kicker: safeText(candidate.kicker, 80) || fallback.kicker,
      title: safeText(candidate.title, 100) || fallback.title,
      subtitle: safeText(candidate.subtitle, 300) || fallback.subtitle,
      imageUrl: safeImageUrl(candidate.imageUrl) || fallback.imageUrl,
      href: safeHref(candidate.href, fallback.href),
      mobilePosition: safeMobilePosition(candidate.mobilePosition, fallback.mobilePosition),
    };
  });
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
      slides: sanitizeHeroSlides(source.slides),
    };
  }
  if (type === 'FEATURED_PRODUCTS')
    return { eyebrow: safeText(source.eyebrow, 80), limit: safeLimit(source.limit, 8) };
  if (type === 'FEATURED_POSTS')
    return { eyebrow: safeText(source.eyebrow, 80), limit: safeLimit(source.limit, 3) };
  if (type === 'FEATURED_CATEGORIES') return { limit: safeLimit(source.limit, 8) };
  if (type === 'BRAND_INTRO')
    return {
      eyebrow: safeText(source.eyebrow, 80),
      body: safeText(source.body, 1500),
      imageUrl: safeImageUrl(source.imageUrl),
      ctaLabel: safeText(source.ctaLabel, 60) || 'Tìm sản phẩm dành cho bạn',
      ctaHref: safeHref(source.ctaHref, '/products'),
    };
  if (type === 'CUSTOM_TEXT')
    return {
      eyebrow: safeText(source.eyebrow, 80),
      body: safeText(source.body, 2000),
      imageUrl: safeImageUrl(source.imageUrl),
      ctaLabel: safeText(source.ctaLabel, 60) || 'Khám phá nước hoa',
      ctaHref: safeHref(source.ctaHref, '/products?group=fragrance'),
    };
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
    subtitle:
      type === 'HERO' && LEGACY_HERO_SUBTITLES.has(normalizedSubtitle)
        ? DEFAULT_HERO_SUBTITLE
        : normalizedSubtitle,
    isEnabled:
      type === 'HERO'
        ? true
        : typeof section?.isEnabled === 'boolean'
          ? section.isEnabled
          : Boolean(base.isEnabled),
    sortOrder: Number.isSafeInteger(Number(section?.sortOrder))
      ? Math.max(0, Number(section.sortOrder))
      : Number(base.sortOrder || index * 10),
    config: sanitizeConfig(type, { ...(base.config || {}), ...(section?.config || {}) }),
  };
};

const normalizeSections = (sections) => {
  const source = Array.isArray(sections) ? sections : [];
  const byId = new Map(source.map((section) => [section?.id, section]));
  const normalized = DEFAULT_SECTIONS.map((fallback, index) =>
    normalizeSection({ ...fallback, ...(byId.get(fallback.id) || {}) }, fallback, index),
  );
  const defaultIds = new Set(DEFAULT_SECTIONS.map((section) => section.id));
  const preservedLegacySections = source
    .filter(
      (section) =>
        section?.id && !defaultIds.has(section.id) && HOMEPAGE_SECTION_TYPES.has(section.type),
    )
    .map((section, index) => normalizeSection(section, section, DEFAULT_SECTIONS.length + index));
  return [...normalized, ...preservedLegacySections].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );
};

const loadSections = async () => {
  const setting = await prisma.siteSetting.findUnique({ where: { key: HOMEPAGE_SETTING_KEY } });
  if (!setting) return normalizeSections(DEFAULT_SECTIONS);
  return normalizeSections(setting.value);
};

const saveSections = async (sections) => {
  const normalized = normalizeSections(sections);
  const current = await prisma.siteSetting.findUnique({ where: { key: HOMEPAGE_SETTING_KEY } });
  const writes = [];
  if (current)
    writes.push(
      prisma.siteSetting.upsert({
        where: { key: HOMEPAGE_BACKUP_SETTING_KEY },
        update: {
          value: { savedAt: new Date().toISOString(), sections: current.value },
          type: 'JSON',
          group: HOMEPAGE_SETTING_GROUP,
          isPublic: false,
          description: 'Automatic backup before the latest homepage update',
        },
        create: {
          key: HOMEPAGE_BACKUP_SETTING_KEY,
          value: { savedAt: new Date().toISOString(), sections: current.value },
          type: 'JSON',
          group: HOMEPAGE_SETTING_GROUP,
          isPublic: false,
          description: 'Automatic backup before the latest homepage update',
        },
      }),
    );
  writes.push(
    prisma.siteSetting.upsert({
      where: { key: HOMEPAGE_SETTING_KEY },
      update: {
        value: normalized,
        type: 'JSON',
        group: HOMEPAGE_SETTING_GROUP,
        isPublic: true,
        description: 'Homepage section configuration',
      },
      create: {
        key: HOMEPAGE_SETTING_KEY,
        value: normalized,
        type: 'JSON',
        group: HOMEPAGE_SETTING_GROUP,
        isPublic: true,
        description: 'Homepage section configuration',
      },
    }),
  );
  await prisma.$transaction(writes);
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
  images: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: { mediaAsset: { select: { uuid: true, secureUrl: true, altText: true } } },
  },
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
    const next = normalizeSection(
      { ...current, ...body, id: current.id, type: current.type },
      current,
    );
    const saved = await saveSections(
      sections.map((section) => (section.id === sectionId ? next : section)),
    );
    return getSectionOrThrow(saved, sectionId);
  },

  async toggleSection(sectionId, body = {}) {
    const sections = await loadSections();
    const current = getSectionOrThrow(sections, sectionId);
    const nextEnabled = typeof body.isEnabled === 'boolean' ? body.isEnabled : !current.isEnabled;
    const saved = await saveSections(
      sections.map((section) =>
        section.id === sectionId ? { ...section, isEnabled: nextEnabled } : section,
      ),
    );
    return getSectionOrThrow(saved, sectionId);
  },

  async reorderSections(body) {
    const sections = await loadSections();
    const orderMap = new Map((body.sections || []).map((item) => [item.id, item.sortOrder]));
    const saved = await saveSections(
      sections.map((section) => ({
        ...section,
        sortOrder: orderMap.has(section.id) ? Number(orderMap.get(section.id)) : section.sortOrder,
      })),
    );
    return saved;
  },

  async addFeaturedItem(sectionId, body) {
    const sections = await loadSections();
    const section = getSectionOrThrow(sections, sectionId);
    const order = Number.isSafeInteger(Number(body.sortOrder))
      ? Math.max(0, Number(body.sortOrder))
      : 0;

    if (section.type === 'FEATURED_PRODUCTS' && body.entityType === 'PRODUCT') {
      const product = await prisma.product.findFirst({
        where: { uuid: body.entityUuid, deletedAt: null },
        include: productInclude,
      });
      if (!product) throw ApiError.notFound('Product not found');
      return prisma.product.update({
        where: { id: product.id },
        data: { isFeatured: true, featuredOrder: order },
        include: productInclude,
      });
    }

    if (section.type === 'FEATURED_POSTS' && body.entityType === 'POST') {
      const post = await prisma.blogPost.findFirst({
        where: { uuid: body.entityUuid, deletedAt: null },
        include: postInclude,
      });
      if (!post) throw ApiError.notFound('Blog post not found');
      return prisma.blogPost.update({
        where: { id: post.id },
        data: { isFeatured: true, featuredOrder: order },
        include: postInclude,
      });
    }

    throw ApiError.badRequest('Section does not support this featured item type');
  },

  async removeFeaturedItem(sectionId, itemId) {
    const sections = await loadSections();
    const section = getSectionOrThrow(sections, sectionId);

    if (section.type === 'FEATURED_PRODUCTS') {
      const product = await prisma.product.findFirst({
        where: { uuid: itemId, deletedAt: null },
        include: productInclude,
      });
      if (!product) throw ApiError.notFound('Product not found');
      return prisma.product.update({
        where: { id: product.id },
        data: { isFeatured: false },
        include: productInclude,
      });
    }

    if (section.type === 'FEATURED_POSTS') {
      const post = await prisma.blogPost.findFirst({
        where: { uuid: itemId, deletedAt: null },
        include: postInclude,
      });
      if (!post) throw ApiError.notFound('Blog post not found');
      return prisma.blogPost.update({
        where: { id: post.id },
        data: { isFeatured: false },
        include: postInclude,
      });
    }

    throw ApiError.badRequest('Section does not support featured items');
  },

  async reorderFeaturedItems(sectionId, body) {
    const sections = await loadSections();
    const section = getSectionOrThrow(sections, sectionId);
    const items = body.items || [];

    if (section.type === 'FEATURED_PRODUCTS') {
      await prisma.$transaction(
        items.map((item) =>
          prisma.product.updateMany({
            where: { uuid: item.entityUuid, deletedAt: null },
            data: { featuredOrder: Number(item.sortOrder) },
          }),
        ),
      );
      return true;
    }
    if (section.type === 'FEATURED_POSTS') {
      await prisma.$transaction(
        items.map((item) =>
          prisma.blogPost.updateMany({
            where: { uuid: item.entityUuid, deletedAt: null },
            data: { featuredOrder: Number(item.sortOrder) },
          }),
        ),
      );
      return true;
    }
    throw ApiError.badRequest('Section does not support item reorder');
  },
};

export const homepageSectionDefaults = DEFAULT_SECTIONS;
export const loadHomepageSections = loadSections;
export const normalizeHomepageSections = normalizeSections;
