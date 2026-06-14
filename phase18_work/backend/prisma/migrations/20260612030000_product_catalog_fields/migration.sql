-- Product catalog fields required for current Midi Cosmetics scope.
-- Keep this migration focused on product management: stock, unit, Kiot raw data, barcode index, and non-null price safety.

UPDATE `products` SET `price` = 0 WHERE `price` IS NULL;

ALTER TABLE `products`
  MODIFY `price` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `stock` INT NOT NULL DEFAULT 0 AFTER `price`,
  ADD COLUMN `unit` VARCHAR(50) NULL AFTER `stock`,
  ADD COLUMN `raw_import_data` JSON NULL AFTER `published_at`,
  ADD KEY `idx_products_barcode` (`barcode`),
  ADD KEY `idx_products_stock` (`stock`);
