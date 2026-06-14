-- Phase 18: featured flags for homepage and product advisory fields

ALTER TABLE `products`
  ADD COLUMN `benefits` TEXT NULL AFTER `how_to_use`,
  ADD COLUMN `caution` TEXT NULL AFTER `benefits`,
  ADD COLUMN `featured_order` INTEGER NOT NULL DEFAULT 0 AFTER `is_featured`;

DROP INDEX `idx_products_featured_sort_order` ON `products`;
CREATE INDEX `idx_products_featured_order` ON `products` (`is_featured`, `featured_order`);

ALTER TABLE `blog_posts`
  ADD COLUMN `is_featured` BOOLEAN NOT NULL DEFAULT false AFTER `status`,
  ADD COLUMN `featured_order` INTEGER NOT NULL DEFAULT 0 AFTER `is_featured`;

CREATE INDEX `idx_blog_posts_featured_order` ON `blog_posts` (`is_featured`, `featured_order`);
