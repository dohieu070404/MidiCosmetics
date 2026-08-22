import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { publicController } from '../../modules/public/public.controller.js';
import { publicListSchema, slugSchema } from '../../modules/public/public.validation.js';
import { quoteController } from '../../modules/quotes/quote.controller.js';
import {
  createQuoteSchema,
  interestEventSchema,
  quoteTokenSchema,
} from '../../modules/quotes/quote.validation.js';
import { analyticsRateLimiter, quoteRateLimiter } from '../../middlewares/rate-limiter.js';

const router = Router();

router.get('/home', publicController.home);
router.get('/homepage', publicController.homepage);
router.get('/about', publicController.about);
router.get('/taxonomies', publicController.taxonomies);

router.get('/posts/featured', publicController.featuredBlogs);
router.get('/posts', validate(publicListSchema), publicController.listBlogs);
router.get('/posts/search', validate(publicListSchema), publicController.listBlogs);
router.get('/posts/:slug', validate(slugSchema), publicController.getBlog);
router.get('/posts/:slug/related', validate(slugSchema), publicController.relatedBlogs);

router.get('/blogs/featured', publicController.featuredBlogs);
router.get('/blogs', validate(publicListSchema), publicController.listBlogs);
router.get('/blogs/search', validate(publicListSchema), publicController.listBlogs);
router.get('/blogs/:slug', validate(slugSchema), publicController.getBlog);
router.get('/blogs/:slug/related', validate(slugSchema), publicController.relatedBlogs);

router.get('/products/featured', publicController.featuredProducts);
router.get('/products', validate(publicListSchema), publicController.listProducts);
router.get('/products/search', validate(publicListSchema), publicController.listProducts);
router.get('/products/:slug', validate(slugSchema), publicController.getProduct);
router.get('/products/:slug/related', validate(slugSchema), publicController.relatedProducts);

router.get('/collections', validate(publicListSchema), publicController.listCollections);
router.get('/collections/:slug', validate(slugSchema), publicController.getCollection);

router.post('/quotes', quoteRateLimiter, validate(createQuoteSchema), quoteController.create);
router.get('/quotes/:token', validate(quoteTokenSchema), quoteController.get);
router.post(
  '/quotes/:token/messenger-opened',
  quoteRateLimiter,
  validate(quoteTokenSchema),
  quoteController.messengerOpened,
);
router.post(
  '/analytics/events',
  analyticsRateLimiter,
  validate(interestEventSchema),
  quoteController.track,
);

export default router;
