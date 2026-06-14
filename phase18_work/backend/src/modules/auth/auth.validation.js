import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: z.string().min(8).max(128),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const refreshTokenSchema = z.object({
  body: z.object({ refreshToken: z.string().min(20).optional() }).optional().default({}),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const logoutSchema = z.object({
  body: z.object({ refreshToken: z.string().min(20).optional() }).optional().default({}),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
