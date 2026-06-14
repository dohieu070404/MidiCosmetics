import { prisma } from '../../prisma/client.js';
import { ApiError } from '../../errors/api-error.js';
import { buildPagination, getPaginationArgs } from '../../utils/pagination.js';
import { buildSearchWhere } from '../../utils/prisma-format.js';
import { normalizePlainText, sanitizeRichHtml } from '../../utils/sanitize.js';
import { loadHomepageSections } from '../admin/admin-homepage.service.js';

const mediaSelect = { uuid: true, secureUrl: true, altText: true, width: true, height: true };
const categorySelect = { uuid: true, name: true, slug: true, description: true };
const brandSelect = { uuid: true, name: true, slug: true, description: true, logoUrl: true, country: true };

const postInclude = {
  author: { select: { uuid: true, fullName: true, avatarUrl: true } },
  category: { select: categorySelect },
  featuredImage: { select: mediaSelect },
  tags: { include: { tag: { select: { uuid: true, name: true, slug: true } } } },
};

const productInclude = {
  category: { select: categorySelect },
  brand: { select: brandSelect },
  images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], include: { mediaAsset: { select: mediaSelect } } },
};

const publicProductWhere = { deletedAt: null, status: 'ACTIVE' };
const publicPostWhere = { deletedAt: null, status: 'PUBLISHED' };

const toPlainNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const raw = typeof value === 'object' && typeof value.toString === 'function' ? value.toString() : String(value);
  const number = Number(raw);
  return Number.isFinite(number) ? number : null;
};

const formatPublicPrice = (value, currency = 'VND') => {
  const number = toPlainNumber(value);
  if (number === null) return 'Liên hệ';
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currency || 'VND' }).format(number);
  } catch {
    return `${new Intl.NumberFormat('vi-VN').format(number)} ₫`;
  }
};

const serializePublicImage = (image) => image?.mediaAsset?.secureUrl || null;

const serializePublicCategory = (category) => category ? { name: category.name, slug: category.slug } : null;
const serializePublicBrand = (brand) => brand ? { name: brand.name, slug: brand.slug, logoUrl: brand.logoUrl || null } : null;

const getRawPublicText = (rawData, aliases = [], maxLength = 3000) => {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) return '';
  for (const alias of aliases) {
    const value = rawData[alias];
    if (value !== null && value !== undefined && String(value).trim()) {
      return normalizePlainText(value, maxLength);
    }
  }
  return '';
};

const serializePublicHtml = (value, maxLength = 10000) => {
  if (value === null || value === undefined || !String(value).trim()) return '';
  return sanitizeRichHtml(value, maxLength);
};

const serializePublicText = (value, maxLength = 3000) => {
  if (value === null || value === undefined || !String(value).trim()) return '';
  return normalizePlainText(value, maxLength);
};

const serializePublicProduct = (product) => {
  if (!product) return product;
  const imageUrls = (product.images || []).map(serializePublicImage).filter(Boolean);
  const price = toPlainNumber(product.price);
  const benefitsFromImport = getRawPublicText(product.rawImportData, ['Công dụng', 'Cong dung', 'Lợi ích', 'Loi ich', 'benefits', 'Benefits'], 3000);
  const cautionFromImport = getRawPublicText(product.rawImportData, ['Lưu ý sử dụng', 'Luu y su dung', 'Lưu ý', 'Luu y', 'caution', 'Caution'], 3000);

  return {
    id: product.uuid,
    uuid: product.uuid,
    name: product.name,
    slug: product.slug,
    price,
    currency: product.currency || 'VND',
    formattedPrice: formatPublicPrice(product.price, product.currency),
    shortDescription: serializePublicText(product.shortDescription, 500),
    description: serializePublicHtml(product.description || product.shortDescription || ''),
    howToUse: serializePublicHtml(product.howToUse || ''),
    skinType: serializePublicText(product.skinType || '', 120),
    ingredients: serializePublicHtml(product.ingredients || ''),
    benefits: serializePublicHtml(product.benefits || benefitsFromImport || product.shortDescription || '', 10000),
    caution: serializePublicHtml(product.caution || cautionFromImport || ''),
    mainImage: imageUrls[0] || null,
    images: imageUrls,
    brand: serializePublicBrand(product.brand),
    category: serializePublicCategory(product.category),
  };
};

const serializePublicProducts = (products = []) => products.map(serializePublicProduct);

