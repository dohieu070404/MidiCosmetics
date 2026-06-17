import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { cloudinary, isCloudinaryConfigured } from '../../config/cloudinary.js';
import XLSX from 'xlsx';
import { env } from '../../config/env.js';
import { prisma } from '../../prisma/client.js';
import { ApiError } from '../../errors/api-error.js';
import { buildPagination, getPaginationArgs } from '../../utils/pagination.js';
import { buildSearchWhere, compactObject } from '../../utils/prisma-format.js';
import { buildUniqueSlug, ensureSlug } from '../../utils/slug.js';
import { normalizePlainText, sanitizeRichHtml } from '../../utils/sanitize.js';
import { validateRemoteImageUrl } from '../../utils/safe-url.js';
import { buildLocalUploadUrl, localUploadFilePath } from '../../utils/upload-paths.js';

const categorySelect = {
  id: true,
  uuid: true,
  parentId: true,
  name: true,
  slug: true,
  description: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  parent: { select: { uuid: true, name: true, slug: true } },
};

const tagSelect = {
  id: true,
  uuid: true,
  name: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
};

const mediaSelect = {
  id: true,
  uuid: true,
  provider: true,
  publicId: true,
  originalName: true,
  fileName: true,
  mimeType: true,
  sizeBytes: true,
  width: true,
  height: true,
  secureUrl: true,
  altText: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  uploader: { select: { uuid: true, fullName: true, email: true } },
};

const productInclude = {
  category: { select: { uuid: true, name: true, slug: true } },
  brand: { select: { uuid: true, name: true, slug: true } },
  images: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    include: { mediaAsset: { select: mediaSelect } },
  },
  collections: { include: { collection: { select: { uuid: true, name: true, slug: true } } } },
};

const postInclude = {
  author: { select: { uuid: true, fullName: true, email: true, role: true } },
  category: { select: { uuid: true, name: true, slug: true } },
  featuredImage: { select: mediaSelect },
  tags: { include: { tag: { select: { uuid: true, name: true, slug: true } } } },
};


const PRODUCT_IMPORT_TEMPLATE_FILENAME = 'mau-import-san-pham-kiot.xlsx';
const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const KIOT_IMPORT_TEMPLATE_COLUMNS = [
  'Loại hàng',
  'Nhóm hàng(3 Cấp)',
  'Mã hàng',
  'Mã vạch',
  'Tên hàng',
  'Thương hiệu',
  'Giá bán',
  'Tồn kho',
  'ĐVT',
  'Mã ĐVT Cơ bản',
  'Quy đổi',
  'Thuộc tính',
  'Mã HH Liên quan',
  'Hình ảnh (url1,url2...)',
  'Quản lý lô-hạn sử dụng',
  'Trọng lượng',
  'Đang kinh doanh',
  'Được bán trực tiếp',
  'Mô tả',
  'Công dụng',
  'Cách sử dụng',
  'Loại da phù hợp',
  'Thành phần',
  'Lưu ý sử dụng',
  'Mẫu ghi chú',
  'Vị trí',
  'Hàng thành phần',
  'Lô 1',
  'Hạn sử dụng 1',
  'Tồn 1',
  'Lô 2',
  'Hạn sử dụng 2',
  'Tồn 2',
  'Lô 3',
  'Hạn sử dụng 3',
  'Tồn 3',
  'Lô 4',
  'Hạn sử dụng 4',
  'Tồn 4',
  'Bảo hành',
  'Bảo trì định kỳ',
  'Thời gian tạo',
];

const KIOT_IMPORT_TEMPLATE_SAMPLE_ROW = {
  'Loại hàng': 'Hàng hóa',
  'Nhóm hàng(3 Cấp)': 'Skincare/Kem dưỡng',
  'Mã hàng': 'SP-MAU-001',
  'Mã vạch': '8930000000011',
  'Tên hàng': 'Kem dưỡng phục hồi da Midi Sample',
  'Thương hiệu': 'Midi Cosmetics',
  'Giá bán': 250000,
  'Tồn kho': 10,
  'ĐVT': 'hộp',
  'Mã ĐVT Cơ bản': '',
  'Quy đổi': '',
  'Thuộc tính': '',
  'Mã HH Liên quan': '',
  'Hình ảnh (url1,url2...)': 'https://example.com/kem-duong-mau.jpg',
  'Quản lý lô-hạn sử dụng': 'Không',
  'Trọng lượng': '',
  'Đang kinh doanh': 'Có',
  'Được bán trực tiếp': 'Có',
  'Mô tả': 'Kem dưỡng giúp da mềm mịn và đủ ẩm.',
  'Công dụng': 'Hỗ trợ phục hồi hàng rào bảo vệ da, cấp ẩm và làm dịu.',
  'Cách sử dụng': 'Thoa một lượng vừa đủ sau bước serum, dùng sáng và tối.',
  'Loại da phù hợp': 'Mọi loại da',
  'Thành phần': 'Panthenol, Ceramide, Hyaluronic Acid',
  'Lưu ý sử dụng': 'Ngưng dùng nếu có dấu hiệu kích ứng.',
  'Mẫu ghi chú': 'Dòng mẫu có thể xóa trước khi import thật.',
  'Vị trí': '',
  'Hàng thành phần': '',
  'Lô 1': '',
  'Hạn sử dụng 1': '',
  'Tồn 1': '',
  'Lô 2': '',
  'Hạn sử dụng 2': '',
  'Tồn 2': '',
  'Lô 3': '',
  'Hạn sử dụng 3': '',
  'Tồn 3': '',
  'Lô 4': '',
  'Hạn sử dụng 4': '',
  'Tồn 4': '',
  'Bảo hành': '',
  'Bảo trì định kỳ': '',
  'Thời gian tạo': new Date().toISOString().slice(0, 10),
};

const IMPORTANT_IMPORT_FIELDS = ['description', 'benefits', 'howToUse', 'skinType', 'ingredients', 'caution'];
const IMPORTANT_IMPORT_FIELD_LABELS = {
  description: 'Mô tả',
  benefits: 'Công dụng',
  howToUse: 'Cách sử dụng',
  skinType: 'Loại da phù hợp',
  ingredients: 'Thành phần',
  caution: 'Lưu ý sử dụng',
};

const hasImportValue = (value) => value !== null && value !== undefined && String(value).trim() !== '';
const readImportText = (raw, aliases) => {
  const value = pickCell(raw, aliases);
  return hasImportValue(value) ? String(value).trim() : null;
};

const listWithPagination = async ({ model, where, page, limit, orderBy = { createdAt: 'desc' }, include, select }) => {
  const [items, total] = await Promise.all([
    model.findMany({ where, orderBy, include, select, ...getPaginationArgs({ page, limit }) }),
    model.count({ where }),
  ]);

  return { items, pagination: buildPagination({ page, limit, total }) };
};

const findByUuidOrThrow = async (model, uuid, options = {}) => {
  const item = await model.findFirst({
    where: { uuid, ...(options.includeDeleted ? {} : { deletedAt: null }) },
    ...options.query,
  });

  if (!item) throw ApiError.notFound(options.message || 'Resource not found');
  return item;
};

const getIdByUuid = async (model, uuid, label) => {
  if (!uuid) return null;
  const found = await model.findFirst({ where: { uuid, deletedAt: null }, select: { id: true } });
  if (!found) throw ApiError.unprocessable(`${label} does not exist`, [{ field: `${label}Uuid`, code: 'NOT_FOUND', message: `${label} does not exist` }]);
  return found.id;
};

