CREATE TABLE `admin_verification_tokens` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uuid` CHAR(36) NOT NULL,
  `admin_id` BIGINT NOT NULL,
  `type` VARCHAR(80) NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `pending_password_hash` VARCHAR(255) NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `admin_verification_tokens_uuid_key` (`uuid`),
  UNIQUE INDEX `admin_verification_tokens_token_hash_key` (`token_hash`),
  INDEX `idx_admin_verification_tokens_admin_type` (`admin_id`, `type`),
  INDEX `idx_admin_verification_tokens_expires_at` (`expires_at`),
  INDEX `idx_admin_verification_tokens_used_at` (`used_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `admin_verification_tokens_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
