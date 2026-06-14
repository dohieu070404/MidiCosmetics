import { z } from 'zod';
import { isStrongAdminPassword, ADMIN_PASSWORD_POLICY_MESSAGE } from '../../utils/admin-password-policy.js';
import { isPrivateOrLocalHostname } from '../../utils/safe-url.js';

const emptyParams = z.object({}).optional();
const uuidParams = z.object({ uuid: z.string().uuid() });
const safeText = (schema) => schema.refine((value) => value === undefined || value === null || !/[\u0000-\u001F\u007F<>]/.test(String(value)), 'Nội dung chứa ký tự không hợp lệ');
const optionalString = (max = 255) => safeText(z.string().trim().max(max).optional().nullable());
const nullableUuid = z.string().uuid().optional().nullable();
const normalizeDecimalString = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return '__INVALID_DECIMAL__';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '__INVALID_DECIMAL__';

  let normalized = String(value).trim().replace(/\s/g, '');
  if (!normalized || normalized.toLowerCase() === 'nan') return '__INVALID_DECIMAL__';
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
    normalized = parts.length > 2 || last.length === 3
      ? normalized.replace(/\./g, '')
      : normalized;
  }

  return normalized;
};
const decimalRequired = z.preprocess(
  normalizeDecimalString,
  z.string().trim().regex(/^\d+(\.\d{1,2})?$/, 'Giá phải là số hợp lệ, ví dụ 100000, 100,000 hoặc 100.000')
);
const decimalOptional = decimalRequired.optional();
const decimalNullable = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return normalizeDecimalString(value);
}, z.union([z.string().trim().regex(/^\d+(\.\d{1,2})?$/), z.null()]).optional());
const stockInput = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') return 0;
  const normalized = String(value).trim().replace(/\s/g, '').replace(/,/g, '').replace(/\./g, '');
  return /^\d+$/.test(normalized) ? Number(normalized) : Number.NaN;
}, z.number().int().min(0).default(0));

const safeSlug = z.string().trim().max(191).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Slug chỉ được chứa chữ, số và dấu gạch ngang').optional();
const safeCode = (max = 100) => safeText(z.string().trim().max(max).optional().nullable());
const safeHttpOrUploadUrl = (max = 1000) => safeText(z.string().trim().max(max).optional().nullable()).refine((value) => {
  if (value === undefined || value === null || value === '') return true;
  const text = String(value).trim();
  if (/^\/uploads\/[a-zA-Z0-9._-]+$/.test(text) && !text.includes('..')) return true;
  try {
    const parsed = new URL(text);
    return ['http:', 'https:'].includes(parsed.protocol) && !isPrivateOrLocalHostname(parsed.hostname);
  } catch {
    return false;
  }
}, 'URL phải bắt đầu bằng http://, https:// hoặc /uploads/<filename>');
const listableStatus = z.enum(['DRAFT', 'PUBLISHED', 'ACTIVE', 'INACTIVE', 'ARCHIVED', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'VALID', 'INVALID', 'SUCCESS']);

const booleanQuery = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.toLowerCase());
  return value;
}, z.boolean());

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(150).optional(),
  includeDeleted: booleanQuery.optional().default(false),
});

export const uuidOnlySchema = z.object({ body: z.object({}).optional(), params: uuidParams, query: z.object({}).optional() });

export const listGenericSchema = z.object({
  body: z.object({}).optional(),
  params: emptyParams,
  query: paginationQuerySchema.extend({ status: listableStatus.optional() }),
});



export const listProductSchema = z.object({
  body: z.object({}).optional(),
  params: emptyParams,
  query: paginationQuerySchema.extend({
    status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
    categoryUuid: z.string().uuid().optional(),
    brandUuid: z.string().uuid().optional(),
  }),
});

export const featuredToggleSchema = z.object({
  body: z.object({
    isFeatured: z.boolean(),
    featuredOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  }).strict(),
  params: uuidParams,
  query: z.object({}).optional(),
});


export const importProcessBatchSchema = z.object({
  body: z.object({
    batchSize: z.coerce.number().int().min(10).max(200).optional(),
  }).strict().optional().default({}),
  params: uuidParams,
  query: z.object({}).optional(),
});

export const adminBootstrapSchema = z.object({
  body: z.object({
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: z.string().min(10).max(128).refine(isStrongAdminPassword, ADMIN_PASSWORD_POLICY_MESSAGE),
    bootstrapToken: z.string().min(32).max(512),
  }).strict(),
  params: emptyParams,
  query: z.object({}).optional(),
});


export const adminProfilePasswordChangeRequestSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(10).max(128).refine(isStrongAdminPassword, ADMIN_PASSWORD_POLICY_MESSAGE),
  }).strict(),
  params: emptyParams,
  query: z.object({}).optional(),
});

export const adminProfilePasswordChangeVerifySchema = z.object({
  body: z.object({
    token: z.string().trim().min(32).max(256),
  }).strict(),
  params: emptyParams,
  query: z.object({}).optional(),
});


export const notificationRecipientCreateSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(191).transform((value) => value.toLowerCase()),
  }).strict(),
  params: emptyParams,
  query: z.object({}).optional(),
});

export const notificationRecipientVerifySchema = z.object({
  body: z.object({
    token: z.string().trim().min(32).max(256),
  }).strict(),
  params: emptyParams,
  query: z.object({}).optional(),
});

export const categorySchema = z.object({
  body: z.object({
    parentUuid: nullableUuid,
    name: z.string().trim().min(1).max(150),
    slug: safeSlug,
    description: optionalString(5000),
    sortOrder: z.coerce.number().int().min(0).default(0),
  }),
  params: emptyParams,
  query: z.object({}).optional(),
});

export const updateCategorySchema = categorySchema.extend({ params: uuidParams }).partial({ body: true }).extend({
  body: categorySchema.shape.body.partial().strict(),
});

export const tagSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    slug: safeSlug,
  }),
  params: emptyParams,
  query: z.object({}).optional(),
});

export const updateTagSchema = z.object({
  body: tagSchema.shape.body.partial().strict(),
  params: uuidParams,
  query: z.object({}).optional(),
});

export const brandSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(150),
    slug: safeSlug,
    description: optionalString(5000),
    logoUrl: safeHttpOrUploadUrl(1000),
    country: optionalString(100),
    sortOrder: z.coerce.number().int().min(0).default(0),
  }),
  params: emptyParams,
  query: z.object({}).optional(),
});

export const updateBrandSchema = z.object({
  body: brandSchema.shape.body.partial().strict(),
  params: uuidParams,
  query: z.object({}).optional(),
});

export const collectionSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(150),
    slug: safeSlug,
    description: optionalString(5000),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).default(0),
  }),
  params: emptyParams,
  query: z.object({}).optional(),
});

export const updateCollectionSchema = z.object({
  body: collectionSchema.shape.body.partial().strict(),
  params: uuidParams,
  query: z.object({}).optional(),
});

export const blogPostSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(255),
    slug: safeSlug,
    categoryUuid: nullableUuid,
    featuredImageUuid: nullableUuid,
    excerpt: optionalString(500),
    content: z.string().trim().min(1).max(200000),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
    isFeatured: z.boolean().default(false),
    featuredOrder: z.coerce.number().int().min(0).default(0),
    tagUuids: z.array(z.string().uuid()).optional().default([]),
    seoTitle: optionalString(255),
    seoDescription: optionalString(500),
    publishedAt: z.coerce.date().optional().nullable(),
  }),
  params: emptyParams,
  query: z.object({}).optional(),
});

export const updateBlogPostSchema = z.object({
  body: blogPostSchema.shape.body.partial().strict(),
  params: uuidParams,
  query: z.object({}).optional(),
});

export const productImageInput = z.object({
  mediaAssetUuid: z.string().uuid().optional(),
  url: safeHttpOrUploadUrl(1000),
  altText: optionalString(255),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
});

export const productSchema = z.object({
  body: z.object({
    categoryUuid: nullableUuid,
    brandUuid: nullableUuid,
    collectionUuids: z.array(z.string().uuid()).optional().default([]),
    name: z.string().trim().min(1).max(255),
    slug: safeSlug,
    sku: safeCode(100),
    barcode: safeCode(100),
    shortDescription: optionalString(500),
    description: optionalString(200000),
    skinType: optionalString(120),
    ingredients: optionalString(10000),
    howToUse: optionalString(10000),
    benefits: optionalString(10000),
    caution: optionalString(10000),
    price: decimalRequired,
    stock: stockInput,
    unit: optionalString(50),
    compareAtPrice: decimalNullable,
    currency: z.string().trim().regex(/^[A-Z]{3}$/i).transform((value) => value.toUpperCase()).default('VND'),
    status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).default('DRAFT'),
    isFeatured: z.boolean().default(false),
    featuredOrder: z.coerce.number().int().min(0).default(0),
    sortOrder: z.coerce.number().int().min(0).default(0),
    seoTitle: optionalString(255),
    seoDescription: optionalString(500),
    publishedAt: z.coerce.date().optional().nullable(),
    images: z.array(productImageInput).optional().default([]),
  }),
  params: emptyParams,
  query: z.object({}).optional(),
});

