ALTER TABLE `arcos`
  ADD COLUMN `created_by_user_id` INT NULL AFTER `id`,
  ADD COLUMN `reviewed_by_user_id` INT NULL AFTER `created_by_user_id`,
  ADD COLUMN `poster_url` VARCHAR(500) NULL AFTER `description`,
  ADD COLUMN `moderation_status` ENUM('draft', 'pending_review', 'approved', 'rejected', 'archived') NOT NULL DEFAULT 'draft' AFTER `level`,
  ADD COLUMN `review_note` VARCHAR(500) NULL AFTER `moderation_status`,
  ADD COLUMN `cinevault_badge` VARCHAR(120) NULL AFTER `review_note`,
  ADD COLUMN `reviewed_at` TIMESTAMP(0) NULL AFTER `is_official`;

UPDATE `arcos`
SET
  `created_by_user_id` = (SELECT u.id FROM `users` u ORDER BY u.id ASC LIMIT 1),
  `moderation_status` = 'approved',
  `is_official` = 1,
  `cinevault_badge` = 'Recomendado por CineVault',
  `reviewed_at` = COALESCE(`updated_at`, CURRENT_TIMESTAMP);

ALTER TABLE `arcos`
  MODIFY COLUMN `created_by_user_id` INT NOT NULL;

ALTER TABLE `arcos`
  ADD CONSTRAINT `fk_arcos_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT `fk_arcos_reviewed_by` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  ADD INDEX `idx_arcos_created_by` (`created_by_user_id`),
  ADD INDEX `idx_arcos_reviewed_by` (`reviewed_by_user_id`),
  ADD INDEX `idx_arcos_status_created` (`moderation_status`, `created_at`);