const orderBlogs = (sort) => {
  if (sort === 'popular') return [{ viewCount: 'desc' }, { publishedAt: 'desc' }];
  if (sort === 'featured') return [{ featuredOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
  return [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
};

const sanitizePublicPost = (post) => post ? { ...post, content: sanitizeRichHtml(post.content || '') } : post;
const sanitizePublicPosts = (posts = []) => posts.map(sanitizePublicPost);

const serializeHomepagePost = (post) => post ? {
  id: post.uuid,
  uuid: post.uuid,
  title: post.title,
  slug: post.slug,
  excerpt: serializePublicText(post.excerpt || '', 500),
  readingMinutes: post.readingMinutes || 1,
  publishedAt: post.publishedAt,
  image: post.featuredImage?.secureUrl || null,
  category: serializePublicCategory(post.category),
} : null;

const serializeHomepagePosts = (posts = []) => posts.map(serializeHomepagePost).filter(Boolean);

const serializeHomepageCategory = (category) => category ? {
  id: category.uuid,
  uuid: category.uuid,
  name: category.name,
  slug: category.slug,
  description: serializePublicText(category.description || '', 500),
} : null;

const safePublicSectionConfig = (section) => {
  const config = section.config && typeof section.config === 'object' && !Array.isArray(section.config) ? section.config : {};
  if (section.type === 'HERO') return {
    eyebrow: serializePublicText(config.eyebrow || '', 80),
    imageUrl: config.imageUrl || '',
    ctaLabel: serializePublicText(config.ctaLabel || 'Xem sản phẩm', 60),
    ctaHref: config.ctaHref || '/products',
    secondaryLabel: serializePublicText(config.secondaryLabel || 'Đọc blog', 60),
    secondaryHref: config.secondaryHref || '/blog',
  };
  if (section.type === 'BRAND_INTRO') return { body: serializePublicText(config.body || '', 1500), imageUrl: config.imageUrl || '' };
  if (section.type === 'CUSTOM_TEXT') return { body: serializePublicText(config.body || '', 2000) };
  if (['FEATURED_PRODUCTS', 'FEATURED_POSTS', 'FEATURED_CATEGORIES'].includes(section.type)) return { limit: Math.min(12, Math.max(1, Number(config.limit || 6))) };
  return {};
};

const buildPublicHomepageSections = ({ sections, featuredProducts, featuredBlogs, productCategories }) => sections
  .filter((section) => section.isEnabled)
  .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
  .map((section) => {
    const config = safePublicSectionConfig(section);
    const base = {
      id: section.id,
      type: section.type,
      title: serializePublicText(section.title || '', 180),
      subtitle: serializePublicText(section.subtitle || '', 500),
      sortOrder: section.sortOrder,
      config,
    };
    if (section.type === 'HERO') return { ...base, heroProduct: featuredProducts[0] || null };
    if (section.type === 'FEATURED_PRODUCTS') return { ...base, items: featuredProducts.slice(0, config.limit || 8) };
    if (section.type === 'FEATURED_POSTS') return { ...base, items: serializeHomepagePosts(featuredBlogs).slice(0, config.limit || 6) };
    if (section.type === 'FEATURED_CATEGORIES') return { ...base, items: productCategories.map(serializeHomepageCategory).filter(Boolean).slice(0, config.limit || 8) };
    return base;
  })
  .filter((section) => {
    if (['FEATURED_PRODUCTS', 'FEATURED_POSTS', 'FEATURED_CATEGORIES'].includes(section.type)) return Array.isArray(section.items) && section.items.length > 0;
    return true;
  });


const orderProducts = (sort) => {
  if (sort === 'price_asc') return [{ price: 'asc' }, { createdAt: 'desc' }];
  if (sort === 'price_desc') return [{ price: 'desc' }, { createdAt: 'desc' }];
  if (sort === 'name_asc') return [{ name: 'asc' }];
  if (sort === 'popular') return [{ viewCount: 'desc' }, { createdAt: 'desc' }];
  if (sort === 'featured') return [{ featuredOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
  return [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
};

const findPost = async (slug) => {
  const post = await prisma.blogPost.findFirst({ where: { ...publicPostWhere, OR: [{ slug }, { uuid: slug }] }, include: postInclude });
  if (!post) throw ApiError.notFound('Blog post not found');
  return post;
};

const findProduct = async (slug) => {
  const product = await prisma.product.findFirst({ where: { ...publicProductWhere, OR: [{ slug }, { uuid: slug }] }, include: productInclude });
  if (!product) throw ApiError.notFound('Product not found');
  return product;
};


export const publicService = {
  async getHome() {
    const sections = await loadHomepageSections();
    const [featuredBlogs, featuredProducts, blogCategories, productCategories, brands] = await Promise.all([
      prisma.blogPost.findMany({ where: { ...publicPostWhere, isFeatured: true }, orderBy: orderBlogs('featured'), take: 12, include: postInclude }),
      prisma.product.findMany({ where: { ...publicProductWhere, isFeatured: true }, orderBy: orderProducts('featured'), take: 12, include: productInclude }),
      prisma.blogCategory.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], take: 10, select: categorySelect }),
      prisma.productCategory.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], take: 10, select: categorySelect }),
      prisma.productBrand.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], take: 10, select: brandSelect }),
    ]);
    const publicFeaturedProducts = serializePublicProducts(featuredProducts);
    const publicSections = buildPublicHomepageSections({ sections, featuredProducts: publicFeaturedProducts, featuredBlogs, productCategories });
    return {
      sections: publicSections,
      featuredBlogs: serializeHomepagePosts(featuredBlogs),
      featuredProducts: publicFeaturedProducts,
      blogCategories,
      productCategories: productCategories.map(serializeHomepageCategory).filter(Boolean),
      brands,
    };
  },

  async featuredBlogs() {
    return sanitizePublicPosts(await prisma.blogPost.findMany({
      where: { ...publicPostWhere, isFeatured: true },
      orderBy: orderBlogs('featured'),
      take: 6,
      include: postInclude,
    }));
  },

  async featuredProducts() {
    return serializePublicProducts(await prisma.product.findMany({
      where: { ...publicProductWhere, isFeatured: true },
      orderBy: orderProducts('featured'),
      take: 8,
      include: productInclude,
    }));
  },

  async listBlogs(query) {
    const { page, limit, search, category, tags, sort } = query;
    const tagSlugs = tags ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];
    const where = {
      ...publicPostWhere,
      ...(category ? { category: { slug: category, deletedAt: null } } : {}),
      ...(tagSlugs.length ? { tags: { some: { tag: { slug: { in: tagSlugs }, deletedAt: null } } } } : {}),
      ...buildSearchWhere(['title', 'excerpt', 'content'], search),
    };
    const [items, total] = await Promise.all([
      prisma.blogPost.findMany({ where, orderBy: orderBlogs(sort), include: postInclude, ...getPaginationArgs({ page, limit }) }),
      prisma.blogPost.count({ where }),
    ]);
    return { items: sanitizePublicPosts(items), pagination: buildPagination({ page, limit, total }) };
  },

  async getBlog(slug) {
    const current = await findPost(slug);
    const post = await prisma.blogPost.update({ where: { id: current.id }, data: { viewCount: { increment: 1 } }, include: postInclude });
    const related = await prisma.blogPost.findMany({ where: { ...publicPostWhere, id: { not: post.id }, ...(post.categoryId ? { categoryId: post.categoryId } : {}) }, include: postInclude, orderBy: orderBlogs('latest'), take: 4 });
    return { post: sanitizePublicPost(post), related: sanitizePublicPosts(related) };
  },

  async relatedBlogs(slug) {
    const post = await findPost(slug);
    const related = await prisma.blogPost.findMany({ where: { ...publicPostWhere, id: { not: post.id }, ...(post.categoryId ? { categoryId: post.categoryId } : {}) }, include: postInclude, orderBy: orderBlogs('latest'), take: 6 });
    return sanitizePublicPosts(related);
  },


  async listProducts(query) {
    const { page, limit, search, category, brand, sort } = query;
    const where = {
      ...publicProductWhere,
      ...(category ? { category: { slug: category, deletedAt: null } } : {}),
      ...(brand ? { brand: { slug: brand, deletedAt: null } } : {}),
      ...buildSearchWhere(['name', 'shortDescription', 'description'], search),
    };
    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy: orderProducts(sort), include: productInclude, ...getPaginationArgs({ page, limit }) }),
      prisma.product.count({ where }),
    ]);
    return { items: serializePublicProducts(items), pagination: buildPagination({ page, limit, total }) };
  },

  async getProduct(slug) {
    const current = await findProduct(slug);
    const product = await prisma.product.update({ where: { id: current.id }, data: { viewCount: { increment: 1 } }, include: productInclude });
    const productRelatedOr = [{ categoryId: product.categoryId || undefined }, { brandId: product.brandId || undefined }].filter((item) => Object.values(item)[0] !== undefined);
    const related = await prisma.product.findMany({ where: { ...publicProductWhere, id: { not: product.id }, ...(productRelatedOr.length ? { OR: productRelatedOr } : {}) }, include: productInclude, orderBy: orderProducts('latest'), take: 4 });
    return { product: serializePublicProduct(product), related: serializePublicProducts(related) };
  },

  async relatedProducts(slug) {
    const product = await findProduct(slug);
    const productRelatedOr = [{ categoryId: product.categoryId || undefined }, { brandId: product.brandId || undefined }].filter((item) => Object.values(item)[0] !== undefined);
    const related = await prisma.product.findMany({ where: { ...publicProductWhere, id: { not: product.id }, ...(productRelatedOr.length ? { OR: productRelatedOr } : {}) }, include: productInclude, orderBy: orderProducts('latest'), take: 6 });
    return serializePublicProducts(related);
  },

  async getTaxonomies() {
    const [blogCategories, blogTags, productCategories, productBrands] = await Promise.all([
      prisma.blogCategory.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: categorySelect }),
      prisma.blogTag.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' }, select: { uuid: true, name: true, slug: true } }),
      prisma.productCategory.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: categorySelect }),
      prisma.productBrand.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: brandSelect }),
    ]);
    return { blogCategories, blogTags, productCategories, productBrands };
  },
};