const readingMinutesFromContent = (content = '') => Math.max(1, Math.ceil(String(content).trim().split(/\s+/).filter(Boolean).length / 220));

const buildCategoryData = async ({ body, model }) => {
  const parentId = body.parentUuid === undefined ? undefined : await getIdByUuid(model, body.parentUuid, 'parent');
  const slug = body.slug || body.name ? await buildUniqueSlug({ base: body.slug || body.name, model }) : undefined;
  return compactObject({
    parentId,
    name: body.name,
    slug,
    description: body.description,
    sortOrder: body.sortOrder,
  });
};

const buildBlogPostData = async (body, existingUuid = null) => {
  const categoryId = body.categoryUuid === undefined ? undefined : await getIdByUuid(prisma.blogCategory, body.categoryUuid, 'category');
  const featuredImageId = body.featuredImageUuid === undefined ? undefined : await getIdByUuid(prisma.mediaAsset, body.featuredImageUuid, 'featuredImage');
  const slug = body.slug || body.title ? await buildUniqueSlug({ base: body.slug || body.title, model: prisma.blogPost, existingUuid }) : undefined;
  const status = body.status;
  const sanitizedContent = body.content === undefined ? undefined : sanitizeRichHtml(body.content);
  return compactObject({
    categoryId,
    featuredImageId,
    title: body.title,
    slug,
    excerpt: body.excerpt,
    content: sanitizedContent,
    status,
    isFeatured: body.isFeatured,
    featuredOrder: body.featuredOrder,
    readingMinutes: sanitizedContent ? readingMinutesFromContent(sanitizedContent) : undefined,
    seoTitle: body.seoTitle,
    seoDescription: body.seoDescription,
    publishedAt: body.publishedAt === undefined ? (status === 'PUBLISHED' ? new Date() : undefined) : body.publishedAt,
  });
};

const syncBlogTags = async (postId, tagUuids, client = prisma) => {
  if (!Array.isArray(tagUuids)) return;
  const tags = tagUuids.length
    ? await client.blogTag.findMany({ where: { uuid: { in: tagUuids }, deletedAt: null }, select: { id: true, uuid: true } })
    : [];

  if (tags.length !== tagUuids.length) {
    throw ApiError.unprocessable('One or more tags do not exist');
  }

  await client.blogPostTag.deleteMany({ where: { postId } });
  if (tags.length) {
    await client.blogPostTag.createMany({ data: tags.map((tag) => ({ postId, tagId: tag.id })), skipDuplicates: true });
  }
};

const buildProductData = async (body, existingUuid = null) => {
  const categoryId = body.categoryUuid === undefined ? undefined : await getIdByUuid(prisma.productCategory, body.categoryUuid, 'category');
  const brandId = body.brandUuid === undefined ? undefined : await getIdByUuid(prisma.productBrand, body.brandUuid, 'brand');
  const slug = body.slug || body.name ? await buildUniqueSlug({ base: body.slug || body.name, model: prisma.product, existingUuid }) : undefined;
  const status = body.status;
  return compactObject({
    categoryId,
    brandId,
    name: body.name,
    slug,
    sku: body.sku,
    barcode: body.barcode,
    stock: body.stock,
    unit: body.unit,
    shortDescription: body.shortDescription === undefined ? undefined : normalizePlainText(body.shortDescription, 500),
    description: body.description === undefined ? undefined : sanitizeRichHtml(body.description),
    skinType: body.skinType === undefined ? undefined : normalizePlainText(body.skinType, 120),
    ingredients: body.ingredients === undefined ? undefined : sanitizeRichHtml(body.ingredients, 10000),
    howToUse: body.howToUse === undefined ? undefined : sanitizeRichHtml(body.howToUse, 10000),
    benefits: body.benefits === undefined ? undefined : sanitizeRichHtml(body.benefits, 10000),
    caution: body.caution === undefined ? undefined : sanitizeRichHtml(body.caution, 10000),
    price: body.price === null ? null : body.price?.toString(),
    compareAtPrice: body.compareAtPrice === null ? null : body.compareAtPrice?.toString(),
    currency: body.currency,
    status,
    isFeatured: body.isFeatured,
    featuredOrder: body.featuredOrder,
    sortOrder: body.sortOrder,
    seoTitle: body.seoTitle,
    seoDescription: body.seoDescription,
    publishedAt: body.publishedAt === undefined ? (status === 'ACTIVE' ? new Date() : undefined) : body.publishedAt,
    rawImportData: body.rawImportData,
  });
};

const syncProductCollections = async (productId, collectionUuids, client = prisma) => {
  if (!Array.isArray(collectionUuids)) return;
  const collections = collectionUuids.length
    ? await client.productCollection.findMany({ where: { uuid: { in: collectionUuids }, deletedAt: null }, select: { id: true, uuid: true } })
    : [];

  if (collections.length !== collectionUuids.length) {
    throw ApiError.unprocessable('One or more collections do not exist');
  }

  await client.productCollectionItem.deleteMany({ where: { productId } });
  if (collections.length) {
    await client.productCollectionItem.createMany({
      data: collections.map((collection, index) => ({ productId, collectionId: collection.id, sortOrder: index })),
      skipDuplicates: true,
    });
  }
};



const syncProductImages = async (productId, images, client = prisma) => {
  if (!Array.isArray(images)) return;

  const normalized = [];
  for (const image of images) {
    if (image.mediaAssetUuid) {
      normalized.push(image);
      continue;
    }

    if (image.url) {
      const validation = validateRemoteImageUrl(image.url);
      if (!validation.ok) {
        throw ApiError.unprocessable(validation.message || 'URL ảnh không hợp lệ');
      }
      const url = validation.url;
      const asset = await client.mediaAsset.findFirst({
        where: { secureUrl: url, deletedAt: null },
        select: { uuid: true },
      }) || await client.mediaAsset.create({
        data: {
          provider: 'LOCAL',
          publicId: null,
          originalName: url.split('/').pop()?.slice(0, 180) || 'image-url',
          fileName: null,
          mimeType: 'image/url',
          sizeBytes: 0,
          secureUrl: url,
          altText: image.altText || null,
          metadata: { source: 'url' },
        },
        select: { uuid: true },
      });
      normalized.push({ ...image, mediaAssetUuid: asset.uuid });
    }
  }

  const uuids = normalized.map((image) => image.mediaAssetUuid).filter(Boolean);
  const assets = uuids.length
    ? await client.mediaAsset.findMany({ where: { uuid: { in: uuids }, deletedAt: null }, select: { id: true, uuid: true } })
    : [];

  if (assets.length !== uuids.length) {
    throw ApiError.unprocessable('One or more images are invalid');
  }

  const assetIdByUuid = new Map(assets.map((asset) => [asset.uuid, asset.id]));
  await client.productImage.deleteMany({ where: { productId } });
  if (!normalized.length) return;

  await client.productImage.createMany({
    data: normalized.map((image, index) => ({
      productId,
      mediaAssetId: assetIdByUuid.get(image.mediaAssetUuid),
      altText: image.altText,
      sortOrder: image.sortOrder ?? index,
      isPrimary: image.isPrimary ?? index === 0,
    })),
    skipDuplicates: true,
  });
};

const shouldUploadToCloudinary = () => {
  if (env.upload.driver !== 'cloudinary') return false;
  if (!isCloudinaryConfigured()) {
    throw ApiError.badRequest('Cloudinary chưa được cấu hình. Vui lòng cấu hình CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET hoặc đổi UPLOAD_DRIVER=local.');
  }
  return true;
};

