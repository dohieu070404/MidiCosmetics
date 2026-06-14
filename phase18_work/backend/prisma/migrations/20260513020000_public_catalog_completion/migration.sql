ALTER TABLE `products`
  ADD COLUMN `skin_type` VARCHAR(120) NULL AFTER `description`,
  ADD COLUMN `view_count` INT NOT NULL DEFAULT 0 AFTER `is_featured`,
  ADD KEY `idx_products_skin_type` (`skin_type`),
  ADD KEY `idx_products_view_count` (`view_count`);

CREATE TABLE `blog_likes` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `post_id` BIGINT NOT NULL,
  `user_id` BIGINT NULL,
  `ip_hash` CHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `blog_likes_uuid_key` (`uuid`),
  UNIQUE KEY `uq_blog_likes_post_user` (`post_id`, `user_id`),
  UNIQUE KEY `uq_blog_likes_post_ip` (`post_id`, `ip_hash`),
  KEY `idx_blog_likes_post_id` (`post_id`),
  KEY `idx_blog_likes_user_id` (`user_id`),
  CONSTRAINT `blog_likes_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `blog_posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `blog_likes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
