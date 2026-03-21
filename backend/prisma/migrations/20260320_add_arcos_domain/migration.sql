CREATE TABLE `arcos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(120) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `description` TEXT NULL,
  `level` VARCHAR(20) NOT NULL DEFAULT 'INTERMEDIO',
  `is_official` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `slug` (`slug`),
  INDEX `idx_arcos_is_official` (`is_official`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `arco_movies` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `arco_id` INT NOT NULL,
  `movie_id` INT NOT NULL,
  `order_index` INT NOT NULL,
  `note` TEXT NULL,
  `is_optional` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uniq_arco_movie` (`arco_id`, `movie_id`),
  UNIQUE INDEX `uniq_arco_order` (`arco_id`, `order_index`),
  INDEX `idx_arco_movies_movie_id` (`movie_id`),
  CONSTRAINT `fk_arco_movies_arco` FOREIGN KEY (`arco_id`) REFERENCES `arcos`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_arco_movies_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies_ref`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_arco_progress` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `arco_id` INT NOT NULL,
  `movie_id` INT NOT NULL,
  `completed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uniq_user_arco_movie` (`user_id`, `arco_id`, `movie_id`),
  INDEX `idx_user_arco_progress_arco_id` (`arco_id`),
  INDEX `idx_user_arco_progress_movie_id` (`movie_id`),
  CONSTRAINT `fk_uap_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_uap_arco` FOREIGN KEY (`arco_id`) REFERENCES `arcos`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_uap_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies_ref`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
