import { HTTP_STATUS } from '../../constants/http-status.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { auditService } from '../../services/audit.service.js';
import { emailNotificationService } from '../../services/email-notification.service.js';
import { adminService } from './admin.service.js';
import { adminBootstrapService } from './admin-bootstrap.service.js';
import { adminProfileService } from './admin-profile.service.js';
import { adminNotificationRecipientService } from './admin-notification-recipient.service.js';
import { adminHomepageService } from './admin-homepage.service.js';

const ok = (res, message, data = {}, meta = {}) => res.success({ statusCode: HTTP_STATUS.OK, message, data, meta });
const created = (res, message, data = {}) => res.success({ statusCode: HTTP_STATUS.CREATED, message, data });
const deleted = (res, message) => res.success({ statusCode: HTTP_STATUS.OK, message, data: {} });

const withAudit = async (req, payload) => auditService.log(req, payload);

export const adminController = {

  bootstrapAdmin: asyncHandler(async (req, res) => {
    const admin = await adminBootstrapService.bootstrapFirstAdmin(req.validated.body);
    await auditService.log(req, {
      action: 'ADMIN_BOOTSTRAPPED',
      entityType: 'ADMIN',
      entityId: admin.uuid,
      actorEmail: admin.email,
      afterData: { uuid: admin.uuid, email: admin.email, role: admin.role, status: admin.status, createdAt: admin.createdAt },
      metadata: { actorEmail: admin.email },
    });
    emailNotificationService.sendAdminBootstrapped(req, admin);
    return res.success({ statusCode: HTTP_STATUS.CREATED, message: 'Admin account has been created successfully.', data: {} });
  }),

  permissions: asyncHandler(async (req, res) => ok(res, 'Admin permissions fetched successfully', { user: req.user })),

  getProfile: asyncHandler(async (req, res) => {
    const profile = await adminProfileService.getProfile(req.user);
    return ok(res, 'Admin profile fetched successfully', { profile });
  }),

  requestPasswordChange: asyncHandler(async (req, res) => {
    try {
      const result = await adminProfileService.requestPasswordChange(req.user, req.validated.body);
      await auditService.log(req, {
        action: 'ADMIN_PASSWORD_CHANGE_REQUESTED',
        entityType: 'ADMIN',
        entityId: result.admin.uuid,
        metadata: { actorEmail: result.admin.email, expiresAt: result.expiresAt, ttlMinutes: result.ttlMinutes },
      });
      emailNotificationService.sendAdminPasswordChangeVerification(req, result.admin, result.verificationToken, result.expiresAt);
      return ok(res, 'Vui lòng kiểm tra email để xác minh đổi mật khẩu.', { expiresAt: result.expiresAt });
    } catch (error) {
      await auditService.log(req, {
        action: 'ADMIN_PASSWORD_CHANGE_FAILED',
        entityType: 'ADMIN',
        entityId: req.user?.uuid || null,
        metadata: { step: 'REQUEST', reason: error?.message || 'UNKNOWN_ERROR' },
      });
      throw error;
    }
  }),

  verifyPasswordChange: asyncHandler(async (req, res) => {
    try {
      const profile = await adminProfileService.verifyPasswordChange(req.user, req.validated.body);
      await auditService.log(req, {
        action: 'ADMIN_PASSWORD_CHANGED',
        entityType: 'ADMIN',
        entityId: profile.uuid,
        metadata: { actorEmail: profile.email, passwordChangedAt: profile.passwordChangedAt },
      });
      emailNotificationService.sendAdminPasswordChanged(req, profile);
      return ok(res, 'Mật khẩu quản trị đã được thay đổi. Vui lòng đăng nhập lại.', { profile });
    } catch (error) {
      await auditService.log(req, {
        action: 'ADMIN_PASSWORD_CHANGE_FAILED',
        entityType: 'ADMIN',
        entityId: req.user?.uuid || null,
        metadata: { step: 'VERIFY', reason: error?.message || 'UNKNOWN_ERROR' },
      });
      throw error;
    }
  }),



  listNotificationRecipients: asyncHandler(async (req, res) => {
    const recipients = await adminNotificationRecipientService.listRecipients();
    return ok(res, 'Notification recipients fetched successfully', { recipients });
  }),

  createNotificationRecipient: asyncHandler(async (req, res) => {
    const result = await adminNotificationRecipientService.createRecipient(req, req.user, req.validated.body);
    await withAudit(req, {
      action: 'NOTIFICATION_EMAIL_ADDED',
      entityType: 'NotificationRecipient',
      entityId: result.recipient.uuid,
      afterData: { ...result.recipient, verificationExpiresAt: result.expiresAt },
    });
    return created(res, 'Email nhận thông báo đã được thêm. Vui lòng kiểm tra email để lấy mã xác minh.', {
      recipient: result.recipient,
      expiresAt: result.expiresAt,
    });
  }),

  verifyNotificationRecipient: asyncHandler(async (req, res) => {
    const recipient = await adminNotificationRecipientService.verifyRecipient(req.user, req.validated.body);
    await withAudit(req, {
      action: 'NOTIFICATION_EMAIL_VERIFIED',
      entityType: 'NotificationRecipient',
      entityId: recipient.uuid,
      afterData: recipient,
    });
    return ok(res, 'Email nhận thông báo đã được xác minh.', { recipient });
  }),

  toggleNotificationRecipient: asyncHandler(async (req, res) => {
    const recipient = await adminNotificationRecipientService.toggleRecipient(req.validated.params.uuid);
    await withAudit(req, {
      action: 'NOTIFICATION_EMAIL_TOGGLED',
      entityType: 'NotificationRecipient',
      entityId: recipient.uuid,
      afterData: recipient,
    });
    return ok(res, recipient.isActive ? 'Email nhận thông báo đã được bật.' : 'Email nhận thông báo đã được tắt.', { recipient });
  }),

  deleteNotificationRecipient: asyncHandler(async (req, res) => {
    const recipient = await adminNotificationRecipientService.deleteRecipient(req.validated.params.uuid);
    await withAudit(req, {
      action: 'NOTIFICATION_EMAIL_REMOVED',
      entityType: 'NotificationRecipient',
      entityId: recipient.uuid,
      beforeData: recipient,
    });
    return deleted(res, 'Email nhận thông báo đã được xóa.');
  }),

  sendNotificationRecipientTest: asyncHandler(async (req, res) => {
    const result = await adminNotificationRecipientService.sendTest(req);
    await withAudit(req, {
      action: 'TEST_EMAIL_SENT',
      entityType: 'NotificationRecipient',
      metadata: { sent: result.sent, recipients: result.recipients.map((item) => item.email) },
    });
    return ok(res, 'Email test đã được gửi thành công.', { sent: result.sent });
  }),



  getHomepageSettings: asyncHandler(async (req, res) => {
    const data = await adminHomepageService.getHomepageSettings();
    return ok(res, 'Homepage settings fetched successfully', data);
  }),

  updateHomepageSection: asyncHandler(async (req, res) => {
    const before = await adminHomepageService.getHomepageSettings();
    const section = await adminHomepageService.updateSection(req.validated.params.sectionId, req.validated.body);
    await withAudit(req, { action: 'HOMEPAGE_SECTION_UPDATED', entityType: 'HomepageSection', entityId: section.id, beforeData: before.sections.find((item) => item.id === section.id), afterData: section });
    return ok(res, 'Homepage section updated successfully', { section });
  }),

  toggleHomepageSection: asyncHandler(async (req, res) => {
    const before = await adminHomepageService.getHomepageSettings();
    const section = await adminHomepageService.toggleSection(req.validated.params.sectionId, req.validated.body);
    await withAudit(req, { action: 'HOMEPAGE_SECTION_TOGGLED', entityType: 'HomepageSection', entityId: section.id, beforeData: before.sections.find((item) => item.id === section.id), afterData: section });
    return ok(res, section.isEnabled ? 'Section đã được bật.' : 'Section đã được tắt.', { section });
  }),

  reorderHomepageSections: asyncHandler(async (req, res) => {
    const before = await adminHomepageService.getHomepageSettings();
    const sections = await adminHomepageService.reorderSections(req.validated.body);
    await withAudit(req, { action: 'HOMEPAGE_SECTION_REORDERED', entityType: 'HomepageSection', beforeData: before.sections, afterData: sections });
    return ok(res, 'Homepage sections reordered successfully', { sections });
  }),

  addHomepageFeaturedItem: asyncHandler(async (req, res) => {
    const item = await adminHomepageService.addFeaturedItem(req.validated.params.sectionId, req.validated.body);
    await withAudit(req, { action: 'HOMEPAGE_FEATURED_ITEM_ADDED', entityType: req.validated.body.entityType, entityId: item.uuid, afterData: { uuid: item.uuid, isFeatured: item.isFeatured, featuredOrder: item.featuredOrder } });
    return ok(res, 'Featured item added successfully', { item });
  }),

  removeHomepageFeaturedItem: asyncHandler(async (req, res) => {
    const item = await adminHomepageService.removeFeaturedItem(req.validated.params.sectionId, req.validated.params.itemId);
    await withAudit(req, { action: 'HOMEPAGE_FEATURED_ITEM_REMOVED', entityType: 'HomepageFeaturedItem', entityId: item.uuid, afterData: { uuid: item.uuid, isFeatured: item.isFeatured } });
    return ok(res, 'Featured item removed successfully', { item });
  }),

  reorderHomepageFeaturedItems: asyncHandler(async (req, res) => {
    await adminHomepageService.reorderFeaturedItems(req.validated.params.sectionId, req.validated.body);
    await withAudit(req, { action: 'HOMEPAGE_FEATURED_ITEM_REORDERED', entityType: 'HomepageFeaturedItem', entityId: req.validated.params.sectionId, afterData: req.validated.body.items });
    return ok(res, 'Featured items reordered successfully', {});
  }),

  dashboard: asyncHandler(async (req, res) => ok(res, 'Dashboard fetched successfully', await adminService.getDashboard())),

  listBlogCategories: asyncHandler(async (req, res) => {
    const result = await adminService.listCategories('blog', req.validated.query);
    return ok(res, 'Blog categories fetched successfully', { categories: result.items }, result.pagination);
  }),
  createBlogCategory: asyncHandler(async (req, res) => {
    const category = await adminService.createCategory('blog', req.validated.body);
    await withAudit(req, { action: 'CREATE_BLOG_CATEGORY', entityType: 'BlogCategory', entityId: category.uuid });
    return created(res, 'Blog category created successfully', { category });
  }),
  updateBlogCategory: asyncHandler(async (req, res) => {
    const category = await adminService.updateCategory('blog', req.validated.params.uuid, req.validated.body);
    await withAudit(req, { action: 'UPDATE_BLOG_CATEGORY', entityType: 'BlogCategory', entityId: category.uuid });
    return ok(res, 'Blog category updated successfully', { category });
  }),
  deleteBlogCategory: asyncHandler(async (req, res) => {
    await adminService.deleteCategory('blog', req.validated.params.uuid);
    await withAudit(req, { action: 'DELETE_BLOG_CATEGORY', entityType: 'BlogCategory', entityId: req.validated.params.uuid });
    return deleted(res, 'Blog category deleted successfully');
  }),

  listTags: asyncHandler(async (req, res) => {
    const result = await adminService.listTags(req.validated.query);
    return ok(res, 'Blog tags fetched successfully', { tags: result.items }, result.pagination);
  }),
  createTag: asyncHandler(async (req, res) => {
    const tag = await adminService.createTag(req.validated.body);
    await withAudit(req, { action: 'CREATE_BLOG_TAG', entityType: 'BlogTag', entityId: tag.uuid });
    return created(res, 'Blog tag created successfully', { tag });
  }),
  updateTag: asyncHandler(async (req, res) => {
    const tag = await adminService.updateTag(req.validated.params.uuid, req.validated.body);
    await withAudit(req, { action: 'UPDATE_BLOG_TAG', entityType: 'BlogTag', entityId: tag.uuid });
    return ok(res, 'Blog tag updated successfully', { tag });
  }),
  deleteTag: asyncHandler(async (req, res) => {
    await adminService.deleteTag(req.validated.params.uuid);
    await withAudit(req, { action: 'DELETE_BLOG_TAG', entityType: 'BlogTag', entityId: req.validated.params.uuid });
    return deleted(res, 'Blog tag deleted successfully');
  }),

  listBlogPosts: asyncHandler(async (req, res) => {
    const result = await adminService.listBlogPosts(req.validated.query);
    return ok(res, 'Blog posts fetched successfully', { posts: result.items }, result.pagination);
  }),
  getBlogPost: asyncHandler(async (req, res) => ok(res, 'Blog post fetched successfully', { post: await adminService.getBlogPost(req.validated.params.uuid) })),
  createBlogPost: asyncHandler(async (req, res) => {
    const post = await adminService.createBlogPost(req.user, req.validated.body);
    await withAudit(req, { action: 'CREATE_BLOG_POST', entityType: 'BlogPost', entityId: post.uuid });
    return created(res, 'Blog post created successfully', { post });
  }),
  updateBlogPost: asyncHandler(async (req, res) => {
    const post = await adminService.updateBlogPost(req.user, req.validated.params.uuid, req.validated.body);
    await withAudit(req, { action: 'UPDATE_BLOG_POST', entityType: 'BlogPost', entityId: post.uuid });
    return ok(res, 'Blog post updated successfully', { post });
  }),
  deleteBlogPost: asyncHandler(async (req, res) => {
    await adminService.deleteBlogPost(req.user, req.validated.params.uuid);
    await withAudit(req, { action: 'DELETE_BLOG_POST', entityType: 'BlogPost', entityId: req.validated.params.uuid });
    return deleted(res, 'Blog post deleted successfully');
  }),
  publishBlogPost: asyncHandler(async (req, res) => ok(res, 'Blog post published successfully', { post: await adminService.setBlogPostStatus(req.user, req.validated.params.uuid, 'PUBLISHED') })),
  unpublishBlogPost: asyncHandler(async (req, res) => ok(res, 'Blog post unpublished successfully', { post: await adminService.setBlogPostStatus(req.user, req.validated.params.uuid, 'DRAFT') })),
  archiveBlogPost: asyncHandler(async (req, res) => ok(res, 'Blog post archived successfully', { post: await adminService.setBlogPostStatus(req.user, req.validated.params.uuid, 'ARCHIVED') })),
  updateBlogPostFeatured: asyncHandler(async (req, res) => {
    const beforePost = await adminService.getBlogPost(req.validated.params.uuid);
    const post = await adminService.setBlogPostFeatured(req.validated.params.uuid, req.validated.body);
    await withAudit(req, { action: 'UPDATE_BLOG_POST_FEATURED', entityType: 'BlogPost', entityId: post.uuid, beforeData: beforePost, afterData: post });
    return ok(res, post.isFeatured ? 'Bài viết đã được đưa lên trang chủ.' : 'Bài viết đã được bỏ khỏi đề xuất trang chủ.', { post });
  }),

  listProductCategories: asyncHandler(async (req, res) => {
    const result = await adminService.listCategories('product', req.validated.query);
    return ok(res, 'Product categories fetched successfully', { categories: result.items }, result.pagination);
  }),
  createProductCategory: asyncHandler(async (req, res) => {
    const category = await adminService.createCategory('product', req.validated.body);
    await withAudit(req, { action: 'CREATE_PRODUCT_CATEGORY', entityType: 'ProductCategory', entityId: category.uuid });
    return created(res, 'Product category created successfully', { category });
  }),
  updateProductCategory: asyncHandler(async (req, res) => {
    const category = await adminService.updateCategory('product', req.validated.params.uuid, req.validated.body);
    await withAudit(req, { action: 'UPDATE_PRODUCT_CATEGORY', entityType: 'ProductCategory', entityId: category.uuid });
    return ok(res, 'Product category updated successfully', { category });
  }),
  deleteProductCategory: asyncHandler(async (req, res) => {
    await adminService.deleteCategory('product', req.validated.params.uuid);
    await withAudit(req, { action: 'DELETE_PRODUCT_CATEGORY', entityType: 'ProductCategory', entityId: req.validated.params.uuid });
    return deleted(res, 'Product category deleted successfully');
  }),

  listBrands: asyncHandler(async (req, res) => {
    const result = await adminService.listBrands(req.validated.query);
    return ok(res, 'Product brands fetched successfully', { brands: result.items }, result.pagination);
  }),
  createBrand: asyncHandler(async (req, res) => {
    const brand = await adminService.createBrand(req.validated.body);
    await withAudit(req, { action: 'CREATE_PRODUCT_BRAND', entityType: 'ProductBrand', entityId: brand.uuid });
    return created(res, 'Product brand created successfully', { brand });
  }),
  updateBrand: asyncHandler(async (req, res) => {
    const brand = await adminService.updateBrand(req.validated.params.uuid, req.validated.body);
    await withAudit(req, { action: 'UPDATE_PRODUCT_BRAND', entityType: 'ProductBrand', entityId: brand.uuid });
    return ok(res, 'Product brand updated successfully', { brand });
  }),
  deleteBrand: asyncHandler(async (req, res) => {
    await adminService.deleteBrand(req.validated.params.uuid);
    await withAudit(req, { action: 'DELETE_PRODUCT_BRAND', entityType: 'ProductBrand', entityId: req.validated.params.uuid });
    return deleted(res, 'Product brand deleted successfully');
  }),

  listCollections: asyncHandler(async (req, res) => {
    const result = await adminService.listCollections(req.validated.query);
    return ok(res, 'Product collections fetched successfully', { collections: result.items }, result.pagination);
  }),
  createCollection: asyncHandler(async (req, res) => {
    const collection = await adminService.createCollection(req.validated.body);
    await withAudit(req, { action: 'CREATE_PRODUCT_COLLECTION', entityType: 'ProductCollection', entityId: collection.uuid });
    return created(res, 'Product collection created successfully', { collection });
  }),
  updateCollection: asyncHandler(async (req, res) => {
    const collection = await adminService.updateCollection(req.validated.params.uuid, req.validated.body);
    await withAudit(req, { action: 'UPDATE_PRODUCT_COLLECTION', entityType: 'ProductCollection', entityId: collection.uuid });
    return ok(res, 'Product collection updated successfully', { collection });
  }),
  deleteCollection: asyncHandler(async (req, res) => {
    await adminService.deleteCollection(req.validated.params.uuid);
    await withAudit(req, { action: 'DELETE_PRODUCT_COLLECTION', entityType: 'ProductCollection', entityId: req.validated.params.uuid });
    return deleted(res, 'Product collection deleted successfully');
  }),

  listProducts: asyncHandler(async (req, res) => {
    const result = await adminService.listProducts(req.validated.query);
    return ok(res, 'Products fetched successfully', { products: result.items }, result.pagination);
  }),
  getProduct: asyncHandler(async (req, res) => ok(res, 'Product fetched successfully', { product: await adminService.getProduct(req.validated.params.uuid) })),
  createProduct: asyncHandler(async (req, res) => {
    const product = await adminService.createProduct(req.validated.body);
    await withAudit(req, { action: 'CREATE_PRODUCT', entityType: 'Product', entityId: product.uuid, afterData: product });
    emailNotificationService.sendProductCreated(req, product);
    return created(res, 'Product created successfully', { product });
  }),
  updateProduct: asyncHandler(async (req, res) => {
    const beforeProduct = await adminService.getProduct(req.validated.params.uuid);
    const product = await adminService.updateProduct(req.validated.params.uuid, req.validated.body);
    await withAudit(req, { action: 'UPDATE_PRODUCT', entityType: 'Product', entityId: product.uuid, beforeData: beforeProduct, afterData: product });
    emailNotificationService.sendProductUpdated(req, beforeProduct, product);
    return ok(res, 'Product updated successfully', { product });
  }),
  deleteProduct: asyncHandler(async (req, res) => {
    const beforeProduct = await adminService.getProduct(req.validated.params.uuid);
    await adminService.deleteProduct(req.validated.params.uuid);
    await withAudit(req, { action: 'DELETE_PRODUCT', entityType: 'Product', entityId: beforeProduct.uuid, beforeData: beforeProduct, afterData: { ...beforeProduct, status: 'ARCHIVED', deletedAt: new Date() } });
    emailNotificationService.sendProductDeleted(req, beforeProduct);
    return deleted(res, 'Product deleted successfully');
  }),
  activateProduct: asyncHandler(async (req, res) => {
    const beforeProduct = await adminService.getProduct(req.validated.params.uuid);
    const product = await adminService.setProductStatus(req.validated.params.uuid, 'ACTIVE');
    await withAudit(req, { action: 'ACTIVATE_PRODUCT', entityType: 'Product', entityId: product.uuid, beforeData: beforeProduct, afterData: product });
    emailNotificationService.sendProductStatusChanged(req, beforeProduct, product);
    return ok(res, 'Product activated successfully', { product });
  }),
  deactivateProduct: asyncHandler(async (req, res) => {
    const beforeProduct = await adminService.getProduct(req.validated.params.uuid);
    const product = await adminService.setProductStatus(req.validated.params.uuid, 'INACTIVE');
    await withAudit(req, { action: 'DEACTIVATE_PRODUCT', entityType: 'Product', entityId: product.uuid, beforeData: beforeProduct, afterData: product });
    emailNotificationService.sendProductStatusChanged(req, beforeProduct, product);
    return ok(res, 'Product hidden successfully', { product });
  }),
  updateProductStatus: asyncHandler(async (req, res) => {
    const beforeProduct = await adminService.getProduct(req.validated.params.uuid);
    const product = await adminService.setProductStatus(req.validated.params.uuid, req.validated.body.status);
    await withAudit(req, { action: 'UPDATE_PRODUCT_STATUS', entityType: 'Product', entityId: product.uuid, beforeData: beforeProduct, afterData: product });
    emailNotificationService.sendProductStatusChanged(req, beforeProduct, product);
    return ok(res, 'Product status updated successfully', { product });
  }),
  archiveProduct: asyncHandler(async (req, res) => {
    const beforeProduct = await adminService.getProduct(req.validated.params.uuid);
    const product = await adminService.setProductStatus(req.validated.params.uuid, 'ARCHIVED');
    await withAudit(req, { action: 'ARCHIVE_PRODUCT', entityType: 'Product', entityId: product.uuid, beforeData: beforeProduct, afterData: product });
    emailNotificationService.sendProductStatusChanged(req, beforeProduct, product);
    return ok(res, 'Product archived successfully', { product });
  }),

  updateProductFeatured: asyncHandler(async (req, res) => {
    const beforeProduct = await adminService.getProduct(req.validated.params.uuid);
    const product = await adminService.setProductFeatured(req.validated.params.uuid, req.validated.body);
    await withAudit(req, { action: 'UPDATE_PRODUCT_FEATURED', entityType: 'Product', entityId: product.uuid, beforeData: beforeProduct, afterData: product });
    return ok(res, product.isFeatured ? 'Sản phẩm đã được đưa lên trang chủ.' : 'Sản phẩm đã được bỏ khỏi đề xuất trang chủ.', { product });
  }),

  listMedia: asyncHandler(async (req, res) => {
    const result = await adminService.listMedia(req.validated.query);
    return ok(res, 'Media assets fetched successfully', { media: result.items }, result.pagination);
  }),
  uploadImage: asyncHandler(async (req, res) => {
    const media = await adminService.uploadImage(req.user, req.file, req.body);
    await withAudit(req, { action: 'UPLOAD_MEDIA', entityType: 'MediaAsset', entityId: media.uuid });
    return created(res, 'Image uploaded successfully', { media });
  }),
  deleteMedia: asyncHandler(async (req, res) => {
    await adminService.deleteMedia(req.validated.params.uuid);
    await withAudit(req, { action: 'DELETE_MEDIA', entityType: 'MediaAsset', entityId: req.validated.params.uuid });
    return deleted(res, 'Media deleted successfully');
  }),

  listImportJobs: asyncHandler(async (req, res) => {
    const result = await adminService.listImportJobs(req.validated.query);
    return ok(res, 'Import jobs fetched successfully', { jobs: result.items }, result.pagination);
  }),

  downloadProductImportTemplate: asyncHandler(async (req, res) => {
    const template = await adminService.getProductImportTemplate();
    res.setHeader('Content-Type', template.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${template.filename}"`);
    res.setHeader('Content-Length', template.buffer.length);
    return res.send(template.buffer);
  }),

  previewProductImport: asyncHandler(async (req, res) => {
    const preview = await adminService.previewProductImport(req.user, req.file);
    return ok(res, 'Product import preview generated successfully', { preview });
  }),

  confirmProductImport: asyncHandler(async (req, res) => {
    const job = await adminService.confirmProductImport(req.user, req.validated.params.uuid);
    const summary = job.summary || job._summary || {};
    await withAudit(req, { action: 'IMPORT_PRODUCTS', entityType: 'ImportJob', entityId: job.uuid, afterData: job, metadata: { totalRows: job.totalRows, successRows: job.successRows, failedRows: job.failedRows, summary } });
    emailNotificationService.sendProductImportCompleted(req, job);
    return ok(res, 'Product import completed', { job });
  }),

  importProducts: asyncHandler(async (req, res) => {
    const job = await adminService.importProducts(req.user, req.file);
    const summary = job.summary || job._summary || {};
    await withAudit(req, { action: 'IMPORT_PRODUCTS_DIRECT', entityType: 'ImportJob', entityId: job.uuid, afterData: job, metadata: { totalRows: job.totalRows, successRows: job.successRows, failedRows: job.failedRows, summary } });
    emailNotificationService.sendProductImportCompleted(req, job);
    return created(res, 'Product import completed', { job });
  }),

  listSettings: asyncHandler(async (req, res) => ok(res, 'Settings fetched successfully', { settings: await adminService.listSettings(req.validated.query || {}) })),
  upsertSetting: asyncHandler(async (req, res) => {
    const setting = await adminService.upsertSetting(req.validated.body);
    await withAudit(req, { action: 'UPSERT_SETTING', entityType: 'SiteSetting', entityId: setting.key });
    return ok(res, 'Setting saved successfully', { setting });
  }),
};
