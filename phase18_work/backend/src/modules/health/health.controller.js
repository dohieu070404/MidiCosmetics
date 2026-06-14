import { env } from '../../config/env.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { healthService } from './health.service.js';

const buildBaseHealth = () => ({
  status: 'ok',
  service: env.appName,
  environment: env.nodeEnv,
  uptimeSeconds: Math.round(process.uptime()),
  timestamp: new Date().toISOString(),
});

const safeDatabaseHealth = async () => {
  try {
    return await healthService.checkDatabase();
  } catch {
    return { status: 'down' };
  }
};

export const healthController = {
  live: asyncHandler(async (req, res) => {
    return res.status(200).json(buildBaseHealth());
  }),

  ready: asyncHandler(async (req, res) => {
    const database = await safeDatabaseHealth();

    return res.status(200).json({
      ...buildBaseHealth(),
      dependencies: {
        database,
      },
    });
  }),
};
