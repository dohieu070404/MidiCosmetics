import { prisma } from '../../prisma/client.js';

export const healthService = {
  async checkDatabase() {
    const startedAt = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const durationMs = Math.round(performance.now() - startedAt);

    return {
      status: 'up',
      latencyMs: durationMs,
    };
  },
};