export const updateProductSchema = z.object({
  body: productSchema.shape.body.extend({
    price: decimalOptional,
    compareAtPrice: decimalNullable,
    stock: stockInput.optional(),
  }).partial().strict(),
  params: uuidParams,
  query: z.object({}).optional(),
});

export const productStatusSchema = z.object({
  body: z.object({ status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']) }),
  params: uuidParams,
  query: z.object({}).optional(),
});



const homepageSectionId = z.string().trim().regex(/^[a-z0-9-]{2,60}$/i, 'Homepage section id is invalid');
const homepageEntityUuid = z.string().uuid();
const homepageText = (max = 500) => z.string().trim().max(max).optional().nullable().refine((value) => {
  if (value === undefined || value === null || value === '') return true;
  return !/<\/?script|javascript:|onerror\s*=|onclick\s*=|onload\s*=/i.test(String(value));
}, 'Nội dung homepage không được chứa script hoặc event handler');
const homepageSectionConfigSchema = z.object({
  eyebrow: homepageText(80),
  imageUrl: safeHttpOrUploadUrl(1000),
  ctaLabel: homepageText(60),
  ctaHref: z.string().trim().max(120).regex(/^\/(products|blog|about)(\/[-a-zA-Z0-9_/?=&]*)?$/, 'CTA chỉ được trỏ tới route public an toàn').optional().nullable(),
  secondaryLabel: homepageText(60),
  secondaryHref: z.string().trim().max(120).regex(/^\/(products|blog|about)(\/[-a-zA-Z0-9_/?=&]*)?$/, 'CTA phụ chỉ được trỏ tới route public an toàn').optional().nullable(),
  body: homepageText(2000),
  limit: z.coerce.number().int().min(1).max(12).optional(),
}).strip();

export const homepageSectionParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ sectionId: homepageSectionId }),
  query: z.object({}).optional(),
});

export const homepageSectionUpdateSchema = z.object({
  body: z.object({
    title: homepageText(180),
    subtitle: homepageText(500),
    isEnabled: z.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
    config: homepageSectionConfigSchema.optional(),
  }).strict(),
  params: z.object({ sectionId: homepageSectionId }),
  query: z.object({}).optional(),
});

export const homepageSectionToggleSchema = z.object({
  body: z.object({ isEnabled: z.boolean().optional() }).strict().optional().default({}),
  params: z.object({ sectionId: homepageSectionId }),
  query: z.object({}).optional(),
});

export const homepageSectionReorderSchema = z.object({
  body: z.object({
    sections: z.array(z.object({ id: homepageSectionId, sortOrder: z.coerce.number().int().min(0).max(9999) })).min(1).max(20),
  }).strict(),
  params: emptyParams,
  query: z.object({}).optional(),
});

export const homepageFeaturedItemSchema = z.object({
  body: z.object({
    entityType: z.enum(['PRODUCT', 'POST']),
    entityUuid: homepageEntityUuid,
    sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  }).strict(),
  params: z.object({ sectionId: homepageSectionId }),
  query: z.object({}).optional(),
});

export const homepageFeaturedItemDeleteSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ sectionId: homepageSectionId, itemId: homepageEntityUuid }),
  query: z.object({}).optional(),
});

export const homepageFeaturedItemReorderSchema = z.object({
  body: z.object({
    items: z.array(z.object({ entityUuid: homepageEntityUuid, sortOrder: z.coerce.number().int().min(0).max(9999) })).min(1).max(50),
  }).strict(),
  params: z.object({ sectionId: homepageSectionId }),
  query: z.object({}).optional(),
});

export const settingsSchema = z.object({
  body: z.object({
    key: z.string().trim().min(1).max(120),
    value: z.any(),
    type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON']).default('STRING'),
    group: z.string().trim().max(80).default('general'),
    description: optionalString(255),
    isPublic: z.boolean().default(false),
  }),
  params: emptyParams,
  query: z.object({}).optional(),
});

export const listSettingsSchema = z.object({
  body: z.object({}).optional(),
  params: emptyParams,
  query: z.object({ group: z.string().trim().max(80).optional() }).optional(),
});
