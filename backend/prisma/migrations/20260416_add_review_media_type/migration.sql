ALTER TABLE `reviews`
  ADD COLUMN `media_type` ENUM('movie', 'tv') NOT NULL DEFAULT 'movie' AFTER `movie_id`;
