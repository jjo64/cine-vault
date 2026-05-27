import type { ReactNode } from "react";
import DOMPurify from "dompurify";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { createSlug } from "../../../../../utils/stringUtils";
import { Stars, Img } from "../../primitives/primitives";
import type { ReviewItem } from "../../../types";
import styles from "./ReviewCard.module.css";

const reviewHref = (review: ReviewItem) => {
  const type = review.mediaType === "tv" ? "tv" : "movie";
  const slug = `${review.tmdbId || review.movieId}-${createSlug(review.title)}`;
  const suffix =
    review.reviewSequence > 1 ? `/${review.reviewSequence - 1}` : "";
  return `/${review.username}/${type}/${slug}${suffix}`;
};

interface ReviewCardProps {
  review: ReviewItem;
  delay?: number;
  compact?: boolean;
  pinned?: boolean;
  actionsSlot?: ReactNode;
}

export function ReviewCard({
  review,
  delay = 0,
  compact = false,
  pinned = false,
  actionsSlot,
}: ReviewCardProps) {
  const navigate = useNavigate();
  const openReviewThread = () => navigate(reviewHref(review));

  const richText = review.text
    .replace(
      /<b>/g,
      `<strong style="color: var(--color-text); font-style: normal; font-weight: 500">`,
    )
    .replace(/<\/b>/g, "</strong>");

  const safeHtml =
    typeof window !== "undefined"
      ? DOMPurify.sanitize(richText ?? "", {
          ALLOWED_TAGS: ["b", "i", "em", "strong", "br", "p", "span"],
          ALLOWED_ATTR: ["style"],
        })
      : (richText ?? "");

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        onClick={openReviewThread}
        role="link"
        tabIndex={0}
        aria-label={`Ver reseña completa de ${review.title}`}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openReviewThread();
          }
        }}
        className={`${styles.compactCard} ${pinned ? styles.pinnedCard : ""}`}
      >
        {actionsSlot && (
          <div className={styles.actionsContainer}>
            {actionsSlot}
          </div>
        )}
        <div className={styles.compactHeader}>
          {/* Póster */}
          <div className={styles.compactPoster}>
            <Img
              src={review.posterUrl}
              alt={review.title}
              className={styles.posterImg}
            />
          </div>

          <div className={styles.compactMeta}>
            <div className={styles.compactTitle}>
              {review.title}
            </div>

            <div className={styles.starsRow}>
              <Stars rating={review.rating} size={11} />
              <span className={styles.dateText}>
                {review.createdAtLabel}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.compactText}>
          {review.text}
        </div>

        <div className={styles.tagsContainer}>
          {review.tags.slice(0, 2).map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onClick={openReviewThread}
      role="link"
      tabIndex={0}
      aria-label={`Ver reseña completa de ${review.title}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openReviewThread();
        }
      }}
      className={`${styles.desktopCard} ${pinned ? styles.pinnedCard : ""}`}
    >
      {actionsSlot && (
        <div className={styles.actionsContainer}>
          {actionsSlot}
        </div>
      )}
      <div className={styles.desktopPoster}>
        <Img
          src={review.posterUrl}
          alt={review.title}
          className={styles.posterImg}
        />
      </div>
      <div className={styles.desktopContent}>
        <div className={styles.desktopHeader}>
          <div className={styles.desktopTitle}>
            {review.title}
          </div>
          <Stars
            rating={review.rating}
            size={12}
          />
          <span className={styles.desktopDate}>
            {review.createdAtLabel}
          </span>
        </div>
        <div
          className={styles.desktopText}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
        <div className={styles.tagsContainer}>
          {review.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
