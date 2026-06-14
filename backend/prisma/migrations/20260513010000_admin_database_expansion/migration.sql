ALTER TABLE `users`
  MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'MODERATOR', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
  ADD COLUMN `phone` VARCHAR(30) NULL AFTER `full_name`,
  ADD COLUMN `email_verified_at` DATETIME(3) NULL AFTER `status`,
  ADD COLUMN `password_changed_at` DATETIME(3) NULL AFTER `email_verified_at`;

ALTER TABLE `blog_posts`
  ADD COLUMN `reading_minutes` INT NOT NULL DEFAULT 1 AFTER `status`,
  ADD COLUMN `view_count` INT NOT NULL DEFAULT 0 AFTER `reading_minutes`;

CREATE TABLE `product_brands` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `logo_url` VARCHAR(1000) NULL,
  `country` VARCHAR(100) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_brands_uuid_key` (`uuid`),
  UNIQUE KEY `product_brands_slug_key` (`slug`),
  KEY `idx_product_brands_sort_order` (`sort_order`),
  KEY `idx_product_brands_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `products`
  ADD COLUMN `brand_id` BIGINT NULL AFTER `category_id`,
  ADD COLUMN `barcode` VARCHAR(100) NULL AFTER `sku`,
  ADD KEY `idx_products_brand_id` (`brand_id`),
  ADD CONSTRAINT `products_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `product_brands` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `product_collections` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_collections_uuid_key` (`uuid`),
  UNIQUE KEY `product_collections_slug_key` (`slug`),
  KEY `idx_product_collections_active_sort_order` (`is_active`, `sort_order`),
  KEY `idx_product_collections_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_collection_items` (
  `collection_id` BIGINT NOT NULL,
  `product_id` BIGINT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`collection_id`, `product_id`),
  KEY `idx_product_collection_items_product_id` (`product_id`),
  CONSTRAINT `product_collection_items_collection_id_fkey` FOREIGN KEY (`collection_id`) REFERENCES `product_collections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `product_collection_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `comments`
  ADD COLUMN `moderated_at` DATETIME(3) NULL AFTER `user_agent`,
  ADD KEY `idx_comments_status_created_at` (`status`, `created_at`);

CREATE TABLE `site_settings` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(120) NOT NULL,
  `setting_value` JSON NOT NULL,
  `setting_type` ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON') NOT NULL DEFAULT 'STRING',
  `setting_group` VARCHAR(80) NOT NULL DEFAULT 'general',
  `description` VARCHAR(255) NULL,
  `is_public` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_key` (`setting_key`),
  KEY `idx_site_settings_group` (`setting_group`),
  KEY `idx_site_settings_is_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `actor_id` BIGINT NULL,
  `action` VARCHAR(120) NOT NULL,
  `entity_type` VARCHAR(120) NOT NULL,
  `entity_id` VARCHAR(120) NULL,
  `metadata` JSON NULL,
  `ip_address` VARCHAR(64) NULL,
  `user_agent` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `audit_logs_uuid_key` (`uuid`),
  KEY `idx_audit_logs_actor_id` (`actor_id`),
  KEY `idx_audit_logs_entity` (`entity_type`, `entity_id`),
  KEY `idx_audit_logs_created_at` (`created_at`),
  CONSTRAINT `audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
