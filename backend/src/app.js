import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import { corsOptions } from './config/cors.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { configureCloudinary } from './config/cloudinary.js';
import { globalRateLimiter } from './middlewares/rate-limiter.js';
import { cookieParser } from './middlewares/cookies.js';
import { requestId } from './middlewares/request-id.js';
import { responseFormatter } from './middlewares/response.js';
import { notFoundHandler } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';
import routes from './routes/index.js';
import { healthController } from './modules/health/health.controller.js';
import { ensureUploadDir, getUploadDir } from './utils/upload-paths.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.set('json escape', true);
  app.set('trust proxy', env.trustProxy);

  configureCloudinary();
  ensureUploadDir();

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      customLogLevel(req, res, err) {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      ...(env.isProduction
        ? {
            serializers: {
              err(error) {
                return {
                  type: error?.name || 'Error',
                  statusCode: error?.statusCode || undefined,
                  message: '[REDACTED_IN_PRODUCTION]',
                };
              },
            },
          }
        : {}),
      customProps: (req) => ({ requestId: req.id }),
    }),
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(compression());
  app.use(hpp());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser);
  app.use('/uploads', (req, res, next) => {
    if (!/^\/[a-zA-Z0-9._-]+\.(?:jpe?g|png|webp)$/i.test(req.path) || req.path.includes('..')) {
      return res.status(404).end();
    }
    return next();
  });
  app.use(
    '/uploads',
    express.static(getUploadDir(), {
      dotfiles: 'deny',
      index: false,
      immutable: true,
      maxAge: '1d',
      setHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'inline');
      },
    }),
  );
  app.use(`${env.apiPrefix}/auth`, (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    return next();
  });
  app.use(`${env.apiPrefix}/admin`, (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    return next();
  });
  app.use(responseFormatter);
  app.use(globalRateLimiter);

  app.get('/health', healthController.ready);
  app.get('/', (req, res) =>
    res.success({
      message: 'API is running',
      data: env.isProduction
        ? { status: 'ok' }
        : {
            service: env.appName,
            apiPrefix: env.apiPrefix,
          },
    }),
  );

  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
const app = createApp();

export default app;
