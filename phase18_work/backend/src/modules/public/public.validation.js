import { z } from 'zod';

const safeSearch = z.string().trim().max(150).refine((value) => !/[\u0000-\u001F\u007F<>]/.test(value), 'Từ khóa tìm kiếm chứa ký tự không hợp lệ').optional();
const safeSlug = z.string().trim().min(1).max(191).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'Slug không hợp lệ');
const safeTaxonomySlug = z.string().trim().max(191).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Slug không hợp lệ').optional();
const tagList = z.string().trim().max(300).refine((value) => value.split(',').every((tag) => !tag.trim() || /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(tag.trim())), 'Danh sách tag không hợp lệ').optional();
const publicSort = z.enum(['latest', 'popular', 'price_asc', 'price_desc', 'name_asc']).optional().default('latest');

const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
  search: safeSearch,
  category: safeTaxonomySlug,
  brand: safeTaxonomySlug,
  tags: tagList,
  sort: publicSort,
});

export const publicListSchema = z.object({ body: z.object({}).optional(), params: z.object({}).optional(), query: pagination });
export const slugSchema = z.object({ body: z.object({}).optional(), params: z.object({ slug: safeSlug }), query: z.object({}).optional() });
