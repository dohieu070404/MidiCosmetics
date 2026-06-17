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
      customProps: (req) => ({ requestId: req.id }),
    })
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(compression());
  app.use(hpp());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser);
  app.use('/uploads', express.static(getUploadDir(), { immutable: true, maxAge: '1d' }));
  app.use(responseFormatter);
  app.use(globalRateLimiter);

  app.get('/health', healthController.ready);
  app.get('/', (req, res) =>
    res.success({
      message: 'Midi Cosmetics API is running',
      data: {
        service: env.appName,
        apiPrefix: env.apiPrefix,
        docs: 'Admin catalog, blog, media and Kiot Excel import APIs',
      },
    })
  );

  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
const app = createApp();

export default app;