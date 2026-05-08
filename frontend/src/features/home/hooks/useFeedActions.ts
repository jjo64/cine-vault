import { useState } from "react";
import { authorizedJson } from "../../../services/authServices";
import type { FollowingReviewItem } from "../types";

export const useFeedActions = (
  setFollowingReviews: React.Dispatch<React.SetStateAction<FollowingReviewItem[]>>
) => {
  const [likedFeedIds, setLikedFeedIds] = useState<Set<number>>(new Set());
  const [likeBusyIds, setLikeBusyIds] = useState<Set<number>>(new Set());

  const handleToggleFeedLike = async (reviewId: number) => {
    if (likeBusyIds.has(reviewId)) return;
    const wasLiked = likedFeedIds.has(reviewId);

    setLikeBusyIds((prev) => {
      const next = new Set(prev);
      next.add(reviewId);
      return next;
    });

    setLikedFeedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });

    setFollowingReviews((prev) =>
      prev.map((item) =>
        item.id === reviewId
          ? { ...item, likes: Math.max(0, item.likes + (wasLiked ? -1 : 1)) }
          : item,
      ),
    );

    try {
      await authorizedJson(`/api/reviews/${reviewId}/like`, {
        method: wasLiked ? "DELETE" : "POST",
      });
    } catch {
      // Revert on error
      setLikedFeedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(reviewId);
        else next.delete(reviewId);
        return next;
      });
      setFollowingReviews((prev) =>
        prev.map((item) =>
          item.id === reviewId
            ? { ...item, likes: Math.max(0, item.likes + (wasLiked ? 1 : -1)) }
            : item,
        ),
      );
    } finally {
      setLikeBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  };

  return {
    likedFeedIds,
    likeBusyIds,
    handleToggleFeedLike,
  };
};
