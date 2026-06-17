import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize, requirePermission } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { excelUpload, imageUpload, validateUploadedImageFile, validateUploadedXlsxFile } from '../../middlewares/upload.js';
import { authRateLimiter, uploadRateLimiter } from '../../middlewares/rate-limiter.js';
import { ADMIN_ROLES, USER_ROLES } from '../../constants/roles.js';
import { adminController } from '../../modules/admin/admin.controller.js';
import {
  adminBootstrapSchema,
  adminProfilePasswordChangeRequestSchema,
  adminProfilePasswordChangeVerifySchema,
  brandSchema,
  blogPostSchema,
  categorySchema,
  collectionSchema,
  featuredToggleSchema,
  homepageFeaturedItemDeleteSchema,
  homepageFeaturedItemReorderSchema,
  homepageFeaturedItemSchema,
  homepageSectionReorderSchema,
  homepageSectionToggleSchema,
  homepageSectionUpdateSchema,
  listGenericSchema,
  listProductSchema,
  listSettingsSchema,
  notificationRecipientCreateSchema,
  notificationRecipientVerifySchema,
  productSchema,
  productStatusSchema,
  settingsSchema,
  tagSchema,
  updateBlogPostSchema,
  updateBrandSchema,
  updateCategorySchema,
  updateCollectionSchema,
  updateProductSchema,
  updateTagSchema,
  uuidOnlySchema,
} from '../../modules/admin/admin.validation.js';

const router = Router();

router.post('/bootstrap', authRateLimiter, validate(adminBootstrapSchema), adminController.bootstrapAdmin);

router.use(authenticate, authorize(...ADMIN_ROLES));

router.get('/permissions', adminController.permissions);
router.get('/profile', adminController.getProfile);
router.post('/profile/change-password/request', authRateLimiter, validate(adminProfilePasswordChangeRequestSchema), adminController.requestPasswordChange);
router.post('/profile/change-password/verify', authRateLimiter, validate(adminProfilePasswordChangeVerifySchema), adminController.verifyPasswordChange);
router.get('/dashboard', requirePermission('dashboard:read'), adminController.dashboard);

router.get('/notification-recipients', authorize(USER_ROLES.ADMIN), adminController.listNotificationRecipients);
router.post('/notification-recipients', authorize(USER_ROLES.ADMIN), validate(notificationRecipientCreateSchema), adminController.createNotificationRecipient);
router.post('/notification-recipients/verify', authorize(USER_ROLES.ADMIN), authRateLimiter, validate(notificationRecipientVerifySchema), adminController.verifyNotificationRecipient);
router.post('/notification-recipients/test', authorize(USER_ROLES.ADMIN), adminController.sendNotificationRecipientTest);
router.patch('/notification-recipients/:uuid/toggle', authorize(USER_ROLES.ADMIN), validate(uuidOnlySchema), adminController.toggleNotificationRecipient);
router.delete('/notification-recipients/:uuid', authorize(USER_ROLES.ADMIN), validate(uuidOnlySchema), adminController.deleteNotificationRecipient);



router.get('/homepage', authorize(USER_ROLES.ADMIN), adminController.getHomepageSettings);
router.put('/homepage/sections/:sectionId', authorize(USER_ROLES.ADMIN), validate(homepageSectionUpdateSchema), adminController.updateHomepageSection);
router.patch('/homepage/sections/:sectionId/toggle', authorize(USER_ROLES.ADMIN), validate(homepageSectionToggleSchema), adminController.toggleHomepageSection);
router.patch('/homepage/sections/reorder', authorize(USER_ROLES.ADMIN), validate(homepageSectionReorderSchema), adminController.reorderHomepageSections);
router.post('/homepage/sections/:sectionId/items', authorize(USER_ROLES.ADMIN), validate(homepageFeaturedItemSchema), adminController.addHomepageFeaturedItem);
router.delete('/homepage/sections/:sectionId/items/:itemId', authorize(USER_ROLES.ADMIN), validate(homepageFeaturedItemDeleteSchema), adminController.removeHomepageFeaturedItem);
router.patch('/homepage/sections/:sectionId/items/reorder', authorize(USER_ROLES.ADMIN), validate(homepageFeaturedItemReorderSchema), adminController.reorderHomepageFeaturedItems);