const normalizeColumnKey = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const hasColumn = (row, keys) => {
  const wanted = new Set(keys.map(normalizeColumnKey));
  return Object.keys(row || {}).some((key) => wanted.has(normalizeColumnKey(key)));
};

const pickCell = (row, keys) => {
  const wanted = new Set(keys.map(normalizeColumnKey));
  for (const [key, value] of Object.entries(row || {})) {
    if (!wanted.has(normalizeColumnKey(key))) continue;
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
};

const normalizeDecimalInput = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
  let normalized = String(value).trim().replace(/\s/g, '');
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
    normalized = parts.length > 2 || last.length === 3
      ? normalized.replace(/\./g, '')
      : normalized;
  }

  return /^\d+(\.\d{1,2})?$/.test(normalized) ? normalized : null;
};

const parsePrice = (value, field, rowErrors) => {
  const normalized = normalizeDecimalInput(value);
  if (value === null || value === undefined || value === '') {
    rowErrors.push({ field, code: 'REQUIRED', message: field === 'price' ? 'Giá bán là bắt buộc' : `${field} is required` });
    return null;
  }
  if (!normalized) {
    rowErrors.push({ field, code: 'INVALID_PRICE', message: 'Giá bán phải là số hợp lệ, ví dụ 100000, 100,000 hoặc 100.000' });
    return null;
  }
  return normalized;
};

const parseOptionalPrice = (value, field, rowErrors) => {
  if (value === null || value === undefined || value === '') return null;
  const normalized = normalizeDecimalInput(value);
  if (!normalized) {
    rowErrors.push({ field, code: 'INVALID_PRICE', message: `${field} phải là số hợp lệ` });
    return null;
  }
  return normalized;
};

const parseStock = (value, rowErrors, rowWarnings) => {
  if (value === null || value === undefined || value === '') {
    rowWarnings.push({ field: 'stock', code: 'BLANK_STOCK', message: 'Tồn kho đang trống. Khi cập nhật SKU cũ hệ thống sẽ giữ tồn kho cũ; khi tạo mới sẽ lưu 0.' });
    return null;
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= 0) return value;
    rowErrors.push({ field: 'stock', code: 'INVALID_STOCK', message: 'Tồn kho phải là số nguyên không âm' });
    return null;
  }
  const normalized = String(value).trim().replace(/\s/g, '').replace(/,/g, '').replace(/\./g, '');
  if (!/^\d+$/.test(normalized)) {
    rowErrors.push({ field: 'stock', code: 'INVALID_STOCK', message: 'Tồn kho phải là số nguyên không âm' });
    return null;
  }
  return Number(normalized);
};

const splitCategoryPath = (value) => String(value || '')
  .split(/[>\/\\|;]+/)
  .map((item) => item.trim())
  .filter(Boolean);

const ensureProductCategoryPath = async (tx, categoryPath) => {
  const parts = Array.isArray(categoryPath) ? categoryPath : splitCategoryPath(categoryPath);
  let parentId = null;
  let current = null;

  for (const part of parts) {
    const slug = ensureSlug(parentId ? `${current?.slug || 'category'}-${part}` : part);
    current = await tx.productCategory.upsert({
      where: { slug },
      update: { name: part, parentId, deletedAt: null },
      create: { name: part, slug, parentId },
      select: { id: true, slug: true },
    });
    parentId = current.id;
  }

  return current?.id || null;
};

const parseImageUrls = (value, rowWarnings) => {
  if (value === null || value === undefined || value === '') return [];
  const urls = String(value)
    .split(/[,\n;|]+/)
    .map((url) => url.trim())
    .filter(Boolean);

  const accepted = [];
  let invalidCount = 0;
  for (const url of urls) {
    const validation = validateRemoteImageUrl(url);
    if (!validation.ok) {
      invalidCount += 1;
      rowWarnings.push({ field: 'images', code: validation.code || 'INVALID_IMAGE_URL', message: validation.message });
      continue;
    }
    if (!accepted.includes(validation.url)) accepted.push(validation.url);
  }

  if (invalidCount > 0) {
    rowWarnings.push({ field: 'images', code: 'SOME_IMAGE_URLS_SKIPPED', message: 'Một số URL ảnh không hợp lệ đã bị bỏ qua' });
  }

  return accepted;
};

const parseKiotBoolean = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const text = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'co', 'có', 'dang kinh doanh', 'active', 'x'].includes(text)) return true;
  if (['0', 'false', 'no', 'n', 'khong', 'không', 'inactive', 'ngung', 'ngừng'].includes(text)) return false;
  return fallback;
};

