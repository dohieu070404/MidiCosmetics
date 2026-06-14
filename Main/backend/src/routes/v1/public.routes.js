import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { publicController } from '../../modules/public/public.controller.js';
import { publicListSchema, slugSchema } from '../../modules/public/public.validation.js';

const router = Router();

router.get('/home', publicController.home);
router.get('/homepage', publicController.homepage);
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

export default router;
