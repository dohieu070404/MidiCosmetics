import { prisma } from '../../prisma/client.js';
import { ApiError } from '../../errors/api-error.js';
import { buildPagination, getPaginationArgs } from '../../utils/pagination.js';
import { buildSearchWhere } from '../../utils/prisma-format.js';
import { normalizePlainText, sanitizeRichHtml } from '../../utils/sanitize.js';
import { loadHomepageSections } from '../admin/admin-homepage.service.js';

const mediaSelect = { uuid: true, secureUrl: true, altText: true, width: true, height: true };
const categorySelect = { uuid: true, name: true, slug: true, description: true };
const brandSelect = {
  uuid: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  country: true,
};

const postInclude = {
  author: { select: { uuid: true, fullName: true, avatarUrl: true } },
  category: { select: categorySelect },
  featuredImage: { select: mediaSelect },
  tags: { include: { tag: { select: { uuid: true, name: true, slug: true } } } },
};

const productInclude = {
  category: { select: categorySelect },
  brand: { select: brandSelect },
  images: {
    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    include: { mediaAsset: { select: mediaSelect } },
  },
};

const publicProductWhere = { deletedAt: null, status: 'ACTIVE' };
const publicPostWhere = { deletedAt: null, status: 'PUBLISHED' };

const productCategoryGroups = Object.freeze({
  skincare: [
    'tay-trang',
    'sua-rua-mat',
    'toner',
    'serum',
    'kem-duong',
    'mat-na',
    'dan-mun',
    'xit-khoang',
    'tay-da-chet',
    'kem-chong-nang',
  ],
  makeup: [
    'son',
    'cushion',
    'kem-nen',
    'kem-lot',
    'che-khuyet-diem',
    'phan-phu',
    'xit-khoa-nen',
    'mascara',
    'ke-mat',
    'ke-may',
    'phan-mat-ma',
    'khoi-highlihght',
  ],
  'body-hair': [
    'kem-body',
    'sua-tam',
    'tay-da-chet-body',
    'tay-long',
    'body-mist',
    'lan-nach',
    'ddvs',
    'kem-danh-rang',
    'dau-goi',
    'da-dau',
  ],
  fragrance: ['nuoc-hoa'],
  accessories: ['phu-kien', 'mut-trang-diem', 'bong-tay-trang', 'kep-mi', 'kich-mi'],
});

const toPlainNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const raw =
    typeof value === 'object' && typeof value.toString === 'function'
      ? value.toString()
      : String(value);
  const number = Number(raw);
  return Number.isFinite(number) ? number : null;
};

const formatPublicPrice = (value, currency = 'VND') => {
  const number = toPlainNumber(value);
  if (number === null) return 'Liên hệ';
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency || 'VND',
    }).format(number);
  } catch {
    return `${new Intl.NumberFormat('vi-VN').format(number)} ₫`;
  }
};

const serializePublicImage = (image) => image?.mediaAsset?.secureUrl || null;

const serializePublicCategory = (category) =>
  category ? { name: category.name, slug: category.slug } : null;
