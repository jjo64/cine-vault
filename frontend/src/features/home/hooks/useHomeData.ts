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
          followingRes, 
          directorsRes, 
          arcosRes, 
          mentirasRes
        ] = await Promise.allSettled([
          authorizedJson<DiaryEntry[]>("/api/diary"),
          authorizedJson<WatchlistEntry[]>("/api/watchlist"),
          authorizedJson<ReviewEntry[]>("/api/reviews"),
          authorizedJson<VaultEntry[]>("/api/vault"),
          authorizedJson<UserListSummary[]>("/api/lists"),
          authorizedJson<any[]>("/api/lists/public"),
          authorizedJson<any>("/api/social/following-activity"),
          authorizedJson<any[]>("/api/films/directors-discovery"),
          authorizedJson<any[]>("/api/arcos"),
          authorizedJson<MentirasRanking>("/api/mentiras/ranking"),
        ]);

        if (!isMounted) return;

        if (diaryRes.status === "fulfilled") setDiary((diaryRes.value as any)?.diary || diaryRes.value || []);
        if (watchlistRes.status === "fulfilled") setWatchlist(watchlistRes.value as WatchlistEntry[] || []);
        if (reviewsRes.status === "fulfilled") setReviews(reviewsRes.value as ReviewEntry[] || []);
        if (vaultRes.status === "fulfilled") setVault(vaultRes.value as VaultEntry[] || []);
        if (listsRes.status === "fulfilled") setLists(listsRes.value as UserListSummary[] || []);
        if (publicListsRes.status === "fulfilled") setPublicLists(publicListsRes.value as any[] || []);
        if (directorsRes.status === "fulfilled") setDirectors(directorsRes.value as any[] || []);
        if (arcosRes.status === "fulfilled") setArcos(arcosRes.value as any[] || []);
        if (mentirasRes.status === "fulfilled") setMentiras(mentirasRes.value as MentirasRanking || {});

        if (followingRes.status === "fulfilled" && followingRes.value) {
          const val = followingRes.value as any;
          const acts = val.activity || [];
          const revs = val.reviews || [];

          setFollowingActivity(acts.map((a: any) => ({
            user: a.user?.username || "Usuario",
            username: a.user?.username || "",
            avatar: (a.user?.username || "U")[0].toUpperCase(),
            film: a.movie?.title || "Pelicula",
            movieId: a.movie_id,
            tmdbId: a.movie?.tmdb_id,
            rating: normalizeRating(a.rating),
            time: relativeLabel(a.created_at),
            posterUrl: toPoster(a.movie?.poster_path),
          })));

          setFollowingReviews(revs.map((r: any) => ({
            id: r.id,
            user: r.user?.username || "Usuario",
            username: r.user?.username || "",
            avatar: (r.user?.username || "U")[0].toUpperCase(),
            movieId: r.movie_id,
            tmdbId: r.movie?.tmdb_id,
            rating: normalizeRating(r.rating),
            text: r.content || "",
            likes: r.likes_count || 0,
            createdAt: r.created_at,
          })));
        }

        // Onboarding check
        const diaryData = diaryRes.status === "fulfilled" ? ((diaryRes.value as any)?.diary || diaryRes.value || []) : [];
        if (diaryRes.status === "fulfilled" && diaryData.length === 0) {
          setNeedsOnboarding(true);
        }

        // Tonight/ForYou recommendation logic
        if (diaryRes.status === "fulfilled" && diaryData.length > 0) {
          const last = diaryData[0];
          const lastTmdb = last.tmdb_id || last.movie_info?.tmdb_id;
          
          if (lastTmdb) {
            try {
              const recs = await authorizedJson<any[]>(`/api/films/${lastTmdb}/recommendations`);
              if (isMounted && recs && Array.isArray(recs) && recs.length > 0) {
                setForYouMovies(recs.slice(0, 8));
                const top = recs[0];
                setTonightMovie({
                  title: top.title,
                  posterUrl: toPoster(top.poster_path),
                  backdropUrl: toBackdrop(top.backdrop_path),
                  year: top.release_date ? new Date(top.release_date).getFullYear() : null,
                  director: "Director Desconocido",
                  runtimeLabel: "120 min",
                  genres: ["Drama", "Cine"],
                  overview: top.overview,
                });
              }
            } catch (err) {
              console.error("Error fetching recs:", err);
            }
          }
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
