import { z } from 'zod';

const empty = z.object({}).optional();
const token = z.string().trim().min(32).max(160).regex(/^[A-Za-z0-9_-]+$/);

export const createQuoteSchema = z.object({
  body: z.object({
    items: z.array(z.object({ productUuid: z.string().uuid(), quantity: z.coerce.number().int().min(1).max(20) }).strict()).min(1).max(20),
    note: z.string().trim().max(1000).optional(),
    intent: z.literal('MESSENGER'),
    requestId: z.string().uuid(),
    recaptchaToken: z.string().trim().min(20).max(4096).optional(),
  }).strict(),
  params: empty,
  query: empty,
});

export const quoteTokenSchema = z.object({ body: empty, params: z.object({ token }), query: empty });

export const interestEventSchema = z.object({
  body: z.object({
    eventType: z.enum(['PRODUCT_VIEWED', 'ADDED_TO_CART', 'REMOVED_FROM_CART', 'QUANTITY_CHANGED']),
    productUuid: z.string().uuid(),
    metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  }).strict(),
  params: empty,
  query: empty,
});
