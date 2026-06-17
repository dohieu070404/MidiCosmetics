-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "CommentStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'SPAM');
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "MediaProvider" AS ENUM ('LOCAL', 'CLOUDINARY');
CREATE TYPE "SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30),
    "avatar_url" VARCHAR(500),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "email_verified_at" TIMESTAMP(3),
    "password_changed_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "user_agent" VARCHAR(500),
    "ip_address" VARCHAR(64),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_verification_tokens" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "admin_id" BIGINT NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "pending_password_hash" VARCHAR(255),
    "target_email" VARCHAR(191),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admin_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_recipients" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "to_email" VARCHAR(191) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "status" VARCHAR(40) NOT NULL,
    "error_message" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "uploader_id" BIGINT,
    "provider" "MediaProvider" NOT NULL DEFAULT 'LOCAL',
    "public_id" VARCHAR(255),
    "original_name" VARCHAR(255) NOT NULL,
    "file_name" VARCHAR(255),
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "secure_url" VARCHAR(1000) NOT NULL,
    "alt_text" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "parent_id" BIGINT,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_tags" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(191) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "author_id" BIGINT NOT NULL,
    "category_id" BIGINT,
    "featured_image_id" BIGINT,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(191) NOT NULL,
    "excerpt" VARCHAR(500),
    "content" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "featured_order" INTEGER NOT NULL DEFAULT 0,
    "reading_minutes" INTEGER NOT NULL DEFAULT 1,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "seo_title" VARCHAR(255),
    "seo_description" VARCHAR(500),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_likes" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "post_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "ip_hash" CHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blog_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post_tags" (
    "post_id" BIGINT NOT NULL,
    "tag_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blog_post_tags_pkey" PRIMARY KEY ("post_id", "tag_id")
);