const parseImportStatus = (raw) => {
  const direct = pickCell(raw, ['status', 'Status', 'Trạng thái', 'Trang thai']);
  if (direct) {
    const value = String(direct).trim().toUpperCase();
    if (['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(value)) return value;
  }

  const isSelling = parseKiotBoolean(pickCell(raw, ['Đang kinh doanh', 'Dang kinh doanh']), true);
  return isSelling ? 'ACTIVE' : 'INACTIVE';
};

const excelSerialToIsoDate = (value) => {
  if (typeof value !== 'number' || value < 1) return value;
  const parsed = XLSX.SSF.parse_date_code(value);
  if (!parsed) return value;
  const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, Math.floor(parsed.S || 0)));
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const normalizeRawKiotData = (raw) => {
  const normalized = { ...raw };
  for (const [key, value] of Object.entries(normalized)) {
    if (/thời gian|thoi gian|hạn sử dụng|han su dung/i.test(key)) {
      normalized[key] = excelSerialToIsoDate(value);
    }
  }
  return normalized;
};

const KIOT_COLUMN_ALIASES = {
  sku: ['sku', 'SKU', 'Mã hàng', 'Ma hang', 'Mã sản phẩm', 'Ma san pham'],
  barcode: ['barcode', 'Barcode', 'Mã vạch', 'Ma vach'],
  name: ['name', 'Name', 'Tên sản phẩm', 'Tên hàng', 'Ten san pham', 'Ten hang'],
  category: ['category', 'Category', 'Danh mục', 'Nhóm hàng', 'Nhóm hàng(3 Cấp)', 'Nhóm hàng (3 Cấp)', 'Nhom hang', 'Nhom hang 3 cap'],
  brand: ['brand', 'Brand', 'Thương hiệu', 'Thuong hieu'],
  price: ['price', 'Price', 'Giá', 'Giá bán', 'Gia', 'Gia ban'],
  compareAtPrice: ['compareAtPrice', 'compare_at_price', 'Giá cũ', 'Giá niêm yết', 'Gia cu', 'Gia niem yet'],
  stock: ['stock', 'Stock', 'Tồn kho', 'Ton kho'],
  unit: ['unit', 'Unit', 'ĐVT', 'DVT', 'Đơn vị tính', 'Don vi tinh'],
  images: ['imageUrls', 'image_urls', 'Ảnh', 'Hình ảnh', 'Hình ảnh (url1,url2...)', 'Hình ảnh (url1, url2...)', 'Hinh anh', 'Hinh anh url1 url2', 'Anh'],
  shortDescription: ['shortDescription', 'short_description', 'Mô tả ngắn', 'Mo ta ngan'],
  description: ['description', 'Description', 'Mô tả', 'Mo ta'],
  benefits: ['benefits', 'Benefits', 'Công dụng', 'Cong dung', 'Lợi ích', 'Loi ich'],
  howToUse: ['howToUse', 'how_to_use', 'Cách sử dụng', 'Cach su dung', 'Cách dùng', 'Cach dung'],
  skinType: ['skinType', 'skin_type', 'Loại da phù hợp', 'Loai da phu hop', 'Loại da', 'Loai da'],
  ingredients: ['ingredients', 'Ingredients', 'Thành phần', 'Thanh phan'],
  caution: ['caution', 'Caution', 'Lưu ý sử dụng', 'Luu y su dung', 'Lưu ý', 'Luu y'],
};

const validateImportHeaders = (rows) => {
  const errors = [];
  if (!rows.length) {
    errors.push({ row: null, field: 'file', code: 'EMPTY_FILE', message: 'File không có dòng dữ liệu sản phẩm' });
    return errors;
  }

  const first = rows[0] || {};
  for (const [field, aliases] of Object.entries({ sku: KIOT_COLUMN_ALIASES.sku, name: KIOT_COLUMN_ALIASES.name, price: KIOT_COLUMN_ALIASES.price })) {
    if (!hasColumn(first, aliases)) {
      errors.push({ row: null, field, code: 'MISSING_COLUMN', message: `File thiếu cột bắt buộc: ${field === 'sku' ? 'Mã hàng' : field === 'name' ? 'Tên hàng' : 'Giá bán'}` });
    }
  }
  return errors;
};

const setImportRowStatus = (row) => {
  if (row.errors?.some((error) => error.code === 'DUPLICATE_IN_FILE')) {
    row.action = 'DUPLICATE_IN_FILE';
    row.status = 'DUPLICATE_IN_FILE';
    return row;
  }
  if (row.errors?.length) {
    row.action = 'INVALID';
    row.status = 'INVALID';
    return row;
  }
  row.action = row.action || 'NEW';
  row.status = row.warnings?.length ? 'WARNING' : row.action;
  return row;
};

const parseKiotRowsFromRaw = async (rawRows) => {
  const globalErrors = validateImportHeaders(rawRows);
  const skuCounts = new Map();

  const rows = rawRows.map((raw, index) => {
    const rowNumber = index + 2;
    const rowErrors = [];
    const rowWarnings = [];
    const normalizedRaw = normalizeRawKiotData(raw);
    const name = readImportText(raw, KIOT_COLUMN_ALIASES.name);
    const sku = readImportText(raw, KIOT_COLUMN_ALIASES.sku);
    const barcode = readImportText(raw, KIOT_COLUMN_ALIASES.barcode);
    const price = parsePrice(pickCell(raw, KIOT_COLUMN_ALIASES.price), 'price', rowErrors);
    const compareAtPrice = parseOptionalPrice(pickCell(raw, KIOT_COLUMN_ALIASES.compareAtPrice), 'compareAtPrice', rowErrors);
    const stock = parseStock(pickCell(raw, KIOT_COLUMN_ALIASES.stock), rowErrors, rowWarnings);
    const imageUrls = parseImageUrls(pickCell(raw, KIOT_COLUMN_ALIASES.images), rowWarnings);
    const normalizedSku = sku || '';

    if (!normalizedSku) rowErrors.push({ field: 'sku', code: 'REQUIRED', message: 'Mã hàng là bắt buộc để upsert sản phẩm' });
    if (normalizedSku) skuCounts.set(normalizedSku, (skuCounts.get(normalizedSku) || 0) + 1);
    if (!name) rowErrors.push({ field: 'name', code: 'REQUIRED', message: 'Tên hàng là bắt buộc' });

    const categoryName = readImportText(raw, KIOT_COLUMN_ALIASES.category);
    const brandName = readImportText(raw, KIOT_COLUMN_ALIASES.brand);
    const unit = readImportText(raw, KIOT_COLUMN_ALIASES.unit);

    return setImportRowStatus({
      rowNumber,
      sku: normalizedSku || null,
      barcode,
      name: name || '',
      price,
      stock,
      unit,
      brand: brandName,
      brandName,
      category: categoryName,
      categoryName,
      mainImage: imageUrls[0] || null,
      imageUrls,
      status: 'NEW',
      action: 'NEW',
      productStatus: parseImportStatus(raw),
      skinType: readImportText(raw, KIOT_COLUMN_ALIASES.skinType),
      shortDescription: readImportText(raw, KIOT_COLUMN_ALIASES.shortDescription),
      description: readImportText(raw, KIOT_COLUMN_ALIASES.description),
      ingredients: readImportText(raw, KIOT_COLUMN_ALIASES.ingredients),
      howToUse: readImportText(raw, KIOT_COLUMN_ALIASES.howToUse),
      benefits: readImportText(raw, KIOT_COLUMN_ALIASES.benefits),
      caution: readImportText(raw, KIOT_COLUMN_ALIASES.caution),
      compareAtPrice,
      currency: String(pickCell(raw, ['currency', 'Currency', 'Tiền tệ', 'Tien te']) || 'VND').trim().toUpperCase().slice(0, 3),
      isFeatured: parseKiotBoolean(pickCell(raw, ['isFeatured', 'is_featured', 'Nổi bật', 'Noi bat']), false),
      warnings: rowWarnings,
      errors: rowErrors,
      rawImportData: { ...normalizedRaw, imageUrls },
    });
  });

  const duplicateSkus = new Set([...skuCounts.entries()].filter(([, count]) => count > 1).map(([sku]) => sku));
  for (const row of rows) {
    if (row.sku && duplicateSkus.has(row.sku)) {
      row.errors.push({ field: 'sku', code: 'DUPLICATE_IN_FILE', message: `Mã hàng bị trùng trong file: ${row.sku}. Vì an toàn, tất cả dòng trùng SKU này sẽ không được import.` });
    }
    setImportRowStatus(row);
  }

  await enrichImportRowsWithDatabaseWarnings(rows);
  rows.forEach(setImportRowStatus);
  return { rows, errors: globalErrors, totalRows: rawRows.length };
};
const parseProductImportFile = async (filePath) => {
  let workbook;
  try {
    workbook = XLSX.readFile(filePath, { cellDates: false });
  } catch (error) {
    throw ApiError.badRequest('File Excel không đọc được. Vui lòng kiểm tra đúng định dạng .xlsx chuẩn');
  }
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw ApiError.badRequest('File Excel không có worksheet');
  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: null, raw: true });
  return parseKiotRowsFromRaw(rawRows);
};

