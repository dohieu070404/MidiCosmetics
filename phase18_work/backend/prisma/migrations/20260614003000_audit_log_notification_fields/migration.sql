ALTER TABLE `audit_logs`
  ADD COLUMN `actor_email` VARCHAR(191) NULL AFTER `actor_id`,
  ADD COLUMN `before_data` JSON NULL AFTER `entity_id`,
  ADD COLUMN `after_data` JSON NULL AFTER `before_data`;

CREATE INDEX `idx_audit_logs_actor_email` ON `audit_logs`(`actor_email`);