const serializePublicBrand = (brand) =>
  brand ? { name: brand.name, slug: brand.slug, logoUrl: brand.logoUrl || null } : null;

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
  const benefitsFromImport = getRawPublicText(
    product.rawImportData,
    ['Công dụng', 'Cong dung', 'Lợi ích', 'Loi ich', 'benefits', 'Benefits'],
    3000,
  );
  const cautionFromImport = getRawPublicText(
    product.rawImportData,
    ['Lưu ý sử dụng', 'Luu y su dung', 'Lưu ý', 'Luu y', 'caution', 'Caution'],
    3000,
  );

  return {
    id: product.uuid,
    uuid: product.uuid,
    name: product.name,
    slug: product.slug,
    sku: product.sku || null,
    unit: product.unit || null,
    stock: Number(product.stock || 0),
    status: product.status,
    price,
    currency: product.currency || 'VND',
    formattedPrice: formatPublicPrice(product.price, product.currency),
    shortDescription: serializePublicText(product.shortDescription, 500),
    description: serializePublicHtml(product.description || product.shortDescription || ''),
    howToUse: serializePublicHtml(product.howToUse || ''),
    skinType: serializePublicText(product.skinType || '', 120),
    ingredients: serializePublicHtml(product.ingredients || ''),
    benefits: serializePublicHtml(
      product.benefits || benefitsFromImport || product.shortDescription || '',
      10000,
    ),
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
  if (sort === 'featured')
    return [{ featuredOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
  return [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
};

const sanitizePublicPost = (post) =>
  post ? { ...post, content: sanitizeRichHtml(post.content || '') } : post;
const sanitizePublicPosts = (posts = []) => posts.map(sanitizePublicPost);

const serializeHomepagePost = (post) =>
  post
    ? {
        id: post.uuid,
        uuid: post.uuid,
        title: post.title,
        slug: post.slug,
        excerpt: serializePublicText(post.excerpt || '', 500),
        readingMinutes: post.readingMinutes || 1,
        publishedAt: post.publishedAt,
        image: post.featuredImage?.secureUrl || null,
        category: serializePublicCategory(post.category),
      }
    : null;

const serializeHomepagePosts = (posts = []) => posts.map(serializeHomepagePost).filter(Boolean);
const PUBLIC_HOMEPAGE_SECTION_TYPES = new Set([
  'HERO',
  'FEATURED_PRODUCTS',
  'CUSTOM_TEXT',
  'FEATURED_POSTS',
]);

const serializeHomepageCategory = (category) =>
  category
    ? {
        id: category.uuid,
        uuid: category.uuid,
        name: category.name,
        slug: category.slug,
        description: serializePublicText(category.description || '', 500),
      }
    : null;

const safePublicSectionConfig = (section) => {
  const config =
    section.config && typeof section.config === 'object' && !Array.isArray(section.config)
      ? section.config
      : {};
  if (section.type === 'HERO')
    return {
      eyebrow: serializePublicText(config.eyebrow || '', 80),
      imageUrl: config.imageUrl || '',
      ctaLabel: serializePublicText(config.ctaLabel || 'Xem sản phẩm', 60),
      ctaHref: config.ctaHref || '/products',
      secondaryLabel: serializePublicText(config.secondaryLabel || 'Đọc blog', 60),
      secondaryHref: config.secondaryHref || '/blog',
      slides: Array.isArray(config.slides)
        ? config.slides.slice(0, 4).map((slide) => ({
            id: serializePublicText(slide.id || '', 40),
            kicker: serializePublicText(slide.kicker || '', 80),
            title: serializePublicText(slide.title || '', 100),
            subtitle: serializePublicText(slide.subtitle || '', 300),
            imageUrl: slide.imageUrl || '',
            href: slide.href || '/products',
            mobilePosition: serializePublicText(slide.mobilePosition || 'center center', 40),
          }))
        : [],
    };
  if (section.type === 'BRAND_INTRO')
    return {
      eyebrow: serializePublicText(config.eyebrow || '', 80),
      body: serializePublicText(config.body || '', 1500),
      imageUrl: config.imageUrl || '',
      ctaLabel: serializePublicText(config.ctaLabel || 'Tìm sản phẩm dành cho bạn', 60),
      ctaHref: config.ctaHref || '/products',
    };
  if (section.type === 'CUSTOM_TEXT')
    return {
      eyebrow: serializePublicText(config.eyebrow || '', 80),
      body: serializePublicText(config.body || '', 2000),
      imageUrl: config.imageUrl || '',
      ctaLabel: serializePublicText(config.ctaLabel || 'Khám phá nước hoa', 60),
      ctaHref: config.ctaHref || '/products?group=fragrance',
    };
  if (['FEATURED_PRODUCTS', 'FEATURED_POSTS'].includes(section.type))
    return {
      eyebrow: serializePublicText(config.eyebrow || '', 80),
      limit: Math.min(12, Math.max(1, Number(config.limit || 6))),
    };
  return {};
};

const buildPublicHomepageSections = ({ sections, featuredProducts, featuredBlogs }) =>
  sections
    .filter((section) => section.isEnabled && PUBLIC_HOMEPAGE_SECTION_TYPES.has(section.type))
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
      if (section.type === 'FEATURED_PRODUCTS')
        return { ...base, items: featuredProducts.slice(0, config.limit || 8) };
      if (section.type === 'FEATURED_POSTS')
        return {
          ...base,
          items: serializeHomepagePosts(featuredBlogs).slice(0, config.limit || 6),
        };
      return base;
    });

const orderProducts = (sort) => {
  if (sort === 'price_asc') return [{ price: 'asc' }, { createdAt: 'desc' }];
  if (sort === 'price_desc') return [{ price: 'desc' }, { createdAt: 'desc' }];
  if (sort === 'name_asc') return [{ name: 'asc' }];
  if (sort === 'popular') return [{ viewCount: 'desc' }, { createdAt: 'desc' }];
  if (sort === 'featured')
    return [{ featuredOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
  return [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
};

const findPost = async (slug) => {
  const post = await prisma.blogPost.findFirst({
    where: { ...publicPostWhere, OR: [{ slug }, { uuid: slug }] },
    include: postInclude,
  });
  if (!post) throw ApiError.notFound('Blog post not found');
  return post;
};

const findProduct = async (slug) => {
  const product = await prisma.product.findFirst({
    where: { ...publicProductWhere, OR: [{ slug }, { uuid: slug }] },
    include: productInclude,
  });
  if (!product) throw ApiError.notFound('Product not found');
  return product;
};

export const publicService = {
  async getAbout() {
    const setting = await prisma.siteSetting.findFirst({
      where: { key: 'about.page', isPublic: true },
      select: { value: true, updatedAt: true },
    });
    const value =
      setting?.value && typeof setting.value === 'object' && !Array.isArray(setting.value)
        ? setting.value
        : {};
    const imageUrl = String(value.imageUrl || '').trim();
    return {
      content: {
        eyebrow: serializePublicText(value.eyebrow || '', 80),
        title: serializePublicText(value.title || '', 240),
        intro: serializePublicText(value.intro || '', 1000),
        imageUrl: /^(?:https?:\/\/|\/(?:uploads|images)\/)/i.test(imageUrl) ? imageUrl : '',
        sectionEyebrow: serializePublicText(value.sectionEyebrow || '', 80),
        sectionTitle: serializePublicText(value.sectionTitle || '', 240),
        paragraphOne: serializePublicText(value.paragraphOne || '', 2000),
        paragraphTwo: serializePublicText(value.paragraphTwo || '', 2000),
      },
      updatedAt: setting?.updatedAt || null,
    };
  },

  async getHome() {
    const sections = await loadHomepageSections();
    const [featuredBlogs, featuredProducts, blogCategories, productCategories, brands] =
      await Promise.all([
        prisma.blogPost.findMany({
          where: { ...publicPostWhere, isFeatured: true },
          orderBy: orderBlogs('featured'),
          take: 12,
          include: postInclude,
        }),
        prisma.product.findMany({
          where: { ...publicProductWhere, isFeatured: true },
          orderBy: orderProducts('featured'),
          take: 12,
          include: productInclude,
        }),
        prisma.blogCategory.findMany({
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          take: 10,
          select: categorySelect,
        }),
        prisma.productCategory.findMany({
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          take: 10,
          select: categorySelect,
        }),
        prisma.productBrand.findMany({
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          take: 10,
          select: brandSelect,
        }),
      ]);
    const publicFeaturedProducts = serializePublicProducts(featuredProducts);
    const publicSections = buildPublicHomepageSections({
      sections,
      featuredProducts: publicFeaturedProducts,
      featuredBlogs,
    });
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
    return sanitizePublicPosts(
      await prisma.blogPost.findMany({
        where: { ...publicPostWhere, isFeatured: true },
        orderBy: orderBlogs('featured'),
        take: 6,
        include: postInclude,
      }),
    );
  },

  async featuredProducts() {
    return serializePublicProducts(
      await prisma.product.findMany({
        where: { ...publicProductWhere, isFeatured: true },
        orderBy: orderProducts('featured'),
        take: 8,
        include: productInclude,
      }),
    );
  },

  async listBlogs(query) {
    const { page, limit, search, category, tags, sort } = query;
    const tagSlugs = tags
      ? tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];
    const where = {
      ...publicPostWhere,
      ...(category ? { category: { slug: category, deletedAt: null } } : {}),
      ...(tagSlugs.length
        ? { tags: { some: { tag: { slug: { in: tagSlugs }, deletedAt: null } } } }
        : {}),
      ...buildSearchWhere(['title', 'excerpt', 'content'], search),
    };
    const [items, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: orderBlogs(sort),
        include: postInclude,
        ...getPaginationArgs({ page, limit }),
      }),
      prisma.blogPost.count({ where }),
    ]);
    return {
      items: sanitizePublicPosts(items),
      pagination: buildPagination({ page, limit, total }),
    };
  },

  async getBlog(slug) {
    const current = await findPost(slug);
    const post = await prisma.blogPost.update({
      where: { id: current.id },
      data: { viewCount: { increment: 1 } },
      include: postInclude,
    });
    const related = await prisma.blogPost.findMany({
      where: {
        ...publicPostWhere,
        id: { not: post.id },
        ...(post.categoryId ? { categoryId: post.categoryId } : {}),
      },
      include: postInclude,
      orderBy: orderBlogs('latest'),
      take: 4,
    });
    return { post: sanitizePublicPost(post), related: sanitizePublicPosts(related) };
  },

  async relatedBlogs(slug) {
    const post = await findPost(slug);
    const related = await prisma.blogPost.findMany({
      where: {
        ...publicPostWhere,
        id: { not: post.id },
        ...(post.categoryId ? { categoryId: post.categoryId } : {}),
      },
      include: postInclude,
      orderBy: orderBlogs('latest'),
      take: 6,
    });
    return sanitizePublicPosts(related);
  },

  async listProducts(query) {
    const { page, limit, search, category, group, brand, sort } = query;
    const categorySlugs = group ? productCategoryGroups[group] || [] : [];
    const categoryFilter = category
      ? { slug: category, deletedAt: null }
      : categorySlugs.length
        ? { slug: { in: categorySlugs }, deletedAt: null }
        : null;
    const where = {
      ...publicProductWhere,
      ...(categoryFilter ? { category: categoryFilter } : {}),
      ...(brand ? { brand: { slug: brand, deletedAt: null } } : {}),
      ...buildSearchWhere(['name', 'shortDescription', 'description'], search),
    };
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: orderProducts(sort),
        include: productInclude,
        ...getPaginationArgs({ page, limit }),
      }),
      prisma.product.count({ where }),
    ]);
    return {
      items: serializePublicProducts(items),
      pagination: buildPagination({ page, limit, total }),
    };
  },

  async getProduct(slug) {
    const current = await findProduct(slug);
    const product = await prisma.product.update({
      where: { id: current.id },
      data: { viewCount: { increment: 1 } },
      include: productInclude,
    });
    const productRelatedOr = [
      { categoryId: product.categoryId || undefined },
      { brandId: product.brandId || undefined },
    ].filter((item) => Object.values(item)[0] !== undefined);
    const related = await prisma.product.findMany({
      where: {
        ...publicProductWhere,
        id: { not: product.id },
        ...(productRelatedOr.length ? { OR: productRelatedOr } : {}),
      },
      include: productInclude,
      orderBy: orderProducts('latest'),
      take: 4,
    });
    return { product: serializePublicProduct(product), related: serializePublicProducts(related) };
  },

  async relatedProducts(slug) {
    const product = await findProduct(slug);
    const productRelatedOr = [
      { categoryId: product.categoryId || undefined },
      { brandId: product.brandId || undefined },
    ].filter((item) => Object.values(item)[0] !== undefined);
    const related = await prisma.product.findMany({
      where: {
        ...publicProductWhere,
        id: { not: product.id },
        ...(productRelatedOr.length ? { OR: productRelatedOr } : {}),
      },
      include: productInclude,
      orderBy: orderProducts('latest'),
      take: 6,
    });
    return serializePublicProducts(related);
  },

  async listCollections(query) {
    const { page, limit, search } = query;
    const where = {
      deletedAt: null,
      isActive: true,
      ...buildSearchWhere(['name', 'description'], search),
    };
    const [items, total] = await Promise.all([
      prisma.productCollection.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        ...getPaginationArgs({ page, limit }),
        include: {
          products: {
            take: 1,
            orderBy: { sortOrder: 'asc' },
            include: { product: { include: productInclude } },
          },
        },
      }),
      prisma.productCollection.count({ where }),
    ]);
    return {
      items: items.map((item) => ({
        uuid: item.uuid,
        name: item.name,
        slug: item.slug,
        description: serializePublicText(item.description || '', 500),
        coverImage:
          item.coverImageUrl || serializePublicImage(item.products?.[0]?.product?.images?.[0]),
      })),
      pagination: buildPagination({ page, limit, total }),
    };
  },

  async getCollection(slug) {
    const collection = await prisma.productCollection.findFirst({
      where: { OR: [{ slug }, { uuid: slug }], deletedAt: null, isActive: true },
      include: {
        products: {
          orderBy: { sortOrder: 'asc' },
          include: { product: { include: productInclude } },
        },
      },
    });
    if (!collection) throw ApiError.notFound('Collection not found');
    return {
      collection: {
        uuid: collection.uuid,
        name: collection.name,
        slug: collection.slug,
        description: serializePublicText(collection.description || '', 500),
        coverImage:
          collection.coverImageUrl ||
          serializePublicImage(collection.products?.[0]?.product?.images?.[0]),
        seoTitle: collection.seoTitle,
        seoDescription: collection.seoDescription,
      },
      products: serializePublicProducts(
        collection.products
          .map((item) => item.product)
          .filter((product) => product.status === 'ACTIVE' && !product.deletedAt),
      ),
    };
  },

  async getTaxonomies() {
    const [blogCategories, blogTags, productCategories, productBrands] = await Promise.all([
      prisma.blogCategory.findMany({
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: categorySelect,
      }),
      prisma.blogTag.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
        select: { uuid: true, name: true, slug: true },
      }),
      prisma.productCategory.findMany({
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: categorySelect,
      }),
      prisma.productBrand.findMany({
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: brandSelect,
      }),
    ]);
    return { blogCategories, blogTags, productCategories, productBrands };
  },
};
