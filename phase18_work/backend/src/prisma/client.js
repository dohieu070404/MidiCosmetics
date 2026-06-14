import prismaPackage from '@prisma/client';

const { PrismaClient } = prismaPackage;
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDevelopment
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ]
      : [{ emit: 'event', level: 'error' }],
  });

if (env.isDevelopment) {
  globalForPrisma.prisma = prisma;

  prisma.$on('query', (event) => {
    logger.debug({ query: event.query, duration: event.duration }, 'Prisma query executed');
  });
}

prisma.$on('error', (event) => {
  logger.error({ event }, 'Prisma error');
});

prisma.$on('warn', (event) => {
  logger.warn({ event }, 'Prisma warning');
});
