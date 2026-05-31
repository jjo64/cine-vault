import { useEffect, useState } from "react";
import { useProfileStore } from "../store/useProfileStore";
import {
  fetchDiary,
  fetchFollowers,
  fetchFollowing,
  fetchOwnerCinematicSignature,
  fetchOwnerCuratedGallery,
  fetchPublicCinematicSignature,
  fetchPublicCuratedGallery,
  fetchReviews,
  fetchUserProfile,
  fetchUserProfileByUsername,
  fetchUserBadges,
  fetchWatchlist,
  resolveViewerId,
  fetchVaultSocial,
} from "../../../services/profileServices";
import { getMyLists } from "../../../services/listsServices";
import { IMG } from "../constants";
import type {
  EnrichedMovie,
  RecentlyWatchedItem,
  WatchlistItem,
  ReviewItem,
  DiaryTimelineItem,
  ProfileConnection,
  ProfileHeaderData,
  ProfileStatsData,
  UserListSummaryItem,
  CinematicSignatureData,
  RichDiaryEntry,
  RichWatchlistEntry,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL;

const moviePoster = (path?: string | null, size: "w300" | "w500" = "w300") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : IMG.grain;

const relativeDateLabel = (date: string) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const days = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (days < 7) return `hace ${days} día${days > 1 ? "s" : ""}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `hace ${weeks} semana${weeks > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months > 1 ? "es" : ""}`;
};

const cleanReviewText = (content: string | null) => {
  if (!content) return "Sin comentario aún.";
  return content.replace(/\n/g, " ").trim();
};

const parseRatingValue = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(5, parsed));
};

const formatDiaryDateLabel = (date: string | null) => {
  if (!date) return "Fecha desconocida";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Fecha desconocida";
  return parsed.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
};

const mapMoodFromRating = (rating: number) => {
  if (rating >= 4.5) return "eufórico";
  if (rating >= 3.5) return "contemplativo";
  if (rating >= 2.5) return "nostálgico";
  return "disonante";
};

const mapStageFromIndex = (index: number) => {
  const stages = [
    "Etapa de descubrimiento",
    "Revisión del canon personal",
    "Ritmo nocturno de visionado",
    "Curaduría en construcción",
  ];
  return stages[index % stages.length];
};

const pickTags = (content: string | null): string[] => {
  const normalized = (content || "").toLowerCase();
  const tags: string[] = [];
  if (normalized.includes("tarkovsky")) tags.push("Tarkovsky");
  if (normalized.includes("drama")) tags.push("Drama");
  if (normalized.includes("surreal")) tags.push("Surrealismo");
  if (normalized.includes("cine")) tags.push("Cine");
  return tags.length > 0 ? tags : ["Reseña", "CineVault"];
};

const isQuickRatingPlaceholder = (content: string | null) => {
  if (!content) return true;
  const normalized = content
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return normalized === "rating rapido desde movie detail";
};

type ReviewMediaType = "movie" | "tv";

type MovieMetaTarget = {
  movieId: number;
  tmdbId: number | null;
  mediaType: ReviewMediaType;
};

async function fetchMovieMetaMap(
  targets: MovieMetaTarget[],
  existingMap?: Map<number, EnrichedMovie>,
) {
  const map = new Map<number, EnrichedMovie>(
    existingMap ? Array.from(existingMap.entries()) : [],
  );

  const normalized = Array.from(
    new Map(
      targets
        .filter((item) => item.tmdbId !== null && !map.has(item.movieId))
        .map((item) => [item.movieId, item]),
    ).entries(),
  );

  if (normalized.length === 0) return map;

  const batch = normalized.slice(0, 40);

  const entries = await Promise.allSettled(
    batch.map(async ([movieId, target]) => {
      const tmdbId = target.tmdbId as number;
      const endpoint =
        target.mediaType === "tv"
          ? `${API_URL}/api/search/tv/${tmdbId}`
          : `${API_URL}/api/movies/${tmdbId}`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("No se pudo obtener película");
      const data = await res.json();
      const creditsCrew = data.credits?.crew || [];
      const creatorName = data.created_by?.[0]?.name || "Desconocido";
      const director =
        target.mediaType === "tv"
          ? creatorName ||
            creditsCrew.find(
              (person: { job?: string; name?: string }) =>
                person.job === "Director" || person.job === "Creator",
            )?.name ||
            "Desconocido"
          : creditsCrew.find(
              (person: { job?: string; name?: string }) =>
                person.job === "Director",
            )?.name || "Desconocido";
      const year =
        target.mediaType === "tv"
          ? data.first_air_date
            ? Number(String(data.first_air_date).split("-")[0])
            : null
          : data.release_date
            ? Number(String(data.release_date).split("-")[0])
            : null;
      const runtimeMinutes =
        target.mediaType === "tv"
          ? Array.isArray(data.episode_run_time) &&
            typeof data.episode_run_time[0] === "number"
            ? data.episode_run_time[0]
            : null
          : typeof data.runtime === "number"
            ? data.runtime
            : null;
      const primaryGenre =
        Array.isArray(data.genres) && data.genres.length > 0
          ? (data.genres[0]?.name ?? null)
          : null;
      const meta: EnrichedMovie = {
        movieId,
        tmdbId,
        title: data.title || data.name || `Título ${tmdbId}`,
        year,
        director,
        posterUrl: moviePoster(data.poster_path, "w500"),
        runtimeMinutes,
        primaryGenre,
        mediaType: target.mediaType,
      };
      return [movieId, meta] as const;
    }),
  );

  entries.forEach((item) => {
    if (item.status === "fulfilled") {
      const [movieId, data] = item.value;
      map.set(movieId, data);
    }
  });
  return map;
}

export function useProfileData(usernameParam?: string) {
  const setLoading = useProfileStore((s) => s.setLoading);
  const setError = useProfileStore((s) => s.setError);
  const setAuthAndProfileRoles = useProfileStore((s) => s.setAuthAndProfileRoles);
  const setProfileData = useProfileStore((s) => s.setProfileData);
  const resetStore = useProfileStore((s) => s.resetStore);
  const setFollowingState = useProfileStore((s) => s.setFollowingState);

  const [refCount, setRefCount] = useState(0);
  const refresh = () => setRefCount((prev) => prev + 1);

  useEffect(() => {
    let active = true;

    // Resetear el store al cambiar de usuario o refrescar
    resetStore();

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          userId: resolvedViewerId,
          username: viewerUsername,
          token,
        } = await resolveViewerId();
        const normalizedTargetUsername = (
          usernameParam ||
          viewerUsername ||
          ""
        ).trim();

        if (!active) return;

        const authActive = Boolean(token);
        
        

        if (!normalizedTargetUsername) {
          setLoading(false);
          return;
        }

        const profileData = await fetchUserProfileByUsername(
          normalizedTargetUsername,
        );

        if (!active) return;

        if (!profileData) {
          setLoading(false);
          setError("Perfil no encontrado");
          return;
        }

        const resolvedTargetId = profileData.id;
        const profileIsSelf = resolvedViewerId === resolvedTargetId;
        const finalIsOwn = profileIsSelf;
        const finalIsPublic = !finalIsOwn;

        setAuthAndProfileRoles(authActive, finalIsOwn, finalIsPublic, resolvedTargetId);

        const authToken = finalIsOwn ? token : null;

        const signatureFallback = {
          user_id: resolvedTargetId,
          pivotal_film: null,
          pivotal_film_detail: null,
          formative_director: null,
          formative_director_detail: null,
          unforgettable_scene: null,
          unforgettable_scene_detail: null,
          cinema_turning_year: null,
          cinema_turning_year_detail: null,
        };

        const viewerDiaryPromise = (authActive && !finalIsOwn)
          ? fetchDiary(resolvedViewerId!, token, true).catch(() => ({ diary: [] as RichDiaryEntry[] }))
          : Promise.resolve({ diary: [] as RichDiaryEntry[] });

        const [
          fullProfileData,
          diaryData,
          watchlistData,
          reviewsData,
          followersData,
          followingData,
          signatureData,
          curatedGalleryData,
          badgesData,
          vaultData,
          viewerDiaryData,
        ] = await Promise.all([
          fetchUserProfile(resolvedTargetId, token),
          fetchDiary(resolvedTargetId, authToken, finalIsOwn),
          fetchWatchlist(resolvedTargetId, authToken, finalIsOwn),
          fetchReviews(resolvedTargetId, authToken, finalIsOwn),
          fetchFollowers(resolvedTargetId),
          fetchFollowing(resolvedTargetId),
          finalIsOwn
            ? fetchOwnerCinematicSignature(authToken).catch(() => ({
                ok: true,
                data: signatureFallback,
              }))
            : fetchPublicCinematicSignature(resolvedTargetId).catch(
                () => signatureFallback,
              ),
          finalIsOwn
            ? fetchOwnerCuratedGallery(authToken).catch(() => ({
                ok: true,
                data: { items: [] },
              }))
            : fetchPublicCuratedGallery(resolvedTargetId).catch(() => ({
                items: [],
              })),
          fetchUserBadges(resolvedTargetId).catch(() => []),
          fetchVaultSocial(resolvedTargetId, authToken, finalIsOwn).catch(() => ({
            items: [],
          })),
          viewerDiaryPromise,
        ]);

        if (!active) return;

        const nextDiary = diaryData.diary ?? [];
        const nextWatchlist = [...(watchlistData ?? [])].sort((a, b) => {
          const aTime = a.added_at ? new Date(a.added_at).getTime() : 0;
          const bTime = b.added_at ? new Date(b.added_at).getTime() : 0;
          return bTime - aTime;
        });
        const nextReviews = reviewsData ?? [];

        const resolvedSignature: CinematicSignatureData =
          finalIsOwn &&
          typeof signatureData === "object" &&
          signatureData !== null &&
          "data" in signatureData
            ? signatureData.data
            : (signatureData as CinematicSignatureData);

        const resolvedCuratedItems =
          finalIsOwn &&
          typeof curatedGalleryData === "object" &&
          curatedGalleryData !== null &&
          "data" in curatedGalleryData
            ? curatedGalleryData.data.items
            : "items" in curatedGalleryData
              ? curatedGalleryData.items
              : [];

        // Cargar listas si es perfil propio
        let userListsData: UserListSummaryItem[] = [];
        if (finalIsOwn) {
          const lists = await getMyLists().catch(() => []);
          if (!active) return;
          userListsData = (Array.isArray(lists) ? lists : []).map((list) => ({
            id: list.id,
            name: list.name,
            itemsCount: list.items_count,
            isPublic: list.is_public,
            description: list.description ?? null,
          }));
        }

        const tmdbByMovieId = new Map<number, number | null>();
        const initialMap = new Map<number, EnrichedMovie>();

        const seedFromEntry = (item: RichDiaryEntry | RichWatchlistEntry) => {
          tmdbByMovieId.set(item.movie_id, item.tmdb_id);
          if (item.movie_info && item.tmdb_id) {
            initialMap.set(item.movie_id, {
              movieId: item.movie_id,
              tmdbId: item.tmdb_id,
              title: item.movie_info.title,
              director: (item.movie_info as any).director || "Desconocido",
              year: (item.movie_info as any).year || null,
              posterUrl: moviePoster(item.movie_info.poster_path, "w500"),
              mediaType:
                (item as any).mediaType ||
                (item as any).media_type ||
                (item.movie_info as any)?.media_type ||
                "movie",
            });
          }
        };

        nextDiary.forEach(seedFromEntry);
        nextWatchlist.forEach(seedFromEntry);

        const ids: MovieMetaTarget[] = [
          ...nextDiary.slice(0, 12).map((item) => ({
            movieId: item.movie_id,
            tmdbId: item.tmdb_id,
            mediaType: (item.movie_info?.media_type as any) || "movie",
          })),
          ...nextWatchlist.slice(0, 20).map((item) => ({
            movieId: item.movie_id,
            tmdbId: item.tmdb_id,
            mediaType: (item.movie_info?.media_type as any) || "movie",
          })),
          ...nextReviews.slice(0, 12).map((item) => ({
            movieId: item.movie_id,
            tmdbId:
              item.tmdb_id ??
              item.movies_ref?.tmdb_id ??
              tmdbByMovieId.get(item.movie_id) ??
              null,
            mediaType:
              (item.media_type as any) ||
              (item.movies_ref as any)?.media_type ||
              "movie",
          })),
        ];

        const movieMetaMap = await fetchMovieMetaMap(ids, initialMap);
        if (!active) return;

        // Construir datos procesados finales
        const year = fullProfileData.created_at
          ? new Date(fullProfileData.created_at).getFullYear().toString()
          : "2024";
        const bio = (fullProfileData.bio || "").trim() || "Sin biografía todavía.";

        const profileHeader: ProfileHeaderData = {
          displayName: fullProfileData.username || "Perfil",
          username: fullProfileData.username || "perfil",
          memberSince: year,
          avatarUrl: fullProfileData.avatar_url || IMG.avatar,
          bio,
          membership: fullProfileData.membership,
        };

        const writtenReviews = nextReviews.filter((entry) => !isQuickRatingPlaceholder(entry.content));

        const grouped = new Map<number, typeof writtenReviews>();
        for (const review of writtenReviews) {
          const current = grouped.get(review.movie_id) || [];
          current.push(review);
          grouped.set(review.movie_id, current);
        }
        const reviewSequenceById = new Map<number, number>();
        for (const [, movieReviews] of grouped.entries()) {
          movieReviews
            .slice()
            .sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            )
            .forEach((review, index) => {
              reviewSequenceById.set(review.id, index + 1);
            });
        }

        const stats: ProfileStatsData = {
          views: fullProfileData._count?.diary_entries ?? nextDiary.length,
          reviews: writtenReviews.length,
          watchlist: fullProfileData._count?.watchlist ?? nextWatchlist.length,
          following:
            fullProfileData._count?.follows_follows_follower_idTousers ?? followingData.length,
          followers:
            fullProfileData._count?.follows_follows_following_idTousers ??
            followersData.length,
        };

        const followerUsers: ProfileConnection[] = followersData.map((item) => ({
          id: item.id,
          username: item.username,
          avatarUrl: item.avatar_url || null,
        }));

        const followingUsers: ProfileConnection[] = followingData.map((item) => ({
          id: item.id,
          username: item.username,
          avatarUrl: item.avatar_url || null,
        }));

        const recentlyWatched: RecentlyWatchedItem[] = [];
        const seenMovieIds = new Set<number>();
        for (const entry of nextDiary) {
          if (!seenMovieIds.has(entry.movie_id)) {
            seenMovieIds.add(entry.movie_id);
            const fromMovieMap = movieMetaMap.get(entry.movie_id);
            recentlyWatched.push({
              id: entry.id,
              movieId: entry.movie_id,
              tmdbId: entry.tmdb_id ?? fromMovieMap?.tmdbId ?? null,
              title:
                entry.movie_info?.title ||
                fromMovieMap?.title ||
                `Película ${entry.movie_id}`,
              year: fromMovieMap?.year ?? null,
              director: fromMovieMap?.director || "Desconocido",
              posterUrl: entry.movie_info?.poster_path
                ? moviePoster(entry.movie_info.poster_path, "w500")
                : fromMovieMap?.posterUrl || IMG.grain,
              rating: parseRatingValue(entry.review?.rating),
              mediaType:
                (entry.movie_info?.media_type as any) ||
                fromMovieMap?.mediaType ||
                "movie",
            });
            if (recentlyWatched.length === 6) break;
          }
        }

        const watchlistFilms: WatchlistItem[] = nextWatchlist.slice(0, 20).map((entry, index) => {
          const fromMovieMap = movieMetaMap.get(entry.movie_id);
          return {
            movieId: entry.movie_id,
            tmdbId: entry.tmdb_id ?? fromMovieMap?.tmdbId ?? null,
            title:
              entry.movie_info?.title ||
              fromMovieMap?.title ||
              `Película ${entry.movie_id}`,
            year: fromMovieMap?.year ?? null,
            director: fromMovieMap?.director || "Desconocido",
            posterUrl: entry.movie_info?.poster_path
              ? moviePoster(entry.movie_info.poster_path, "w500")
              : fromMovieMap?.posterUrl || IMG.grain,
            runtimeMinutes: fromMovieMap?.runtimeMinutes ?? null,
            primaryGenre: fromMovieMap?.primaryGenre ?? null,
            priority: index < 4 ? "alta" : "normal",
            mediaType:
              (entry.movie_info?.media_type as any) ||
              fromMovieMap?.mediaType ||
              "movie",
          };
        });

        const reviewItems: ReviewItem[] = writtenReviews.slice(0, 12).map((entry) => {
          const fromMovieMap = movieMetaMap.get(entry.movie_id);
          const fromDiary = nextDiary.find(
            (diaryEntry) => diaryEntry.movie_id === entry.movie_id,
          );
          const fromWatchlist = nextWatchlist.find(
            (watchlistEntry) => watchlistEntry.movie_id === entry.movie_id,
          );
          return {
            id: entry.id,
            mediaType:
              entry.media_type === "tv" ? ("tv" as const) : ("movie" as const),
            movieId: entry.movie_id,
            tmdbId:
              entry.tmdb_id ??
              entry.movies_ref?.tmdb_id ??
              fromMovieMap?.tmdbId ??
              fromDiary?.tmdb_id ??
              fromWatchlist?.tmdb_id ??
              null,
            username: fullProfileData?.username || "perfil",
            createdAtIso: entry.created_at,
            reviewSequence: reviewSequenceById.get(entry.id) || 1,
            title:
              fromMovieMap?.title ||
              fromDiary?.movie_info?.title ||
              fromWatchlist?.movie_info?.title ||
              `Título ${entry.movie_id}`,
            year: fromMovieMap?.year ?? null,
            director: fromMovieMap?.director || "Desconocido",
            posterUrl:
              fromMovieMap?.posterUrl ||
              (fromDiary?.movie_info?.poster_path ||
              fromWatchlist?.movie_info?.poster_path
                ? moviePoster(
                    fromDiary?.movie_info?.poster_path ||
                      fromWatchlist?.movie_info?.poster_path,
                    "w500",
                  )
                : IMG.grain),
            rating: parseRatingValue(entry.rating),
            createdAtLabel: relativeDateLabel(entry.created_at),
            text: cleanReviewText(entry.content),
            tags: pickTags(entry.content),
          };
        });

        const allDiaryFilms: RecentlyWatchedItem[] = nextDiary.map((entry) => {
          const fromMovieMap = movieMetaMap.get(entry.movie_id);
          return {
            id: entry.id,
            movieId: entry.movie_id,
            tmdbId: entry.tmdb_id ?? fromMovieMap?.tmdbId ?? null,
            title:
              entry.movie_info?.title ||
              fromMovieMap?.title ||
              `Película ${entry.movie_id}`,
            year: fromMovieMap?.year ?? null,
            director: fromMovieMap?.director || "Desconocido",
            posterUrl: entry.movie_info?.poster_path
              ? moviePoster(entry.movie_info.poster_path, "w500")
              : fromMovieMap?.posterUrl || IMG.grain,
            rating: parseRatingValue(entry.review?.rating),
            mediaType:
              (entry.movie_info?.media_type as any) ||
              fromMovieMap?.mediaType ||
              "movie",
            watchedDate: entry.watched_date,
            primaryGenre: fromMovieMap?.primaryGenre ?? null,
            runtimeMinutes: fromMovieMap?.runtimeMinutes ?? null,
          };
        });

        const diaryTimeline: DiaryTimelineItem[] = nextDiary.slice(0, 12).map((entry, index) => {
          const fromMovieMap = movieMetaMap.get(entry.movie_id);
          const rating = parseRatingValue(entry.review?.rating);
          const rawNote = cleanReviewText(entry.review?.content ?? null);
          const note = isQuickRatingPlaceholder(rawNote) ? null : rawNote;

          return {
            movieId: entry.movie_id,
            tmdbId: entry.tmdb_id ?? fromMovieMap?.tmdbId ?? null,
            title:
              entry.movie_info?.title ||
              fromMovieMap?.title ||
              `Película ${entry.movie_id}`,
            year: fromMovieMap?.year ?? null,
            director: fromMovieMap?.director || "Desconocido",
            posterUrl: entry.movie_info?.poster_path
              ? moviePoster(entry.movie_info.poster_path, "w500")
              : fromMovieMap?.posterUrl || IMG.grain,
            rating,
            watchedDateLabel: formatDiaryDateLabel(entry.watched_date),
            moodLabel: mapMoodFromRating(rating),
            stageLabel: mapStageFromIndex(index),
            id: entry.id,
            note,
            mediaType:
              (entry.movie_info?.media_type as any) ||
              fromMovieMap?.mediaType ||
              "movie",
          };
        });

        let compatibilityScore: number | null = null;
        if (authActive && !finalIsOwn) {
          const targetDiary = diaryData?.diary || [];
          const viewerDiary = viewerDiaryData?.diary || [];

          if (targetDiary.length > 0 && viewerDiary.length > 0) {
            // Build movie sets
            const targetMovieIds = new Set(targetDiary.map((d) => d.movie_id));
            const viewerMovieIds = new Set(viewerDiary.map((d) => d.movie_id));

            // Jaccard similarity: intersection / union
            const intersection = [...viewerMovieIds].filter((id) => targetMovieIds.has(id));
            const union = new Set([...viewerMovieIds, ...targetMovieIds]);
            const jaccardScore = union.size > 0 ? intersection.length / union.size : 0;

            // Rating similarity bonus: for common movies, compare ratings
            const targetRatingMap = new Map<number, number>();
            for (const d of targetDiary) {
              if (d.review?.rating != null) targetRatingMap.set(d.movie_id, Number(d.review.rating));
            }
            const viewerRatingMap = new Map<number, number>();
            for (const d of viewerDiary) {
              if (d.review?.rating != null) viewerRatingMap.set(d.movie_id, Number(d.review.rating));
            }

            let ratingBonus = 0;
            let ratingComparisons = 0;
            for (const movieId of intersection) {
              const tRating = targetRatingMap.get(movieId);
              const vRating = viewerRatingMap.get(movieId);
              if (tRating != null && vRating != null) {
                const diff = Math.abs(tRating - vRating); // 0 to 5
                ratingBonus += 1 - diff / 5; // 0 to 1
                ratingComparisons++;
              }
            }
            const avgRatingSimilarity = ratingComparisons > 0 ? ratingBonus / ratingComparisons : 0.5;

            // Weighted final score: 60% Jaccard + 40% rating similarity, clamped to 10–99
            const rawScore = jaccardScore * 0.6 + avgRatingSimilarity * 0.4;
            compatibilityScore = Math.round(Math.min(99, Math.max(10, rawScore * 100)));
          }
          // If no diary data for either user, leave as null (banner won't show)
        }

        setProfileData({
          profileHeader,
          stats,
          followerUsers,
          followingUsers,
          userBadges: badgesData || [],
          userLists: userListsData,
          vaultSocialEntries: vaultData.items || [],
          recentlyWatched,
          watchlistFilms,
          reviewItems,
          diaryTimeline,
          allDiaryFilms,
          signature: resolvedSignature,
          curatedGalleryItems: resolvedCuratedItems,
          compatibilityScore,
        });

        setFollowingState(Boolean(fullProfileData.is_following), stats.followers);
      } catch (err) {
        if (!active) return;
        setError("No se pudo cargar el perfil");
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [usernameParam, refCount, setLoading, setError, setAuthAndProfileRoles, setProfileData, resetStore, setFollowingState]);

  return { refresh };
}
