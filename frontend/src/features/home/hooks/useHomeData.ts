import { useState, useEffect } from "react";
import { authorizedJson } from "../../../services/authServices";
import type { 
  DiaryEntry, WatchlistEntry, ReviewEntry, VaultEntry, 
  MentirasRanking, UserListSummary, 
  MovieMeta, FollowingActivityItem, FollowingReviewItem 
} from "../types";
import { 
  toPoster, toBackdrop, normalizeRating, relativeLabel 
} from "../utils";

export const useHomeData = (username: string) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [vault, setVault] = useState<VaultEntry[]>([]);
  const [lists, setLists] = useState<UserListSummary[]>([]);
  const [publicLists, setPublicLists] = useState<any[]>([]);
  const [followingActivity, setFollowingActivity] = useState<FollowingActivityItem[]>([]);
  const [followingReviews, setFollowingReviews] = useState<FollowingReviewItem[]>([]);
  const [directors, setDirectors] = useState<any[]>([]);
  const [arcos, setArcos] = useState<any[]>([]);
  const [mentiras, setMentiras] = useState<MentirasRanking>({});
  const [forYouMovies, setForYouMovies] = useState<any[]>([]);
  const [tonightMovie, setTonightMovie] = useState<MovieMeta | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [metaByTmdb, setMetaByTmdb] = useState<Record<number, any>>({});

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      try {
        setLoading(true);
        const [
          diaryRes, 
          watchlistRes, 
          reviewsRes, 
          vaultRes, 
          listsRes, 
          publicListsRes, 
          activityRes, 
          directorsRes, 
          arcosRes, 
          mentirasRes,
          onboardingRes,
          tonightRes,
          forYouRes
        ] = await Promise.allSettled([
          authorizedJson<any>("/api/diary"),
          authorizedJson<WatchlistEntry[]>("/api/watchlist"),
          authorizedJson<ReviewEntry[]>("/api/reviews"),
          authorizedJson<VaultEntry[]>("/api/vault"),
          authorizedJson<UserListSummary[]>("/api/lists"),
          authorizedJson<any>("/api/lists/public"),
          authorizedJson<any>("/api/activity/feed"),
          authorizedJson<any>("/api/recommendations/directors"),
          authorizedJson<any[]>("/api/arcos"),
          authorizedJson<MentirasRanking>("/api/mentiras/ranking"),
          authorizedJson<any>("/api/recommendations/onboarding/status"),
          authorizedJson<any>("/api/recommendations/tonight"),
          authorizedJson<any>("/api/recommendations/for-you"),
        ]);

        if (!isMounted) return;

        // Extract and set core data
        if (diaryRes.status === "fulfilled") setDiary(diaryRes.value?.diary || []);
        if (watchlistRes.status === "fulfilled") setWatchlist(watchlistRes.value || []);
        if (reviewsRes.status === "fulfilled") setReviews(reviewsRes.value || []);
        if (vaultRes.status === "fulfilled") setVault(vaultRes.value || []);
        if (listsRes.status === "fulfilled") setLists(listsRes.value || []);
        if (publicListsRes.status === "fulfilled") setPublicLists(publicListsRes.value?.items || []);
        if (directorsRes.status === "fulfilled") setDirectors(directorsRes.value?.items || []);
        if (arcosRes.status === "fulfilled") setArcos(arcosRes.value || []);
        if (mentirasRes.status === "fulfilled") setMentiras(mentirasRes.value || {});
        if (onboardingRes.status === "fulfilled") setNeedsOnboarding(onboardingRes.value?.needs_onboarding || false);
        if (tonightRes.status === "fulfilled" && tonightRes.value) {
          // tonightRes.value is { id, type, media: { id, title, year, poster_path, ... } }
          const m = tonightRes.value.media || tonightRes.value;
          setTonightMovie({
            title: m.title || m.name || "Sugerencia",
            posterUrl: toPoster(m.poster_path),
            backdropUrl: toBackdrop(m.backdrop_path),
            year: m.year || (m.release_date ? new Date(m.release_date).getFullYear() : null),
            director: m.director || "CineVault Choice",
            runtimeLabel: m.runtime ? `${m.runtime} min` : "120 min",
            genres: m.genres?.map((g: any) => g.name) || ["Drama"],
            overview: m.overview || m.reason || "",
          });
        }
        if (forYouRes.status === "fulfilled") setForYouMovies(forYouRes.value?.items || []);

        if (activityRes.status === "fulfilled" && activityRes.value) {
          const items: any[] = activityRes.value.items || [];
          
          // ActivityEvents: review_published, diary_entry, vault_added, watchlist_added, review_liked, follow
          const reviewItems = items.filter(i => i.type === "review_published" || i.review);
          const activityItems = items.filter(i => i.type !== "review_published");

          setFollowingActivity(activityItems.map((a: any) => ({
            user: a.user?.username || "Usuario",
            username: a.user?.username || "",
            avatar: (a.user?.username || "U")[0].toUpperCase(),
            film: a.movie?.title || "Pelicula",
            movieId: a.movie?.id || a.movie_id,
            tmdbId: a.movie?.tmdb_id,
            rating: normalizeRating(a.review?.rating || a.rating),
            time: relativeLabel(a.created_at),
            posterUrl: toPoster(a.movie?.poster_path),
          })));

          setFollowingReviews(reviewItems.map((r: any) => ({
            id: r.review?.id || r.id,
            user: r.user?.username || "Usuario",
            username: r.user?.username || "",
            avatar: (r.user?.username || "U")[0].toUpperCase(),
            movieId: r.movie?.id || r.movie_id,
            tmdbId: r.movie?.tmdb_id,
            rating: normalizeRating(r.review?.rating || r.rating),
            text: r.review?.content || r.content || "",
            likes: r.review?.likes_count || r.likes_count || 0,
            createdAt: r.created_at || r.review?.created_at,
          })));
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Error al cargar datos");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();
    return () => { isMounted = false; };
  }, [username]);

  return {
    loading,
    error,
    diary,
    watchlist,
    reviews,
    vault,
    lists,
    publicLists,
    followingActivity,
    followingReviews,
    directors,
    arcos,
    mentiras,
    forYouMovies,
    tonightMovie,
    needsOnboarding,
    setNeedsOnboarding,
    setFollowingReviews,
    metaByTmdb,
    setMetaByTmdb
  };
};