router.get('/blog/categories', requirePermission('blog:read'), validate(listGenericSchema), adminController.listBlogCategories);
router.post('/blog/categories', requirePermission('blog:create'), validate(categorySchema), adminController.createBlogCategory);
router.patch('/blog/categories/:uuid', requirePermission('blog:update'), validate(updateCategorySchema), adminController.updateBlogCategory);
router.delete('/blog/categories/:uuid', requirePermission('blog:delete'), validate(uuidOnlySchema), adminController.deleteBlogCategory);

router.get('/blog/tags', requirePermission('blog:read'), validate(listGenericSchema), adminController.listTags);
router.post('/blog/tags', requirePermission('blog:create'), validate(tagSchema), adminController.createTag);
router.patch('/blog/tags/:uuid', requirePermission('blog:update'), validate(updateTagSchema), adminController.updateTag);
router.delete('/blog/tags/:uuid', requirePermission('blog:delete'), validate(uuidOnlySchema), adminController.deleteTag);

router.get('/blog/posts', requirePermission('blog:read'), validate(listGenericSchema), adminController.listBlogPosts);
router.post('/blog/posts', requirePermission('blog:create'), validate(blogPostSchema), adminController.createBlogPost);
router.get('/blog/posts/:uuid', requirePermission('blog:read'), validate(uuidOnlySchema), adminController.getBlogPost);
router.patch('/blog/posts/:uuid', requirePermission('blog:update'), validate(updateBlogPostSchema), adminController.updateBlogPost);
router.patch('/blog/posts/:uuid/publish', requirePermission('blog:update'), validate(uuidOnlySchema), adminController.publishBlogPost);
router.patch('/blog/posts/:uuid/unpublish', requirePermission('blog:update'), validate(uuidOnlySchema), adminController.unpublishBlogPost);
router.patch('/blog/posts/:uuid/archive', requirePermission('blog:update'), validate(uuidOnlySchema), adminController.archiveBlogPost);
router.patch('/blog/posts/:uuid/featured', requirePermission('blog:update'), validate(featuredToggleSchema), adminController.updateBlogPostFeatured);
router.delete('/blog/posts/:uuid', requirePermission('blog:delete'), validate(uuidOnlySchema), adminController.deleteBlogPost);

router.get('/products/categories', requirePermission('products:read'), validate(listGenericSchema), adminController.listProductCategories);
router.post('/products/categories', requirePermission('products:create'), validate(categorySchema), adminController.createProductCategory);
router.patch('/products/categories/:uuid', requirePermission('products:update'), validate(updateCategorySchema), adminController.updateProductCategory);
router.delete('/products/categories/:uuid', requirePermission('products:delete'), validate(uuidOnlySchema), adminController.deleteProductCategory);

router.get('/products/brands', requirePermission('products:read'), validate(listGenericSchema), adminController.listBrands);
router.post('/products/brands', requirePermission('products:create'), validate(brandSchema), adminController.createBrand);
router.patch('/products/brands/:uuid', requirePermission('products:update'), validate(updateBrandSchema), adminController.updateBrand);
router.delete('/products/brands/:uuid', requirePermission('products:delete'), validate(uuidOnlySchema), adminController.deleteBrand);

router.get('/products/collections', requirePermission('products:read'), validate(listGenericSchema), adminController.listCollections);
router.post('/products/collections', requirePermission('products:create'), validate(collectionSchema), adminController.createCollection);
router.patch('/products/collections/:uuid', requirePermission('products:update'), validate(updateCollectionSchema), adminController.updateCollection);
router.delete('/products/collections/:uuid', requirePermission('products:delete'), validate(uuidOnlySchema), adminController.deleteCollection);

router.get('/products', requirePermission('products:read'), validate(listProductSchema), adminController.listProducts);
router.post('/products', requirePermission('products:create'), validate(productSchema), adminController.createProduct);
router.get('/products/:uuid', requirePermission('products:read'), validate(uuidOnlySchema), adminController.getProduct);
router.patch('/products/:uuid', requirePermission('products:update'), validate(updateProductSchema), adminController.updateProduct);
router.patch('/products/:uuid/activate', requirePermission('products:update'), validate(uuidOnlySchema), adminController.activateProduct);
router.patch('/products/:uuid/deactivate', requirePermission('products:update'), validate(uuidOnlySchema), adminController.deactivateProduct);
router.patch('/products/:uuid/status', requirePermission('products:update'), validate(productStatusSchema), adminController.updateProductStatus);
router.patch('/products/:uuid/archive', requirePermission('products:update'), validate(uuidOnlySchema), adminController.archiveProduct);
router.patch('/products/:uuid/featured', requirePermission('products:update'), validate(featuredToggleSchema), adminController.updateProductFeatured);
router.delete('/products/:uuid', requirePermission('products:delete'), validate(uuidOnlySchema), adminController.deleteProduct);

