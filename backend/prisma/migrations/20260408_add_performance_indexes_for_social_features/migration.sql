ALTER TABLE `diary_entries`
  ADD INDEX `idx_diary_user_watched` (`user_id`, `watched_date`);

ALTER TABLE `notifications`
  ADD INDEX `idx_notifications_user_read_created` (`user_id`, `read`, `created_at`);

ALTER TABLE `reviews`
  ADD INDEX `idx_reviews_user_created` (`user_id`, `created_at`),
  ADD INDEX `idx_reviews_mode_long` (`mode`, `es_critica_larga`);

ALTER TABLE `user_lists`
  ADD INDEX `idx_user_lists_public_updated` (`is_public`, `updated_at`);

ALTER TABLE `user_list_items`
  ADD INDEX `idx_user_list_items_list_added` (`list_id`, `added_at`);

ALTER TABLE `vault`
  DROP INDEX `user_id`,
  ADD UNIQUE INDEX `uniq_vault_user_movie` (`user_id`, `movie_id`),
  ADD INDEX `idx_vault_user_added` (`user_id`, `added_at`);

ALTER TABLE `watchlist`
  DROP INDEX `user_id`,
  ADD UNIQUE INDEX `uniq_watchlist_user_movie` (`user_id`, `movie_id`),
  ADD INDEX `idx_watchlist_user_added` (`user_id`, `added_at`);

ALTER TABLE `review_likes`
  ADD INDEX `idx_review_likes_user_created` (`user_id`, `created_at`),
  ADD INDEX `idx_review_likes_review_created` (`review_id`, `created_at`);
