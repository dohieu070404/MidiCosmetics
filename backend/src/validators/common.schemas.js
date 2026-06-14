import { z } from 'zod';

export const uuidParamSchema = z.object({
  params: z.object({
    uuid: z.string().uuid(),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
  sortBy: z.string().trim().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