router.get('/media', requirePermission('media:read'), validate(listGenericSchema), adminController.listMedia);
router.post('/media/images', requirePermission('media:create'), uploadRateLimiter, imageUpload.single('file'), validateUploadedImageFile, adminController.uploadImage);
router.delete('/media/:uuid', requirePermission('media:delete'), validate(uuidOnlySchema), adminController.deleteMedia);

router.get('/imports', requirePermission('imports:read'), validate(listGenericSchema), adminController.listImportJobs);
router.get('/imports/products/template', requirePermission('imports:read'), adminController.downloadProductImportTemplate);
router.post('/imports/products/preview', requirePermission('imports:create'), uploadRateLimiter, excelUpload.single('file'), validateUploadedXlsxFile, adminController.previewProductImport);
router.post('/imports/products/:uuid/confirm', requirePermission('imports:create'), validate(uuidOnlySchema), adminController.confirmProductImport);
router.post('/imports/products', requirePermission('imports:create'), uploadRateLimiter, excelUpload.single('file'), validateUploadedXlsxFile, adminController.importProducts);

// Checklist-compatible blog aliases
router.get('/posts', requirePermission('blog:read'), validate(listGenericSchema), adminController.listBlogPosts);
router.post('/posts', requirePermission('blog:create'), validate(blogPostSchema), adminController.createBlogPost);
router.get('/posts/:uuid', requirePermission('blog:read'), validate(uuidOnlySchema), adminController.getBlogPost);
router.patch('/posts/:uuid', requirePermission('blog:update'), validate(updateBlogPostSchema), adminController.updateBlogPost);
router.put('/posts/:uuid', requirePermission('blog:update'), validate(updateBlogPostSchema), adminController.updateBlogPost);
router.patch('/posts/:uuid/publish', requirePermission('blog:update'), validate(uuidOnlySchema), adminController.publishBlogPost);
router.patch('/posts/:uuid/unpublish', requirePermission('blog:update'), validate(uuidOnlySchema), adminController.unpublishBlogPost);
router.patch('/posts/:uuid/archive', requirePermission('blog:update'), validate(uuidOnlySchema), adminController.archiveBlogPost);
router.patch('/posts/:uuid/featured', requirePermission('blog:update'), validate(featuredToggleSchema), adminController.updateBlogPostFeatured);
router.delete('/posts/:uuid', requirePermission('blog:delete'), validate(uuidOnlySchema), adminController.deleteBlogPost);
router.get('/blogs', requirePermission('blog:read'), validate(listGenericSchema), adminController.listBlogPosts);
router.post('/blogs', requirePermission('blog:create'), validate(blogPostSchema), adminController.createBlogPost);
router.get('/blogs/:uuid', requirePermission('blog:read'), validate(uuidOnlySchema), adminController.getBlogPost);
router.patch('/blogs/:uuid', requirePermission('blog:update'), validate(updateBlogPostSchema), adminController.updateBlogPost);
router.put('/blogs/:uuid', requirePermission('blog:update'), validate(updateBlogPostSchema), adminController.updateBlogPost);
router.patch('/blogs/:uuid/publish', requirePermission('blog:update'), validate(uuidOnlySchema), adminController.publishBlogPost);
router.patch('/blogs/:uuid/unpublish', requirePermission('blog:update'), validate(uuidOnlySchema), adminController.unpublishBlogPost);
router.patch('/blogs/:uuid/archive', requirePermission('blog:update'), validate(uuidOnlySchema), adminController.archiveBlogPost);
router.patch('/blogs/:uuid/featured', requirePermission('blog:update'), validate(featuredToggleSchema), adminController.updateBlogPostFeatured);
router.delete('/blogs/:uuid', requirePermission('blog:delete'), validate(uuidOnlySchema), adminController.deleteBlogPost);
router.put('/products/:uuid', requirePermission('products:update'), validate(updateProductSchema), adminController.updateProduct);
router.post('/products/import', requirePermission('imports:create'), uploadRateLimiter, excelUpload.single('file'), validateUploadedXlsxFile, adminController.importProducts);

router.get('/settings', authorize(USER_ROLES.ADMIN), validate(listSettingsSchema), adminController.listSettings);
router.put('/settings', authorize(USER_ROLES.ADMIN), validate(settingsSchema), adminController.upsertSetting);

export default router;
