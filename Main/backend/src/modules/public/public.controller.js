import { HTTP_STATUS } from '../../constants/http-status.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { publicService } from './public.service.js';

const ok = (res, message, data = {}, meta = {}) => res.success({ statusCode: HTTP_STATUS.OK, message, data, meta });

export const publicController = {
  home: asyncHandler(async (req, res) => ok(res, 'Home data fetched successfully', await publicService.getHome())),
  homepage: asyncHandler(async (req, res) => ok(res, 'Homepage settings fetched successfully', await publicService.getHome())),
  taxonomies: asyncHandler(async (req, res) => ok(res, 'Taxonomies fetched successfully', await publicService.getTaxonomies())),

  featuredBlogs: asyncHandler(async (req, res) => ok(res, 'Featured blogs fetched successfully', { blogs: await publicService.featuredBlogs() })),
  featuredProducts: asyncHandler(async (req, res) => ok(res, 'Featured products fetched successfully', { products: await publicService.featuredProducts() })),

  listBlogs: asyncHandler(async (req, res) => {
    const result = await publicService.listBlogs(req.validated.query);
    return ok(res, 'Blogs fetched successfully', { blogs: result.items }, result.pagination);
  }),
  getBlog: asyncHandler(async (req, res) => ok(res, 'Blog detail fetched successfully', await publicService.getBlog(req.validated.params.slug))),
  relatedBlogs: asyncHandler(async (req, res) => ok(res, 'Related blogs fetched successfully', { blogs: await publicService.relatedBlogs(req.validated.params.slug) })),

  listProducts: asyncHandler(async (req, res) => {
    const result = await publicService.listProducts(req.validated.query);
    return ok(res, 'Products fetched successfully', { products: result.items }, result.pagination);
  }),
  getProduct: asyncHandler(async (req, res) => ok(res, 'Product detail fetched successfully', await publicService.getProduct(req.validated.params.slug))),
  relatedProducts: asyncHandler(async (req, res) => ok(res, 'Related products fetched successfully', { products: await publicService.relatedProducts(req.validated.params.slug) })),
};
