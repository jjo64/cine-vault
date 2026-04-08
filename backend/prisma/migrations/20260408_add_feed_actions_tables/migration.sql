CREATE TABLE `user_feed_bookmarks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `item_type` ENUM('review', 'vault', 'watchlist', 'discovery', 'tonight', 'list', 'quote') NOT NULL,
  `item_id` INT NOT NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uniq_feed_bookmark_user_item` (`user_id`, `item_type`, `item_id`),
  INDEX `idx_feed_bookmark_user_created` (`user_id`, `created_at`),
  INDEX `idx_feed_bookmark_item` (`item_type`, `item_id`),
  CONSTRAINT `fk_feed_bookmarks_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_feed_hides` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `item_type` ENUM('review', 'vault', 'watchlist', 'discovery', 'tonight', 'list', 'quote') NOT NULL,
  `item_id` INT NOT NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uniq_feed_hide_user_item` (`user_id`, `item_type`, `item_id`),
  INDEX `idx_feed_hide_user_created` (`user_id`, `created_at`),
  INDEX `idx_feed_hide_item` (`item_type`, `item_id`),
  CONSTRAINT `fk_feed_hides_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `feed_share_events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `item_type` ENUM('review', 'vault', 'watchlist', 'discovery', 'tonight', 'list', 'quote') NOT NULL,
  `item_id` INT NOT NULL,
  `channel` VARCHAR(64) NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_feed_share_user_created` (`user_id`, `created_at`),
  INDEX `idx_feed_share_item_created` (`item_type`, `item_id`, `created_at`),
  CONSTRAINT `fk_feed_shares_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
