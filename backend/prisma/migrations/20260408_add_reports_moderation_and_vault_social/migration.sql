ALTER TABLE `reports`
  ADD COLUMN `resolution_note` VARCHAR(500) NULL AFTER `status`,
  ADD COLUMN `resolved_at` TIMESTAMP(0) NULL AFTER `resolution_note`,
  ADD COLUMN `resolved_by_user_id` INT NULL AFTER `resolved_at`;

ALTER TABLE `reports`
  ADD CONSTRAINT `fk_reports_resolved_by`
    FOREIGN KEY (`resolved_by_user_id`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE RESTRICT,
  ADD INDEX `idx_reports_status_created` (`status`, `created_at`),
  ADD INDEX `idx_reports_resolved_by` (`resolved_by_user_id`);

CREATE TABLE `vault_social_entries` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `movie_id` INT NULL,
  `entry_type` ENUM('reflexion', 'edit', 'critica', 'recomendacion') NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `content` TEXT NOT NULL,
  `cover_url` VARCHAR(500) NULL,
  `duration_label` VARCHAR(32) NULL,
  `likes_count` INT NOT NULL DEFAULT 0,
  `comments_count` INT NOT NULL DEFAULT 0,
  `is_public` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_vault_social_user_created` (`user_id`, `created_at`),
  INDEX `idx_vault_social_public_created` (`is_public`, `created_at`),
  INDEX `idx_vault_social_type_created` (`entry_type`, `created_at`),
  INDEX `idx_vault_social_movie` (`movie_id`),
  CONSTRAINT `fk_vault_social_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_vault_social_movie`
    FOREIGN KEY (`movie_id`) REFERENCES `movies_ref`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
