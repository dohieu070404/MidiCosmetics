import { createServer } from 'node:http';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const app = createApp();
const server = createServer(app);

const startServer = async () => {
  try {
    await connectDatabase();

    server.listen(env.port, '0.0.0.0', () => {
      logger.info(
        {
          port: env.port,
          env: env.nodeEnv,
          apiPrefix: env.apiPrefix,
        },
        'HTTP server started'
      );
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info({ signal }, 'Shutting down server');

  server.close(async () => {
    await disconnectDatabase();
    logger.info('Server shut down gracefully');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});

startServer();