const enrichImportRowsWithDatabaseWarnings = async (rows) => {
  const skus = rows.map((row) => row.sku).filter(Boolean);
  const barcodes = rows.map((row) => row.barcode).filter(Boolean);
  const [existingBySku, existingByBarcode] = await Promise.all([
    skus.length ? prisma.product.findMany({
      where: { sku: { in: skus }, deletedAt: null },
      select: {
        id: true,
        sku: true,
        barcode: true,
        name: true,
        description: true,
        benefits: true,
        howToUse: true,
        skinType: true,
        ingredients: true,
        caution: true,
        _count: { select: { images: true } },
      },
    }) : [],
    barcodes.length ? prisma.product.findMany({ where: { barcode: { in: barcodes }, deletedAt: null }, select: { sku: true, barcode: true, name: true } }) : [],
  ]);

  const skuMap = new Map(existingBySku.map((item) => [item.sku, item]));
  const barcodeMap = new Map(existingByBarcode.map((item) => [item.barcode, item]));
  for (const row of rows) {
    const existing = row.sku ? skuMap.get(row.sku) : null;
    if (existing) {
      row.existingProductName = existing.name;
      if (!row.errors?.length) row.action = 'UPDATE';
      row.warnings.push({ field: 'sku', code: 'UPDATE_EXISTING_PRODUCT', message: `SKU ${row.sku} đã tồn tại. Khi import sẽ cập nhật sản phẩm cũ: ${existing.name}` });

      for (const field of IMPORTANT_IMPORT_FIELDS) {
        const label = IMPORTANT_IMPORT_FIELD_LABELS[field] || field;
        if (!hasImportValue(row[field]) && hasImportValue(existing[field])) {
          row.warnings.push({ field, code: 'KEEP_EXISTING_VALUE', message: `SKU ${row.sku} đã tồn tại. Cột ${label} đang trống nên hệ thống sẽ giữ dữ liệu cũ.` });
        } else if (hasImportValue(row[field]) && hasImportValue(existing[field])) {
          row.warnings.push({ field, code: 'WILL_UPDATE_IMPORTANT_VALUE', message: `SKU ${row.sku} đã tồn tại. Cột ${label} có dữ liệu trong file nên sẽ cập nhật dữ liệu cũ.` });
        }
      }

      if (!row.imageUrls?.length && existing._count?.images > 0) {
        row.warnings.push({ field: 'images', code: 'KEEP_EXISTING_IMAGES', message: `SKU ${row.sku} đã tồn tại. Cột Hình ảnh đang trống nên hệ thống sẽ giữ ảnh cũ.` });
      } else if (row.imageUrls?.length && existing._count?.images > 0) {
        row.warnings.push({ field: 'images', code: 'WILL_REPLACE_IMAGES', message: `SKU ${row.sku} đã tồn tại. File có ảnh mới nên hệ thống sẽ thay bộ ảnh sản phẩm hiện tại.` });
      }
    } else if (!row.errors?.length) {
      row.action = 'NEW';
    }

    if (row.barcode && barcodeMap.has(row.barcode) && barcodeMap.get(row.barcode).sku !== row.sku) {
      row.errors.push({ field: 'barcode', code: 'BARCODE_USED_BY_OTHER_SKU', message: `Mã vạch đang thuộc mã hàng khác: ${barcodeMap.get(row.barcode).sku || 'không có SKU'}` });
    }
    setImportRowStatus(row);
  }
};
const buildPreviewRow = (row) => ({
  rowNumber: row.rowNumber,
  sku: row.sku,
  name: row.name,
  action: row.action,
  status: row.status,
  price: row.price === null ? null : Number(row.price),
  stock: row.stock ?? null,
  brand: row.brandName || row.brand || null,
  category: row.categoryName || row.category || null,
  description: row.description || null,
  benefits: row.benefits || null,
  howToUse: row.howToUse || null,
  skinType: row.skinType || null,
  ingredients: row.ingredients || null,
  caution: row.caution || null,
  mainImage: row.mainImage || null,
  imageCount: Array.isArray(row.imageUrls) ? row.imageUrls.length : 0,
  productStatus: row.productStatus,
  existingProductName: row.existingProductName || null,
  warnings: row.warnings || [],
  errors: row.errors || [],
});

const buildPreviewPayload = (job, parsed) => {
  const invalidRows = parsed.rows.filter((row) => row.errors.length).length;
  const warningRows = parsed.rows.filter((row) => !row.errors.length && row.warnings.length).length;
  const newRows = parsed.rows.filter((row) => row.action === 'NEW' && !row.errors.length).length;
  const updateRows = parsed.rows.filter((row) => row.action === 'UPDATE' && !row.errors.length).length;
  const duplicateRows = parsed.rows.filter((row) => row.errors.some((error) => error.code === 'DUPLICATE_IN_FILE')).length;
  return {
    importJobId: job.uuid,
    filename: job.originalName,
    totalRows: parsed.totalRows,
    validRows: parsed.totalRows - invalidRows,
    newRows,
    updateRows,
    invalidRows,
    warningRows,
    duplicateRows,
    rows: parsed.rows.map(buildPreviewRow),
    errors: parsed.errors || [],
  };
};

const importFilePathFromJob = (job) => {
  if (!job?.fileUrl) return null;
  const filename = path.basename(job.fileUrl);
  return localUploadFilePath(filename);
};

const createImportRows = async (tx, jobId, rows) => {
  await tx.importRow.deleteMany({ where: { importJobId: jobId } });
  if (!rows.length) return;
  await tx.importRow.createMany({
    data: rows.map((row) => ({
      uuid: randomUUID(),
      importJobId: jobId,
      rowNumber: row.rowNumber,
      sku: row.sku,
      status: row.status || (row.errors.length ? 'INVALID' : 'VALID'),
      message: row.errors.length ? row.errors.map((error) => error.message).join('; ') : row.warnings.length ? row.warnings.map((warning) => warning.message).join('; ') : null,
      warnings: row.warnings,
      errors: row.errors,
      rawData: row.rawImportData,
    })),
  });
};

const buildCreateProductDataFromImport = async (tx, row, categoryId, brandId) => ({
  name: row.name,
  sku: row.sku,
  barcode: row.barcode || null,
  categoryId,
  brandId,
  skinType: hasImportValue(row.skinType) ? normalizePlainText(row.skinType, 120) : null,
  stock: row.stock ?? 0,
  unit: row.unit || null,
  rawImportData: row.rawImportData,
  shortDescription: hasImportValue(row.shortDescription) ? normalizePlainText(row.shortDescription, 500) : null,
  description: hasImportValue(row.description) ? sanitizeRichHtml(row.description) : null,
  ingredients: hasImportValue(row.ingredients) ? sanitizeRichHtml(row.ingredients, 10000) : null,
  howToUse: hasImportValue(row.howToUse) ? sanitizeRichHtml(row.howToUse, 10000) : null,
  benefits: hasImportValue(row.benefits) ? sanitizeRichHtml(row.benefits, 10000) : null,
  caution: hasImportValue(row.caution) ? sanitizeRichHtml(row.caution, 10000) : null,
  price: row.price,
  compareAtPrice: row.compareAtPrice,
  currency: row.currency || 'VND',
  status: row.productStatus,
  isFeatured: row.isFeatured,
  publishedAt: row.productStatus === 'ACTIVE' ? new Date() : null,
  slug: await buildUniqueSlug({ base: row.name, model: tx.product }),
});

const buildUpdateProductDataFromImport = (row, categoryId, brandId) => {
  const data = {
    name: row.name,
    rawImportData: row.rawImportData,
    price: row.price,
    currency: row.currency || 'VND',
    status: row.productStatus,
    isFeatured: row.isFeatured,
    deletedAt: null,
  };

  if (row.productStatus === 'ACTIVE') data.publishedAt = new Date();
  if (hasImportValue(row.barcode)) data.barcode = row.barcode;
  if (hasImportValue(row.categoryName)) data.categoryId = categoryId;
  if (hasImportValue(row.brandName)) data.brandId = brandId;
  if (row.stock !== null && row.stock !== undefined) data.stock = row.stock;
  if (hasImportValue(row.unit)) data.unit = row.unit;
  if (row.compareAtPrice !== null && row.compareAtPrice !== undefined) data.compareAtPrice = row.compareAtPrice;
  if (hasImportValue(row.shortDescription)) data.shortDescription = normalizePlainText(row.shortDescription, 500);
  if (hasImportValue(row.description)) data.description = sanitizeRichHtml(row.description);
  if (hasImportValue(row.ingredients)) data.ingredients = sanitizeRichHtml(row.ingredients, 10000);
  if (hasImportValue(row.howToUse)) data.howToUse = sanitizeRichHtml(row.howToUse, 10000);
  if (hasImportValue(row.benefits)) data.benefits = sanitizeRichHtml(row.benefits, 10000);
  if (hasImportValue(row.caution)) data.caution = sanitizeRichHtml(row.caution, 10000);
  if (hasImportValue(row.skinType)) data.skinType = normalizePlainText(row.skinType, 120);

  return data;
};

