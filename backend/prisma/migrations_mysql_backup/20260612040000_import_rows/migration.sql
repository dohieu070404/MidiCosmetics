CREATE TABLE `import_rows` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `import_job_id` BIGINT NOT NULL,
  `row_number` INTEGER NOT NULL,
  `sku` VARCHAR(100) NULL,
  `status` VARCHAR(30) NOT NULL,
  `message` TEXT NULL,
  `warnings` JSON NULL,
  `errors` JSON NULL,
  `raw_data` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `import_rows_uuid_key`(`uuid`),
  UNIQUE INDEX `uq_import_rows_job_row`(`import_job_id`, `row_number`),
  INDEX `idx_import_rows_import_job_id`(`import_job_id`),
  INDEX `idx_import_rows_sku`(`sku`),
  INDEX `idx_import_rows_status`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `import_rows` ADD CONSTRAINT `import_rows_import_job_id_fkey` FOREIGN KEY (`import_job_id`) REFERENCES `import_jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