-- CreateTable
CREATE TABLE "product_brands" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "logo_url" VARCHAR(1000),
    "country" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "product_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "parent_id" BIGINT,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_collections" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "product_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "category_id" BIGINT,
    "brand_id" BIGINT,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(191) NOT NULL,
    "sku" VARCHAR(100),
    "barcode" VARCHAR(100),
    "short_description" VARCHAR(500),
    "description" TEXT,
    "skin_type" VARCHAR(120),
    "ingredients" TEXT,
    "how_to_use" TEXT,
    "benefits" TEXT,
    "caution" TEXT,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "unit" VARCHAR(50),
    "compare_at_price" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'VND',
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "featured_order" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "seo_title" VARCHAR(255),
    "seo_description" VARCHAR(500),
    "published_at" TIMESTAMP(3),
    "raw_import_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_collection_items" (
    "collection_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_collection_items_pkey" PRIMARY KEY ("collection_id", "product_id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "media_asset_id" BIGINT NOT NULL,
    "alt_text" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "post_id" BIGINT,
    "product_id" BIGINT,
    "user_id" BIGINT,
    "parent_id" BIGINT,
    "author_name" VARCHAR(150) NOT NULL,
    "author_email" VARCHAR(191) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'VISIBLE',
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(500),
    "moderated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "created_by_id" BIGINT,
    "type" VARCHAR(100) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(1000),
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "success_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "error_report" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_rows" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "import_job_id" BIGINT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "sku" VARCHAR(100),
    "status" VARCHAR(30) NOT NULL,
    "message" TEXT,
    "warnings" JSONB,
    "errors" JSONB,
    "raw_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" BIGSERIAL NOT NULL,
    "setting_key" VARCHAR(120) NOT NULL,
    "setting_value" JSONB NOT NULL,
    "setting_type" "SettingType" NOT NULL DEFAULT 'STRING',
    "setting_group" VARCHAR(80) NOT NULL DEFAULT 'general',
    "description" VARCHAR(255),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "uuid" CHAR(36) NOT NULL,
    "actor_id" BIGINT,
    "actor_email" VARCHAR(191),
    "action" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(120) NOT NULL,
    "entity_id" VARCHAR(120),
    "before_data" JSONB,
    "after_data" JSONB,
    "metadata" JSONB,
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_uuid_key" ON "refresh_tokens"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "admin_verification_tokens_uuid_key" ON "admin_verification_tokens"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "admin_verification_tokens_token_hash_key" ON "admin_verification_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipients_uuid_key" ON "notification_recipients"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipients_email_key" ON "notification_recipients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_uuid_key" ON "email_logs"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_uuid_key" ON "media_assets"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_uuid_key" ON "blog_categories"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tags_uuid_key" ON "blog_tags"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tags_slug_key" ON "blog_tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_uuid_key" ON "blog_posts"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_likes_uuid_key" ON "blog_likes"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "uq_blog_likes_post_user" ON "blog_likes"("post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_blog_likes_post_ip" ON "blog_likes"("post_id", "ip_hash");

-- CreateIndex
CREATE UNIQUE INDEX "product_brands_uuid_key" ON "product_brands"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "product_brands_slug_key" ON "product_brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_uuid_key" ON "product_categories"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_slug_key" ON "product_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_collections_uuid_key" ON "product_collections"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "product_collections_slug_key" ON "product_collections"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_uuid_key" ON "products"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "uq_product_images_product_media" ON "product_images"("product_id", "media_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "comments_uuid_key" ON "comments"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "import_jobs_uuid_key" ON "import_jobs"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "import_rows_uuid_key" ON "import_rows"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "uq_import_rows_job_row" ON "import_rows"("import_job_id", "row_number");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_setting_key_key" ON "site_settings"("setting_key");

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_uuid_key" ON "audit_logs"("uuid");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_status" ON "users"("status");

-- CreateIndex
CREATE INDEX "idx_users_deleted_at" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_users_created_at" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_revoked_at" ON "refresh_tokens"("revoked_at");

-- CreateIndex
CREATE INDEX "idx_admin_verification_tokens_admin_type" ON "admin_verification_tokens"("admin_id", "type");

-- CreateIndex
CREATE INDEX "idx_admin_verification_tokens_expires_at" ON "admin_verification_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "idx_admin_verification_tokens_used_at" ON "admin_verification_tokens"("used_at");

-- CreateIndex
CREATE INDEX "idx_notification_recipients_verified_active" ON "notification_recipients"("is_verified", "is_active");

-- CreateIndex
CREATE INDEX "idx_notification_recipients_deleted_at" ON "notification_recipients"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_email_logs_type" ON "email_logs"("type");

-- CreateIndex
CREATE INDEX "idx_email_logs_status" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "idx_email_logs_created_at" ON "email_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_media_assets_uploader_id" ON "media_assets"("uploader_id");

-- CreateIndex
CREATE INDEX "idx_media_assets_provider" ON "media_assets"("provider");

-- CreateIndex
CREATE INDEX "idx_media_assets_deleted_at" ON "media_assets"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_blog_categories_parent_id" ON "blog_categories"("parent_id");

-- CreateIndex
CREATE INDEX "idx_blog_categories_sort_order" ON "blog_categories"("sort_order");

-- CreateIndex
CREATE INDEX "idx_blog_categories_deleted_at" ON "blog_categories"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_blog_tags_deleted_at" ON "blog_tags"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_blog_posts_author_id" ON "blog_posts"("author_id");

-- CreateIndex
CREATE INDEX "idx_blog_posts_category_id" ON "blog_posts"("category_id");

-- CreateIndex
CREATE INDEX "idx_blog_posts_featured_image_id" ON "blog_posts"("featured_image_id");

-- CreateIndex
CREATE INDEX "idx_blog_posts_status_published_at" ON "blog_posts"("status", "published_at");

-- CreateIndex
CREATE INDEX "idx_blog_posts_featured_order" ON "blog_posts"("is_featured", "featured_order");

-- CreateIndex
CREATE INDEX "idx_blog_posts_deleted_at" ON "blog_posts"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_blog_likes_post_id" ON "blog_likes"("post_id");

-- CreateIndex
CREATE INDEX "idx_blog_likes_user_id" ON "blog_likes"("user_id");

-- CreateIndex
CREATE INDEX "idx_blog_post_tags_tag_id" ON "blog_post_tags"("tag_id");

-- CreateIndex
CREATE INDEX "idx_product_brands_sort_order" ON "product_brands"("sort_order");

-- CreateIndex
CREATE INDEX "idx_product_brands_deleted_at" ON "product_brands"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_product_categories_parent_id" ON "product_categories"("parent_id");

-- CreateIndex
CREATE INDEX "idx_product_categories_sort_order" ON "product_categories"("sort_order");

-- CreateIndex
CREATE INDEX "idx_product_categories_deleted_at" ON "product_categories"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_product_collections_active_sort_order" ON "product_collections"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "idx_product_collections_deleted_at" ON "product_collections"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_products_category_id" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "idx_products_brand_id" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "idx_products_barcode" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "idx_products_stock" ON "products"("stock");

-- CreateIndex
CREATE INDEX "idx_products_status_published_at" ON "products"("status", "published_at");

-- CreateIndex
CREATE INDEX "idx_products_featured_order" ON "products"("is_featured", "featured_order");

-- CreateIndex
CREATE INDEX "idx_products_skin_type" ON "products"("skin_type");

-- CreateIndex
CREATE INDEX "idx_products_view_count" ON "products"("view_count");

-- CreateIndex
CREATE INDEX "idx_products_deleted_at" ON "products"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_product_collection_items_product_id" ON "product_collection_items"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_images_product_sort_order" ON "product_images"("product_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_product_images_media_asset_id" ON "product_images"("media_asset_id");

-- CreateIndex
CREATE INDEX "idx_comments_post_status" ON "comments"("post_id", "status");

-- CreateIndex
CREATE INDEX "idx_comments_product_status" ON "comments"("product_id", "status");

-- CreateIndex
CREATE INDEX "idx_comments_user_id" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "idx_comments_parent_id" ON "comments"("parent_id");

-- CreateIndex
CREATE INDEX "idx_comments_status_created_at" ON "comments"("status", "created_at");

-- CreateIndex
CREATE INDEX "idx_comments_deleted_at" ON "comments"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_import_jobs_created_by_id" ON "import_jobs"("created_by_id");

-- CreateIndex
CREATE INDEX "idx_import_jobs_type_status" ON "import_jobs"("type", "status");

-- CreateIndex
CREATE INDEX "idx_import_jobs_deleted_at" ON "import_jobs"("deleted_at");

-- CreateIndex
CREATE INDEX "idx_import_rows_import_job_id" ON "import_rows"("import_job_id");

-- CreateIndex
CREATE INDEX "idx_import_rows_sku" ON "import_rows"("sku");

-- CreateIndex
CREATE INDEX "idx_import_rows_status" ON "import_rows"("status");

-- CreateIndex
CREATE INDEX "idx_site_settings_group" ON "site_settings"("setting_group");

-- CreateIndex
CREATE INDEX "idx_site_settings_is_public" ON "site_settings"("is_public");

-- CreateIndex
CREATE INDEX "idx_audit_logs_actor_id" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_actor_email" ON "audit_logs"("actor_email");

-- CreateIndex
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_verification_tokens" ADD CONSTRAINT "admin_verification_tokens_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_featured_image_id_fkey" FOREIGN KEY ("featured_image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_likes" ADD CONSTRAINT "blog_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_likes" ADD CONSTRAINT "blog_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "blog_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "product_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collection_items" ADD CONSTRAINT "product_collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "product_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collection_items" ADD CONSTRAINT "product_collection_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