const upsertProductFromImportRow = async (tx, row) => {
  let categoryId = null;
  if (row.categoryName) {
    categoryId = await ensureProductCategoryPath(tx, splitCategoryPath(row.categoryName));
  }

  let brandId = null;
  if (row.brandName) {
    const slug = ensureSlug(row.brandName);
    const brand = await tx.productBrand.upsert({
      where: { slug },
      update: { name: row.brandName, deletedAt: null },
      create: { name: row.brandName, slug },
      select: { id: true },
    });
    brandId = brand.id;
  }

  const existingProduct = await tx.product.findUnique({ where: { sku: row.sku }, select: { id: true } });
  const product = existingProduct
    ? await tx.product.update({ where: { id: existingProduct.id }, data: buildUpdateProductDataFromImport(row, categoryId, brandId) })
    : await tx.product.create({ data: await buildCreateProductDataFromImport(tx, row, categoryId, brandId) });

  if (row.imageUrls.length) {
    await syncProductImages(
      product.id,
      row.imageUrls.map((url, index) => ({ url, altText: row.name, sortOrder: index, isPrimary: index === 0 })),
      tx
    );
  }

  return { product, operation: existingProduct ? 'UPDATED' : 'CREATED' };
};

const ensureImportDuplicateSafety = async () => true;

