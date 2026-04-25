import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { FeedItem } from "../types";
import {
  reportReview,
  sendRecommendationInteraction,
  setFeedBookmark,
  setFeedHide,
  setFeedLike,
  trackFeedShare,
} from "@/services/socialServices";

type FeedSetter = Dispatch<SetStateAction<FeedItem[]>>;

type UseFeedActionsArgs = {
  setFeed: FeedSetter;
};

const withOptimisticPatch = (
  setFeed: FeedSetter,
  itemRef: string,
  patch: (item: FeedItem) => FeedItem,
) => {
  let previous: FeedItem[] = [];
  setFeed((current) => {
    previous = current;
    return current.map((item) =>
      item.itemRef === itemRef ? patch(item) : item,
    );
  });
  return previous;
};

export function useFeedActions({ setFeed }: UseFeedActionsArgs) {
  const [animating, setAnimating] = useState<number | null>(null);
  const [pendingRefs, setPendingRefs] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  const setPending = (itemRef: string, active: boolean) => {
    setPendingRefs((prev) => {
      const next = new Set(prev);
      if (active) next.add(itemRef);
      else next.delete(itemRef);
      return next;
    });
  };

  const toggleLike = async (item: FeedItem) => {
    if (!item.canLike) return;
    setActionError(null);
    setPending(item.itemRef, true);

    const nextActive = !item.liked;
    const rollback = withOptimisticPatch(setFeed, item.itemRef, (current) => ({
      ...current,
      liked: nextActive,
      likes: Math.max(0, current.likes + (nextActive ? 1 : -1)),
    }));

    if (nextActive) {
      setAnimating(item.id);
      window.setTimeout(() => setAnimating(null), 650);
    }

    try {
      if (item.backendType === "discovery" && item.recommendationMediaId) {
        await sendRecommendationInteraction(
          item.recommendationMediaId,
          nextActive ? "like" : "dislike",
          { source: "feed" },
        );
      } else {
        await setFeedLike({ item_ref: item.itemRef, active: nextActive });
      }
    } catch (error) {
      setFeed(rollback);
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el like",
      );
    } finally {
      setPending(item.itemRef, false);
    }
  };

  const toggleBookmark = async (item: FeedItem) => {
    if (!item.canBookmark) return;
    setActionError(null);
    setPending(item.itemRef, true);

    const nextActive = !item.bookmarked;
    const rollback = withOptimisticPatch(setFeed, item.itemRef, (current) => ({
      ...current,
      bookmarked: nextActive,
    }));

    try {
      await setFeedBookmark({ item_ref: item.itemRef, active: nextActive });
    } catch (error) {
      setFeed(rollback);
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar en bookmarks",
      );
    } finally {
      setPending(item.itemRef, false);
    }
  };

  const shareItem = async (item: FeedItem) => {
    if (!item.canShare) return;
    setActionError(null);

    withOptimisticPatch(setFeed, item.itemRef, (current) => ({
      ...current,
      shares: current.shares + 1,
    }));

    try {
      await trackFeedShare({ item_ref: item.itemRef, channel: "copy_link" });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el share",
      );
    }
  };

  const dismissItem = async (item: FeedItem) => {
    if (!item.canHide) return;
    setActionError(null);
    setPending(item.itemRef, true);

    let previous: FeedItem[] = [];
    setFeed((current) => {
      previous = current;
      return current.filter(
        (entry) =>
          entry.itemRef !== item.itemRef &&
          entry.backendType !== item.backendType,
      );
    });

    try {
      await setFeedHide({ item_ref: item.itemRef, active: true });
      if (item.backendType === "discovery" && item.recommendationMediaId) {
        await sendRecommendationInteraction(
          item.recommendationMediaId,
          "dislike",
          { source: "hide_similar" },
        );
      }
    } catch (error) {
      setFeed(previous);
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo ocultar este contenido",
      );
    } finally {
      setPending(item.itemRef, false);
    }
  };

  const reportItem = async (item: FeedItem, reason: string) => {
    if (!item.canReport || !item.reviewId) return;
    setActionError(null);

    try {
      await reportReview(item.reviewId, reason);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "No se pudo enviar el reporte",
      );
    }
  };

  return {
    animating,
    actionError,
    isPending: (itemRef: string) => pendingRefs.has(itemRef),
    toggleLike,
    toggleBookmark,
    shareItem,
    dismissItem,
    reportItem,
  };
}
