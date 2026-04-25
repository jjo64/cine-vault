import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchActivityFeed,
  fetchForYouFeed,
  fetchGlobalFeed,
  type ActivityItem,
  type FeedApiItem,
  type ForYouItem,
} from "@/services/socialServices";
import type { FeedItem, FeedTab, User } from "../types";
import {
  FOR_YOU_MIX_CONFIG,
  FOR_YOU_PAGE_SIZE,
  normalizeMixConfig,
} from "../config/forYouMix";

const FALLBACK_BG =
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&q=85";

const posterUrl = (posterPath?: string | null) =>
  posterPath ? `https://image.tmdb.org/t/p/w780${posterPath}` : FALLBACK_BG;

const toNumericId = (rawId: string, index: number) => {
  const parsed = Number(String(rawId || "").replace(/\D/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : index + 1;
};

const toUser = (username: string, idSeed: number): User => {
  const safe = username || `usuario${idSeed}`;
  return {
    name: safe,
    handle: `@${safe}`,
    films: 0,
    avatar: safe.slice(0, 1).toUpperCase(),
  };
};

const mapFeedApiItem = (
  item: FeedApiItem,
  index: number,
  tab: FeedTab,
): FeedItem => {
  const id = toNumericId(item.id, index);
  const username = item.user.username || `usuario${item.user.id}`;
  const film = {
    title: item.movie?.tmdb_id
      ? `TMDB #${item.movie.tmdb_id}`
      : "Película en actividad",
    year: new Date(item.created_at).getFullYear(),
    director: "Comunidad CineVault",
    id: String(item.movie?.tmdb_id || id),
    mediaType: item.movie?.media_type,
  };

  if (item.type === "review") {
    return {
      id,
      type: "review",
      itemRef: item.id,
      backendType: "review",
      sourceTab: tab,
      createdAt: item.created_at,
      user: toUser(username, item.user.id),
      film,
      rating: Number(item.review?.rating || 0),
      text: item.review?.content || "Nueva reseña de la comunidad.",
      tags: [item.review?.mode || "Comunidad"],
      likes: Number(item.review?.likes || 0),
      comments: 0,
      shares: 0,
      liked: Boolean(item.liked),
      bookmarked: Boolean(item.bookmarked),
      canLike: true,
      canComment: true,
      canBookmark: true,
      canShare: true,
      canHide: true,
      canReport: true,
      reviewId: item.review?.id,
      bg: FALLBACK_BG,
    };
  }

  if (item.type === "vault") {
    return {
      id,
      type: "vault",
      itemRef: item.id,
      backendType: "vault",
      sourceTab: tab,
      createdAt: item.created_at,
      user: toUser(username, item.user.id),
      vaultType: "Vault entry",
      title: film.title,
      duration: "Actividad reciente",
      description: `${username} añadió esta película a su vault.`,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      bookmarked: Boolean(item.bookmarked),
      canLike: false,
      canComment: false,
      canBookmark: true,
      canShare: true,
      canHide: true,
      canReport: false,
      bg: FALLBACK_BG,
    };
  }

  return {
    id,
    type: "discovery",
    itemRef: item.id,
    backendType: "watchlist",
    sourceTab: tab,
    createdAt: item.created_at,
    film,
    quote: "Guardada para ver después",
    description: `${username} añadió esta película a su watchlist.`,
    likes: 0,
    comments: 0,
    shares: 0,
    liked: false,
    bookmarked: Boolean(item.bookmarked),
    canLike: false,
    canComment: false,
    canBookmark: true,
    canShare: true,
    canHide: true,
    canReport: false,
    bg: FALLBACK_BG,
  };
};

const mapForYouItem = (item: ForYouItem, index: number): FeedItem => {
  if (item.type === "review") {
    const id = toNumericId(item.id, index);
    const username = item.user.username || `usuario${item.user.id}`;
    return {
      id,
      type: "review",
      itemRef: item.id,
      backendType: "review",
      sourceTab: "Para ti",
      createdAt: item.review.created_at,
      user: toUser(username, item.user.id),
      film: {
        title: `TMDB #${item.media.tmdb_id}`,
        year: new Date(item.review.created_at).getFullYear(),
        director: "Crítica recomendada",
        id: String(item.media.tmdb_id),
      },
      rating: Number(item.review.rating || 0),
      text: item.review.content || "Reseña recomendada para ti.",
      tags: ["Para ti", item.review.mode],
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      bookmarked: false,
      canLike: true,
      canComment: true,
      canBookmark: true,
      canShare: true,
      canHide: true,
      canReport: true,
      reviewId: item.review.id,
      bg: FALLBACK_BG,
    };
  }

  const id = toNumericId(item.id, index);
  return {
    id,
    type: "discovery",
    itemRef: `discovery-${item.media.id}`,
    backendType: "discovery",
    sourceTab: "Para ti",
    createdAt: new Date().toISOString(),
    film: {
      title: item.media.title,
      year: item.media.year || new Date().getFullYear(),
      director: item.media.reason || "Sugerencia del algoritmo",
      id: String(item.media.id),
      mediaType: item.media.media_type,
      posterPath: item.media.poster_path,
    },
    quote: item.media.reason || "Descubrimiento para ti",
    description: "Recomendación personalizada según tus gustos recientes.",
    likes: 0,
    comments: 0,
    shares: 0,
    liked: false,
    bookmarked: false,
    canLike: true,
    canComment: false,
    canBookmark: true,
    canShare: true,
    canHide: true,
    canReport: false,
    recommendationMediaId: item.media.id,
    bg: posterUrl(item.media.poster_path),
  };
};

const mapActivityItem = (item: ActivityItem, index: number): FeedItem => {
  const id = toNumericId(item.id, index);
  const username = item.user.username || `usuario${item.user.id}`;
  const baseFilm = {
    title:
      item.movie?.title ||
      (item.movie?.tmdb_id
        ? `TMDB #${item.movie.tmdb_id}`
        : "Actividad social"),
    year: new Date(item.created_at).getFullYear(),
    director: "Actividad de seguidos",
    id: String(item.movie?.tmdb_id || id),
    posterPath: item.movie?.poster_path || null,
    mediaType: item.movie?.media_type as "movie" | "tv" | undefined,
  };

  if (item.type === "review_published" || item.type === "review_liked") {
    const reviewId = item.review?.id;
    const itemRef = reviewId ? `review-${reviewId}` : item.id;
    return {
      id,
      type: "review",
      itemRef,
      backendType: "review",
      sourceTab: "Siguiendo",
      createdAt: item.created_at,
      user: toUser(username, item.user.id),
      film: baseFilm,
      rating: Number(item.review?.rating || 0),
      text: item.review?.content || "Actividad de reseña en tu red.",
      tags: [item.type === "review_liked" ? "Like de reseña" : "Seguidos"],
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      bookmarked: false,
      canLike: true,
      canComment: true,
      canBookmark: true,
      canShare: true,
      canHide: true,
      canReport: true,
      reviewId,
      bg: posterUrl(item.movie?.poster_path),
    };
  }

  if (item.type === "vault_added") {
    return {
      id,
      type: "vault",
      itemRef: item.id,
      backendType: "vault",
      sourceTab: "Siguiendo",
      createdAt: item.created_at,
      user: toUser(username, item.user.id),
      vaultType: "Vault de seguidos",
      title: baseFilm.title,
      duration: "Actualizado ahora",
      description: `${username} añadió esta película a su vault.`,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      bookmarked: false,
      canLike: false,
      canComment: false,
      canBookmark: true,
      canShare: true,
      canHide: true,
      canReport: false,
      bg: posterUrl(item.movie?.poster_path),
    };
  }

  if (item.type === "watchlist_added" || item.type === "diary_entry") {
    const itemRef =
      item.type === "watchlist_added"
        ? item.id
        : `discovery-${toNumericId(item.id, index)}`;

    return {
      id,
      type: "discovery",
      itemRef,
      backendType: item.type === "watchlist_added" ? "watchlist" : "discovery",
      sourceTab: "Siguiendo",
      createdAt: item.created_at,
      film: baseFilm,
      quote:
        item.type === "watchlist_added"
          ? "Añadida para ver después"
          : "Vista recientemente",
      description:
        item.type === "watchlist_added"
          ? `${username} agregó esta película a su watchlist.`
          : `${username} registró esta película en su diario.`,
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      bookmarked: false,
      canLike: false,
      canComment: false,
      canBookmark: true,
      canShare: true,
      canHide: true,
      canReport: false,
      bg: posterUrl(item.movie?.poster_path),
    };
  }

  return {
    id,
    type: "quote",
    itemRef: item.id,
    backendType: "quote",
    sourceTab: "Siguiendo",
    createdAt: item.created_at,
    director: username,
    quote:
      item.type === "follow"
        ? `${username} empezó a seguir a ${item.target_user?.username || "otro usuario"}.`
        : "Nueva actividad en tu red social.",
    source: "Siguiendo",
    likes: 0,
    comments: 0,
    shares: 0,
    liked: false,
    bookmarked: false,
    canLike: false,
    canComment: false,
    canBookmark: false,
    canShare: false,
    canHide: false,
    canReport: false,
    bg: FALLBACK_BG,
  };
};

const buildExactPlan = (
  total: number,
  available: Record<"recommendations" | "global" | "following", number>,
) => {
  const mix = normalizeMixConfig(FOR_YOU_MIX_CONFIG);
  const pct = {
    recommendations: mix.recommendationsPct,
    global: mix.globalSocialPct,
    following: mix.followingPct,
  };

  const raw = {
    recommendations: (total * pct.recommendations) / 100,
    global: (total * pct.global) / 100,
    following: (total * pct.following) / 100,
  };

  const plan = {
    recommendations: Math.min(
      available.recommendations,
      Math.floor(raw.recommendations),
    ),
    global: Math.min(available.global, Math.floor(raw.global)),
    following: Math.min(available.following, Math.floor(raw.following)),
  };

  let remaining = total - (plan.recommendations + plan.global + plan.following);
  const priority: Array<"recommendations" | "global" | "following"> = [
    "recommendations",
    "global",
    "following",
  ];

  while (remaining > 0) {
    let assigned = false;

    for (const key of priority) {
      if (plan[key] < available[key]) {
        plan[key] += 1;
        remaining -= 1;
        assigned = true;
        if (remaining === 0) break;
      }
    }

    if (!assigned) break;
  }

  return plan;
};

const blendForYouItems = (
  recommendations: FeedItem[],
  globalSocial: FeedItem[],
  following: FeedItem[],
) => {
  const totalAvailable =
    recommendations.length + globalSocial.length + following.length;
  const total = Math.min(FOR_YOU_PAGE_SIZE, totalAvailable);

  if (total <= 0) return [];

  const plan = buildExactPlan(total, {
    recommendations: recommendations.length,
    global: globalSocial.length,
    following: following.length,
  });

  const source = {
    recommendations,
    global: globalSocial,
    following,
  };

  const cursor = {
    recommendations: 0,
    global: 0,
    following: 0,
  };

  const used = {
    recommendations: 0,
    global: 0,
    following: 0,
  };

  const result: FeedItem[] = [];
  const seen = new Set<string>();

  while (result.length < total) {
    let progressed = false;

    for (const key of ["recommendations", "global", "following"] as const) {
      if (used[key] >= plan[key]) continue;

      while (cursor[key] < source[key].length) {
        const candidate = source[key][cursor[key]++];
        if (seen.has(candidate.itemRef)) continue;

        seen.add(candidate.itemRef);
        result.push(candidate);
        used[key] += 1;
        progressed = true;
        break;
      }
    }

    if (!progressed) break;
  }

  if (result.length < total) {
    const leftovers = [...recommendations, ...globalSocial, ...following];
    for (const candidate of leftovers) {
      if (result.length >= total) break;
      if (seen.has(candidate.itemRef)) continue;
      seen.add(candidate.itemRef);
      result.push(candidate);
    }
  }

  return result;
};

export function useFeedData(activeTab: FeedTab) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadFeed = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      if (mode === "replace") {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        let nextItems: FeedItem[] = [];
        let nextHasMore = false;

        if (activeTab === "Siguiendo") {
          const activity = await fetchActivityFeed("friends", targetPage, 20);
          nextItems = activity.items.map((item, idx) =>
            mapActivityItem(item, idx + (targetPage - 1) * 20),
          );
          nextHasMore = activity.has_more;
        } else {
          const [forYou, social, following] = await Promise.all([
            fetchForYouFeed(targetPage),
            fetchGlobalFeed(targetPage, 20),
            fetchActivityFeed("friends", targetPage, 20),
          ]);

          const recItems = forYou.items.map((item, idx) =>
            mapForYouItem(item, idx + (targetPage - 1) * 24),
          );
          const socialItems = social.items.map((item, idx) =>
            mapFeedApiItem(item, idx + (targetPage - 1) * 24, "Para ti"),
          );
          const followingItems = following.items.map((item, idx) =>
            mapActivityItem(item, idx + (targetPage - 1) * 24),
          );

          nextItems = blendForYouItems(recItems, socialItems, followingItems);
          nextHasMore =
            forYou.has_more || social.has_more || following.has_more;
        }

        setHasMore(nextHasMore);
        setPage(targetPage);

        if (mode === "replace") {
          setFeed(nextItems);
          setActiveIdx(0);
          const container = containerRef.current;
          if (container) container.scrollTo({ top: 0, behavior: "auto" });
        } else {
          setFeed((prev) => {
            const seen = new Set(prev.map((item) => item.itemRef));
            const merged = [...prev];
            nextItems.forEach((item) => {
              if (!seen.has(item.itemRef)) {
                seen.add(item.itemRef);
                merged.push(item);
              }
            });
            return merged;
          });
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el feed",
        );
        if (mode === "replace") setFeed([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab],
  );

  useEffect(() => {
    void loadFeed(1, "replace");
  }, [loadFeed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (loadingMore || !hasMore) return;
      const nearBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - container.clientHeight * 1.5;
      if (nearBottom) {
        void loadFeed(page + 1, "append");
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [hasMore, loadFeed, loadingMore, page]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || feed.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            if (Number.isFinite(idx)) setActiveIdx(idx);
          }
        });
      },
      { threshold: [0.6], root: container },
    );

    const cards = container.querySelectorAll(".feed-card");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [feed]);

  const goToCard = useCallback((idx: number) => {
    const container = containerRef.current;
    if (!container) return;
    const cards = container.querySelectorAll(".feed-card");
    if (idx < 0 || idx >= cards.length) return;
    cards[idx].scrollIntoView({ behavior: "smooth" });
  }, []);

  return {
    feed,
    setFeed,
    loading,
    loadingMore,
    error,
    activeIdx,
    containerRef,
    goToCard,
    refreshFeed: () => loadFeed(1, "replace"),
    canUp: activeIdx > 0,
    canDown: activeIdx < feed.length - 1,
  };
}
