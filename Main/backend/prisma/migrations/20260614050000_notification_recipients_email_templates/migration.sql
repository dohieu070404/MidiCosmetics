ALTER TABLE `admin_verification_tokens`
  ADD COLUMN `target_email` VARCHAR(191) NULL;

CREATE TABLE `notification_recipients` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `is_verified` BOOLEAN NOT NULL DEFAULT false,
  `verified_at` DATETIME(3) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `deleted_at` DATETIME(3) NULL,
  UNIQUE INDEX `notification_recipients_uuid_key` (`uuid`),
  UNIQUE INDEX `notification_recipients_email_key` (`email`),
  INDEX `idx_notification_recipients_verified_active` (`is_verified`, `is_active`),
  INDEX `idx_notification_recipients_deleted_at` (`deleted_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `email_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `to_email` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `status` VARCHAR(40) NOT NULL,
  `error_message` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `email_logs_uuid_key` (`uuid`),
  INDEX `idx_email_logs_type` (`type`),
  INDEX `idx_email_logs_status` (`status`),
  INDEX `idx_email_logs_created_at` (`created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
