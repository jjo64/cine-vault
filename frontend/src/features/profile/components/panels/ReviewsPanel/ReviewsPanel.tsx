import { useEffect, useMemo, useState } from "react";
import { BookOpen, Ellipsis, Pin, PinOff, Trash2 } from "lucide-react";
import { getStoredAccessToken } from "../../../../../services/authServices";
import { deleteReview } from "../../../../../services/movieDetailServices";
import { ReviewCard } from "../ReviewCard/ReviewCard";
import type { ReviewItem } from "../../../types";
import styles from "./ReviewsPanel.module.css";

interface ReviewsPanelProps {
  reviewItems: ReviewItem[];
  canManageReviews?: boolean;
}

export function ReviewsPanel({
  reviewItems,
  canManageReviews = false,
}: ReviewsPanelProps) {
  const [sort, setSort] = useState("Reciente");
  const [menuReviewId, setMenuReviewId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
  const [hiddenReviewIds, setHiddenReviewIds] = useState<Set<number>>(new Set());
  const [pinnedReviewIds, setPinnedReviewIds] = useState<Set<number>>(new Set());

  const storageKey = useMemo(() => {
    const owner = (reviewItems[0]?.username || "perfil").toLowerCase();
    return `cinevault:pinned-reviews:${owner}`;
  }, [reviewItems]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setPinnedReviewIds(new Set());
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const ids = parsed
          .map((entry) => Number(entry))
          .filter((entry) => Number.isFinite(entry));
        setPinnedReviewIds(new Set(ids));
      }
    } catch {
      setPinnedReviewIds(new Set());
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(Array.from(pinnedReviewIds)),
      );
    } catch {
      // noop
    }
  }, [pinnedReviewIds, storageKey]);

  const visibleReviews = useMemo(
    () => reviewItems.filter((entry) => !hiddenReviewIds.has(entry.id)),
    [reviewItems, hiddenReviewIds],
  );

  const sortedReviews = useMemo(() => {
    const base = [...visibleReviews];
    if (sort === "Rating") base.sort((a, b) => b.rating - a.rating);
    else if (sort === "Película")
      base.sort((a, b) => a.title.localeCompare(b.title));

    base.sort(
      (a, b) =>
        Number(pinnedReviewIds.has(b.id)) - Number(pinnedReviewIds.has(a.id)),
    );
    return base;
  }, [visibleReviews, sort, pinnedReviewIds]);

  const handleDeleteReview = async (reviewId: number) => {
    const token = getStoredAccessToken();
    if (!token) return;

    setDeletingReviewId(reviewId);
    try {
      await deleteReview(token, reviewId);
      setHiddenReviewIds((prev) => {
        const next = new Set(prev);
        next.add(reviewId);
        return next;
      });
      setPinnedReviewIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
      setMenuReviewId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingReviewId(null);
    }
  };

  const togglePinReview = (reviewId: number) => {
    setPinnedReviewIds((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
    setMenuReviewId(null);
  };

  const renderActions = (review: ReviewItem) => {
    if (!canManageReviews) return null;
    return (
      <div className={styles.actionsDropdownWrapper}>
        <button
          type="button"
          aria-label="Acciones de reseña"
          onClick={(event) => {
            event.stopPropagation();
            setMenuReviewId((prev) => (prev === review.id ? null : review.id));
          }}
          className={styles.ellipsisBtn}
        >
          <Ellipsis size={14} />
        </button>
        {menuReviewId === review.id && (
          <div
            onClick={(event) => event.stopPropagation()}
            className={styles.dropdownMenu}
          >
            <button
              type="button"
              onClick={() => togglePinReview(review.id)}
              className={styles.dropdownBtn}
            >
              {pinnedReviewIds.has(review.id) ? (
                <PinOff size={13} />
              ) : (
                <Pin size={13} />
              )}
              {pinnedReviewIds.has(review.id)
                ? "Quitar anclado"
                : "Anclar reseña"}
            </button>
            <button
              type="button"
              disabled={deletingReviewId === review.id}
              onClick={() => void handleDeleteReview(review.id)}
              className={`${styles.dropdownBtn} ${styles.dangerBtn}`}
            >
              <Trash2 size={13} />
              {deletingReviewId === review.id
                ? "Eliminando..."
                : "Eliminar reseña"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.panelHeader}>
          Reseñas{" "}
          <em className={styles.panelHeaderEm}>
            — {visibleReviews.length} escritas
          </em>
        </div>
        <div className={styles.sortButtons}>
          {["Reciente", "Rating", "Película"].map((sortName) => (
            <button
              key={sortName}
              onClick={() => setSort(sortName)}
              aria-pressed={sort === sortName}
              className={`${styles.sortBtn} ${sort === sortName ? styles.sortBtnActive : ""}`}
            >
              {sortName}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className={styles.desktopOnly}>
          {sortedReviews.map((review, index) => (
            <ReviewCard
              key={review.id}
              review={review}
              delay={index * 0.07}
              compact={false}
              pinned={pinnedReviewIds.has(review.id)}
              actionsSlot={renderActions(review)}
            />
          ))}
        </div>
        <div className={styles.mobileOnly}>
          {sortedReviews.map((review, index) => (
            <ReviewCard
              key={review.id}
              review={review}
              delay={index * 0.07}
              compact={true}
              pinned={pinnedReviewIds.has(review.id)}
              actionsSlot={renderActions(review)}
            />
          ))}
        </div>
      </div>

      <button className={styles.btnWriteReview}>
        <BookOpen size={12} /> Escribir nueva reseña
      </button>
    </div>
  );
}
