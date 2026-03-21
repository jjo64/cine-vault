CREATE TABLE `cinematographic_signature` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `pivotal_film` VARCHAR(255) NULL,
  `pivotal_film_detail` VARCHAR(255) NULL,
  `formative_director` VARCHAR(255) NULL,
  `formative_director_detail` VARCHAR(255) NULL,
  `unforgettable_scene` VARCHAR(255) NULL,
  `unforgettable_scene_detail` VARCHAR(255) NULL,
  `cinema_turning_year` VARCHAR(255) NULL,
  `cinema_turning_year_detail` VARCHAR(255) NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uniq_signature_user` (`user_id`),
  INDEX `idx_signature_user_id` (`user_id`),
  CONSTRAINT `fk_signature_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `curated_gallery_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `movie_id` INT NOT NULL,
  `order_index` INT NOT NULL,
  `note` VARCHAR(255) NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uniq_curated_gallery_user_movie` (`user_id`, `movie_id`),
  UNIQUE INDEX `uniq_curated_gallery_user_order` (`user_id`, `order_index`),
  INDEX `idx_curated_gallery_movie_id` (`movie_id`),
  INDEX `idx_curated_gallery_user_id` (`user_id`),
  CONSTRAINT `fk_curated_gallery_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_curated_gallery_movie` FOREIGN KEY (`movie_id`) REFERENCES `movies_ref`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