export const adminService = {
  async getProductImportTemplate() {
    const workbook = XLSX.utils.book_new();
    workbook.Props = {
      Title: 'Mẫu import sản phẩm Kiot - Midi Cosmetics',
      Subject: 'Product import template',
      Author: 'Midi Cosmetics Admin',
      CreatedDate: new Date(),
    };

    const dataRows = [KIOT_IMPORT_TEMPLATE_COLUMNS, KIOT_IMPORT_TEMPLATE_COLUMNS.map((column) => KIOT_IMPORT_TEMPLATE_SAMPLE_ROW[column] ?? '')];
    const worksheet = XLSX.utils.aoa_to_sheet(dataRows);
    worksheet['!cols'] = KIOT_IMPORT_TEMPLATE_COLUMNS.map((column) => ({ wch: Math.min(Math.max(column.length + 4, 14), 36) }));
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import sản phẩm');

    const guideRows = [
      ['Hướng dẫn', 'Giá trị'],
      ['SKU / Mã hàng', 'Bắt buộc. SKU là khóa upsert: SKU mới sẽ tạo mới, SKU cũ sẽ cập nhật.'],
      ['Cột tư vấn', 'Mô tả, Công dụng, Cách sử dụng, Loại da phù hợp, Thành phần, Lưu ý sử dụng.'],
      ['Khi cập nhật SKU cũ', 'Nếu cột tư vấn hoặc hình ảnh để trống, hệ thống giữ dữ liệu cũ và hiển thị cảnh báo ở preview.'],
      ['Trùng SKU trong cùng file', 'Tất cả dòng trùng SKU trong file sẽ bị chặn để tránh ghi đè nhầm.'],
      ['Ảnh', 'Nhập URL https hoặc http hợp lệ, nhiều ảnh phân tách bằng dấu phẩy, chấm phẩy hoặc xuống dòng.'],
    ];
    const guideSheet = XLSX.utils.aoa_to_sheet(guideRows);
    guideSheet['!cols'] = [{ wch: 28 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(workbook, guideSheet, 'Huong dan');

    return {
      filename: PRODUCT_IMPORT_TEMPLATE_FILENAME,
      contentType: XLSX_CONTENT_TYPE,
      buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true }),
    };
  },

  async getDashboard() {
    const [posts, products, media, imports, recentPosts, recentProducts, activeProducts, publishedPosts, featuredProducts, featuredPosts, latestImport] = await Promise.all([
      prisma.blogPost.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.product.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.mediaAsset.count({ where: { deletedAt: null } }),
      prisma.importJob.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.blogPost.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5, include: postInclude }),
      prisma.product.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5, include: productInclude }),
      prisma.product.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.blogPost.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
      prisma.product.count({ where: { deletedAt: null, status: 'ACTIVE', isFeatured: true } }),
      prisma.blogPost.count({ where: { deletedAt: null, status: 'PUBLISHED', isFeatured: true } }),
      prisma.importJob.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, select: { uuid: true, originalName: true, status: true, totalRows: true, successRows: true, failedRows: true, createdAt: true } }),
    ]);

    return {
      counters: {
        postsByStatus: posts.reduce((acc, row) => ({ ...acc, [row.status]: row._count._all }), {}),
        productsByStatus: products.reduce((acc, row) => ({ ...acc, [row.status]: row._count._all }), {}),
        importJobsByStatus: imports.reduce((acc, row) => ({ ...acc, [row.status]: row._count._all }), {}),
        mediaAssets: media,
        activeProducts,
        publishedPosts,
        featuredProducts,
        featuredPosts,
      },
      latestImport,
      recent: { posts: recentPosts, products: recentProducts },
    };
  },

  async listCategories(type, query) {
    const model = type === 'blog' ? prisma.blogCategory : prisma.productCategory;
    const { page, limit, search, includeDeleted } = query;
    return listWithPagination({
      model,
      where: { ...(includeDeleted ? {} : { deletedAt: null }), ...buildSearchWhere(['name', 'slug', 'description'], search) },
      page,
      limit,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: categorySelect,
    });
  },

  async createCategory(type, body) {
    const model = type === 'blog' ? prisma.blogCategory : prisma.productCategory;
    const data = await buildCategoryData({ body, model });
    return model.create({ data, select: categorySelect });
  },

  async updateCategory(type, uuid, body) {
    const model = type === 'blog' ? prisma.blogCategory : prisma.productCategory;
    const current = await findByUuidOrThrow(model, uuid);
    const data = await buildCategoryData({ body, model });
    if (data.parentId && data.parentId === current.id) throw ApiError.badRequest('Category cannot be its own parent');
    return model.update({ where: { id: current.id }, data, select: categorySelect });
  },

  async deleteCategory(type, uuid) {
    const model = type === 'blog' ? prisma.blogCategory : prisma.productCategory;
    const current = await findByUuidOrThrow(model, uuid);
    await model.update({ where: { id: current.id }, data: { deletedAt: new Date() } });
    return true;
  },

  async listTags(query) {
    const { page, limit, search, includeDeleted } = query;
    return listWithPagination({
      model: prisma.blogTag,
      where: { ...(includeDeleted ? {} : { deletedAt: null }), ...buildSearchWhere(['name', 'slug'], search) },
      page,
      limit,
      orderBy: { name: 'asc' },
      select: tagSelect,
    });
  },

  async createTag(body) {
    const slug = await buildUniqueSlug({ base: body.slug || body.name, model: prisma.blogTag });
    return prisma.blogTag.create({ data: { name: body.name, slug }, select: tagSelect });
  },

  async updateTag(uuid, body) {
    const current = await findByUuidOrThrow(prisma.blogTag, uuid);
    const slug = body.slug || body.name ? await buildUniqueSlug({ base: body.slug || body.name, model: prisma.blogTag, existingUuid: uuid }) : undefined;
    return prisma.blogTag.update({ where: { id: current.id }, data: compactObject({ name: body.name, slug }), select: tagSelect });
  },

  async deleteTag(uuid) {
    const current = await findByUuidOrThrow(prisma.blogTag, uuid);
    await prisma.blogTag.update({ where: { id: current.id }, data: { deletedAt: new Date() } });
    return true;
  },

  async listBlogPosts(query) {
    const { page, limit, search, status, includeDeleted } = query;
    return listWithPagination({
      model: prisma.blogPost,
      where: { ...(includeDeleted ? {} : { deletedAt: null }), ...(status ? { status } : {}), ...buildSearchWhere(['title', 'slug', 'excerpt'], search) },
      page,
      limit,
      include: postInclude,
    });
  },

  async getBlogPost(uuid) {
    return findByUuidOrThrow(prisma.blogPost, uuid, { includeDeleted: true, query: { include: postInclude } });
  },

  async createBlogPost(actor, body) {
    const data = await buildBlogPostData(body);
    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.blogPost.create({ data: { ...data, authorId: actor.id } });
      await syncBlogTags(created.id, body.tagUuids, tx);
      return created;
    });
    return this.getBlogPost(post.uuid);
  },

  async updateBlogPost(actor, uuid, body) {
    const current = await findByUuidOrThrow(prisma.blogPost, uuid, { includeDeleted: true });
    
    const data = await buildBlogPostData(body, uuid);
    await prisma.$transaction(async (tx) => {
      await tx.blogPost.update({ where: { id: current.id }, data });
      await syncBlogTags(current.id, body.tagUuids, tx);
    });
    return this.getBlogPost(uuid);
  },

  async deleteBlogPost(actor, uuid) {
    const current = await findByUuidOrThrow(prisma.blogPost, uuid, { includeDeleted: true });
    
    await prisma.blogPost.update({ where: { id: current.id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
    return true;
  },

  async setBlogPostStatus(actor, uuid, status) {
    const current = await findByUuidOrThrow(prisma.blogPost, uuid, { includeDeleted: true });
    
    await prisma.blogPost.update({
      where: { id: current.id },
      data: { status, publishedAt: status === 'PUBLISHED' ? current.publishedAt || new Date() : current.publishedAt },
    });
    return this.getBlogPost(uuid);
  },

  async setBlogPostFeatured(uuid, { isFeatured, featuredOrder = 0 }) {
    const current = await findByUuidOrThrow(prisma.blogPost, uuid, { includeDeleted: true });
    await prisma.blogPost.update({
      where: { id: current.id },
      data: { isFeatured: Boolean(isFeatured), featuredOrder: Number(featuredOrder) || 0 },
    });
    return this.getBlogPost(uuid);
  },

  async listBrands(query) {
    const { page, limit, search, includeDeleted } = query;
    return listWithPagination({
      model: prisma.productBrand,
      where: { ...(includeDeleted ? {} : { deletedAt: null }), ...buildSearchWhere(['name', 'slug', 'country', 'description'], search) },
      page,
      limit,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  },

  async createBrand(body) {
    const slug = await buildUniqueSlug({ base: body.slug || body.name, model: prisma.productBrand });
    return prisma.productBrand.create({ data: { ...body, slug } });
  },

  async updateBrand(uuid, body) {
    const current = await findByUuidOrThrow(prisma.productBrand, uuid);
    const slug = body.slug || body.name ? await buildUniqueSlug({ base: body.slug || body.name, model: prisma.productBrand, existingUuid: uuid }) : undefined;
    return prisma.productBrand.update({ where: { id: current.id }, data: compactObject({ ...body, slug }) });
  },

  async deleteBrand(uuid) {
    const current = await findByUuidOrThrow(prisma.productBrand, uuid);
    await prisma.productBrand.update({ where: { id: current.id }, data: { deletedAt: new Date() } });
    return true;
  },

  async listCollections(query) {
    const { page, limit, search, includeDeleted } = query;
    return listWithPagination({
      model: prisma.productCollection,
      where: { ...(includeDeleted ? {} : { deletedAt: null }), ...buildSearchWhere(['name', 'slug', 'description'], search) },
      page,
      limit,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  },

  async createCollection(body) {
    const slug = await buildUniqueSlug({ base: body.slug || body.name, model: prisma.productCollection });
    return prisma.productCollection.create({ data: { ...body, slug } });
  },

  async updateCollection(uuid, body) {
    const current = await findByUuidOrThrow(prisma.productCollection, uuid);
    const slug = body.slug || body.name ? await buildUniqueSlug({ base: body.slug || body.name, model: prisma.productCollection, existingUuid: uuid }) : undefined;
    return prisma.productCollection.update({ where: { id: current.id }, data: compactObject({ ...body, slug }) });
  },

  async deleteCollection(uuid) {
    const current = await findByUuidOrThrow(prisma.productCollection, uuid);
    await prisma.productCollection.update({ where: { id: current.id }, data: { deletedAt: new Date() } });
    return true;
  },

  async listProducts(query) {
    const { page, limit, search, status, includeDeleted, categoryUuid, brandUuid } = query;
    const categoryId = categoryUuid ? await getIdByUuid(prisma.productCategory, categoryUuid, 'category') : undefined;
    const brandId = brandUuid ? await getIdByUuid(prisma.productBrand, brandUuid, 'brand') : undefined;
    return listWithPagination({
      model: prisma.product,
      where: { ...(includeDeleted ? {} : { deletedAt: null }), ...(status ? { status } : {}), ...(categoryId ? { categoryId } : {}), ...(brandId ? { brandId } : {}), ...buildSearchWhere(['name', 'slug', 'sku', 'shortDescription'], search) },
      page,
      limit,
      include: productInclude,
    });
  },

  async getProduct(uuid) {
    return findByUuidOrThrow(prisma.product, uuid, { includeDeleted: true, query: { include: productInclude } });
  },

  async createProduct(body) {
    const data = await buildProductData(body);
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({ data });
      await syncProductCollections(created.id, body.collectionUuids, tx);
      await syncProductImages(created.id, body.images, tx);
      return created;
    });
    return this.getProduct(product.uuid);
  },

  async updateProduct(uuid, body) {
    const current = await findByUuidOrThrow(prisma.product, uuid, { includeDeleted: true });
    const data = await buildProductData(body, uuid);
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id: current.id }, data });
      await syncProductCollections(current.id, body.collectionUuids, tx);
      await syncProductImages(current.id, body.images, tx);
    });
    return this.getProduct(uuid);
  },

  async deleteProduct(uuid) {
    const current = await findByUuidOrThrow(prisma.product, uuid, { includeDeleted: true });
    await prisma.product.update({ where: { id: current.id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
    return true;
  },

  async setProductStatus(uuid, status) {
    const current = await findByUuidOrThrow(prisma.product, uuid, { includeDeleted: true });
    await prisma.product.update({
      where: { id: current.id },
      data: { status, publishedAt: status === 'ACTIVE' ? current.publishedAt || new Date() : current.publishedAt },
    });
    return this.getProduct(uuid);
  },

  async setProductFeatured(uuid, { isFeatured, featuredOrder = 0 }) {
    const current = await findByUuidOrThrow(prisma.product, uuid, { includeDeleted: true });
    await prisma.product.update({
      where: { id: current.id },
      data: { isFeatured: Boolean(isFeatured), featuredOrder: Number(featuredOrder) || 0 },
    });
    return this.getProduct(uuid);
  },

  async listMedia(query) {
    const { page, limit, search, includeDeleted } = query;
    return listWithPagination({
      model: prisma.mediaAsset,
      where: { ...(includeDeleted ? {} : { deletedAt: null }), ...buildSearchWhere(['originalName', 'fileName', 'altText'], search) },
      page,
      limit,
      select: mediaSelect,
    });
  },

  async uploadImage(actor, file, body = {}) {
    if (!file) throw ApiError.badRequest('Image file is required');
    let media;

    if (shouldUploadToCloudinary()) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'midi-cosmetics',
        resource_type: 'image',
      });
      media = {
        provider: 'CLOUDINARY',
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
      };
      await fs.unlink(file.path).catch(() => null);
    } else {
      media = {
        provider: 'LOCAL',
        publicId: null,
        secureUrl: buildLocalUploadUrl(file.filename),
        width: null,
        height: null,
      };
    }

    return prisma.mediaAsset.create({
      data: {
        uploaderId: actor.id,
        provider: media.provider,
        publicId: media.publicId,
        originalName: file.originalname,
        fileName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: BigInt(file.size),
        width: media.width,
        height: media.height,
        secureUrl: media.secureUrl,
        altText: body.altText || null,
        metadata: { encoding: file.encoding },
      },
      select: mediaSelect,
    });
  },

  async deleteMedia(uuid) {
    const current = await findByUuidOrThrow(prisma.mediaAsset, uuid, { includeDeleted: true });
    if (current.provider === 'CLOUDINARY' && current.publicId && shouldUploadToCloudinary()) {
      await cloudinary.uploader.destroy(current.publicId).catch(() => null);
    }
    if (current.provider === 'LOCAL' && current.fileName) {
      await fs.unlink(localUploadFilePath(current.fileName)).catch(() => null);
    }
    await prisma.mediaAsset.update({ where: { id: current.id }, data: { deletedAt: new Date() } });
    return true;
  },

  async listImportJobs(query) {
    const { page, limit, includeDeleted } = query;
    return listWithPagination({
      model: prisma.importJob,
      where: { ...(includeDeleted ? {} : { deletedAt: null }) },
      page,
      limit,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { uuid: true, fullName: true, email: true } } },
    });
  },

  async previewProductImport(actor, file) {
    if (!file) throw ApiError.badRequest('Excel file is required');

    const job = await prisma.importJob.create({
      data: {
        createdById: actor?.id || null,
        type: 'PRODUCTS',
        originalName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        status: 'PENDING',
      },
    });

    try {
      const parsed = await parseProductImportFile(file.path);
      const invalidRows = parsed.rows.filter((row) => row.errors.length).length;
      await prisma.$transaction(async (tx) => {
        await tx.importJob.update({
          where: { id: job.id },
          data: {
            totalRows: parsed.totalRows,
            successRows: 0,
            failedRows: invalidRows,
            errorReport: parsed.errors,
          },
        });
        await createImportRows(tx, job.id, parsed.rows);
      });

      return buildPreviewPayload(job, parsed);
    } catch (error) {
      await prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          totalRows: 0,
          successRows: 0,
          failedRows: 0,
          errorReport: [{ row: null, code: 'PREVIEW_FAILED', message: error.message }],
          completedAt: new Date(),
        },
      }).catch(() => null);
      throw error;
    }
  },

  async confirmProductImport(actor, importJobUuid) {
    const job = await prisma.importJob.findFirst({
      where: { uuid: importJobUuid, deletedAt: null, type: 'PRODUCTS' },
      include: { rows: true },
    });
    if (!job) throw ApiError.notFound('Import job not found');
    if (!['PENDING', 'FAILED'].includes(job.status)) {
      throw ApiError.badRequest('Import job has already been processed');
    }

    const filePath = importFilePathFromJob(job);
    if (!filePath) throw ApiError.badRequest('Import file path is missing');

    await prisma.importJob.update({ where: { id: job.id }, data: { status: 'PROCESSING', startedAt: new Date() } });

    try {
      await fs.access(filePath);
      const parsed = await parseProductImportFile(filePath);
      await prisma.$transaction(async (tx) => {
        await createImportRows(tx, job.id, parsed.rows);
      });

      let successRows = 0;
      let failedRows = 0;
      let skippedRows = 0;
      let createdProducts = 0;
      let updatedProducts = 0;
      const rowReports = [];

      for (const row of parsed.rows) {
        if (row.errors.length) {
          failedRows += 1;
          skippedRows += 1;
          rowReports.push({ row: row.rowNumber, sku: row.sku, status: 'SKIPPED', action: row.action, errors: row.errors, warnings: row.warnings });
          continue;
        }

        try {
          const importResult = await prisma.$transaction(async (tx) => {
            const result = await upsertProductFromImportRow(tx, row);
            await tx.importRow.update({
              where: { importJobId_rowNumber: { importJobId: job.id, rowNumber: row.rowNumber } },
              data: { status: 'SUCCESS', message: 'Imported successfully', warnings: row.warnings, errors: [] },
            });
            return result;
          });
          if (importResult.operation === 'CREATED') createdProducts += 1;
          if (importResult.operation === 'UPDATED') updatedProducts += 1;
          successRows += 1;
          rowReports.push({ row: row.rowNumber, sku: row.sku, status: 'SUCCESS', action: row.action, warnings: row.warnings, errors: [] });
        } catch (error) {
          failedRows += 1;
          const errors = [{ field: null, code: 'IMPORT_FAILED', message: error.message }];
          await prisma.importRow.update({
            where: { importJobId_rowNumber: { importJobId: job.id, rowNumber: row.rowNumber } },
            data: { status: 'FAILED', message: error.message, warnings: row.warnings, errors },
          }).catch(() => null);
          rowReports.push({ row: row.rowNumber, sku: row.sku, status: 'FAILED', action: row.action, warnings: row.warnings, errors });
        }
      }

      const updatedJob = await prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          totalRows: parsed.totalRows,
          successRows,
          failedRows,
          errorReport: rowReports.filter((row) => row.status === 'FAILED' || row.warnings?.length),
          completedAt: new Date(),
        },
        include: { createdBy: { select: { uuid: true, fullName: true, email: true } } },
      });

      return { ...updatedJob, summary: { createdCount: createdProducts, updatedCount: updatedProducts, skippedCount: skippedRows, failedCount: failedRows - skippedRows, createdProducts, updatedProducts } };
    } catch (error) {
      return prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          successRows: 0,
          failedRows: job.totalRows || 0,
          errorReport: [{ row: null, code: 'IMPORT_FAILED', message: error.message }],
          completedAt: new Date(),
        },
      });
    }
  },

  async importProducts(actor, file) {
    const preview = await this.previewProductImport(actor, file);
    return this.confirmProductImport(actor, preview.importJobId);
  },

  async listSettings(query = {}) {
    return prisma.siteSetting.findMany({
      where: query.group ? { group: query.group } : {},
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
  },

  async upsertSetting(body) {
    return prisma.siteSetting.upsert({
      where: { key: body.key },
      update: {
        value: body.value,
        type: body.type,
        group: body.group,
        description: body.description,
        isPublic: body.isPublic,
      },
      create: {
        key: body.key,
        value: body.value,
        type: body.type,
        group: body.group,
        description: body.description,
        isPublic: body.isPublic,
      },
    });
  },
};
