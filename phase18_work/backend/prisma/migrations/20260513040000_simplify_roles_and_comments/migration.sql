-- Simplify roles to ADMIN and USER.
-- MySQL ENUM values must include the new target values before UPDATE statements assign them.
ALTER TABLE `users` MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'MODERATOR', 'CUSTOMER', 'USER') NOT NULL DEFAULT 'CUSTOMER';
UPDATE `users` SET `role` = 'ADMIN' WHERE `role` IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'MODERATOR');
UPDATE `users` SET `role` = 'USER' WHERE `role` IN ('CUSTOMER');
ALTER TABLE `users` MODIFY `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER';

-- Comments are no longer exposed in the current shop scope, but existing schema is kept for safe migration compatibility.
-- MySQL ENUM values must include VISIBLE/HIDDEN before UPDATE statements assign them.
ALTER TABLE `comments` MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'VISIBLE', 'HIDDEN', 'SPAM') NOT NULL DEFAULT 'VISIBLE';
UPDATE `comments` SET `status` = 'VISIBLE' WHERE `status` IN ('PENDING', 'APPROVED');
UPDATE `comments` SET `status` = 'HIDDEN' WHERE `status` IN ('REJECTED');
ALTER TABLE `comments` MODIFY `status` ENUM('VISIBLE', 'HIDDEN', 'SPAM') NOT NULL DEFAULT 'VISIBLE';
