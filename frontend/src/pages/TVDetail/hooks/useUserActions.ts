import { useState, useEffect } from "react";
import {
  addToDiary,
  addToFavorites,
  addToWatchlist,
  createReview,
  deleteReview,
  fetchMovieReviews,
  fetchMyDiary,
  fetchMyFavorites,
  fetchMyReviews,
  fetchMyWatchlist,
  fetchUserById,
  removeFromDiary,
  removeFromFavorites,
  removeFromWatchlist,
  updateReview,
  type ReviewApi,
  updateReviewContent,
  type ReviewMode,
} from "../../../services/movieDetailServices";
import {
  getCurrentUser,
  getStoredAccessToken,
} from "../../../services/authServices";

export type AppReview = ReviewApi & { username: string };
type ViewerMeta = {
  id: number;
  membership?: string | null;
  role?: string | null;
};

export function useUserActions(detailId: number | undefined) {
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [savingAction, setSavingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inDiary, setInDiary] = useState(false);
  const [diaryEntryId, setDiaryEntryId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [myReviewId, setMyReviewId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewer, setViewer] = useState<ViewerMeta | null>(null);

  const [reviewLogOpen, setReviewLogOpen] = useState(false);
  const [reviewLogSaving, setReviewLogSaving] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [reviewLogForm, setReviewLogForm] = useState({
    text: "",
    rating: 0,
    mode: "RAPIDO" as ReviewMode,
    veredicto: "",
    contieneSpoilers: false,
    citaDialogo: "",
    citaPersonaje: "",
    timestamps: [] as Array<{ minuto: string; descripcion: string }>,
    dimensions: {
      direccion: null as number | null,
      guion: null as number | null,
      fotografia: null as number | null,
      actuaciones: null as number | null,
      bandaSonora: null as number | null,
    },
    liked: false,
    seenDate: new Date().toISOString().slice(0, 10),
    seenBefore: false,
  });

  const mapReviewToForm = (review?: AppReview | null) => ({
    text: review?.content || "",
    rating: Number(review?.rating || userRating || 0),
    mode: (review?.mode as ReviewMode) || "RAPIDO",
    veredicto: review?.veredicto || "",
    contieneSpoilers: !!review?.contiene_spoilers,
    citaDialogo: review?.cita_dialogo || "",
    citaPersonaje: review?.cita_personaje || "",
    timestamps: Array.isArray(review?.timestamps) ? review.timestamps : [],
    dimensions: {
      direccion:
        review?.rating_direccion != null
          ? Number(review.rating_direccion)
          : null,
      guion: review?.rating_guion != null ? Number(review.rating_guion) : null,
      fotografia:
        review?.rating_fotografia != null
          ? Number(review.rating_fotografia)
          : null,
      actuaciones:
        review?.rating_actuaciones != null
          ? Number(review.rating_actuaciones)
          : null,
      bandaSonora:
        review?.rating_banda_sonora != null
          ? Number(review.rating_banda_sonora)
          : null,
    },
    liked: isFavorite,
    seenDate: new Date().toISOString().slice(0, 10),
    seenBefore: false,
  });

  const refreshReviews = async (targetDetailId: number) => {
    const rawRev = await fetchMovieReviews(targetDetailId);
    const withUsers = await Promise.all(
      rawRev.slice(0, 20).map(async (r) => {
        try {
          const u = await fetchUserById(r.user_id);
          return { ...r, username: u.username || `user-${r.user_id}` };
        } catch {
          return { ...r, username: `user-${r.user_id}` };
        }
      }),
    );
    setReviews(withUsers);
  };

  useEffect(() => {
    if (!detailId) return;
    let alive = true;
    const token = getStoredAccessToken();

    const load = async () => {
      try {
        if (!token) return;
        const currentUser = await getCurrentUser();
        if (!alive) return;
        setIsAuthenticated(true);
        setViewer({
          id: currentUser.id,
          membership: currentUser.membership || null,
          role: currentUser.role || null,
        });

        const [favs, wl, diary, myRev, rawRev] = await Promise.all([
          fetchMyFavorites(token),
          fetchMyWatchlist(token),
          fetchMyDiary(token),
          fetchMyReviews(token),
          fetchMovieReviews(detailId),
        ]);
        if (!alive) return;

        setIsFavorite(
          favs.some(
            (e) =>
              (e.tmdb_id === detailId || e.movie_id === detailId) &&
              ((e as any).media_type === "tv" ||
                (e as any).movie_info?.media_type === "tv"),
          ),
        );
        setInWatchlist(
          wl.some(
            (e) =>
              (e.tmdb_id === detailId || e.movie_id === detailId) &&
              ((e as any).media_type === "tv" ||
                (e as any).movie_info?.media_type === "tv"),
          ),
        );

        const diaryHit = (diary.diary || []).find(
          (e) =>
            (e.tmdb_id === detailId || e.movie_id === detailId) &&
            (e as any).media_type === "tv",
        );
        setInDiary(Boolean(diaryHit));
        setDiaryEntryId(diaryHit?.id ?? null);

        const myRev_ = myRev.find(
          (e) =>
            (e.tmdb_id === detailId || e.movie_id === detailId) &&
            e.media_type === "tv",
        );
        setMyReviewId(myRev_?.id ?? null);
        setUserRating(Number(myRev_?.rating || 0));
        setReviewText(String(myRev_?.content || ""));

        const withUsers = await Promise.all(
          rawRev.slice(0, 20).map(async (r) => {
            try {
              const u = await fetchUserById(r.user_id);
              return { ...r, username: u.username || `user-${r.user_id}` };
            } catch {
              return { ...r, username: `user-${r.user_id}` };
            }
          }),
        );
        if (alive) setReviews(withUsers);
      } catch {
        if (alive) {
          setIsAuthenticated(false);
          setViewer(null);
        }
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [detailId]);

  const runProtected = async (action: () => Promise<void>) => {
    const token = getStoredAccessToken();
    if (!token) {
      setActionMessage("Inicia sesión para usar esta acción.");
      return;
    }
    try {
      setSavingAction(true);
      setActionMessage(null);
      await action();
    } catch (e) {
      setActionMessage((e as Error).message || "Error");
    } finally {
      setSavingAction(false);
    }
  };

  const handleVault = () => {
    if (!detailId) return;
    runProtected(async () => {
      const token = getStoredAccessToken()!;
      if (inDiary && diaryEntryId) {
        await removeFromDiary(token, diaryEntryId);
        await removeFromFavorites(token, detailId, "tv");
        setInDiary(false);
        setDiaryEntryId(null);
        setIsFavorite(false);
        setActionMessage("Quitada del Vault");
      } else {
        await addToDiary(token, detailId, undefined, "tv");
        await addToFavorites(token, detailId, "tv");
        setInDiary(true);
        setIsFavorite(true);
        setActionMessage("Añadida al Vault");
      }
    });
  };

  const handleWatchlist = () => {
    if (!detailId) return;
    runProtected(async () => {
      const token = getStoredAccessToken()!;
      if (inWatchlist) {
        await removeFromWatchlist(token, detailId, "tv");
        setInWatchlist(false);
        setActionMessage("Quitada de watchlist");
      } else {
        await addToWatchlist(token, detailId, "tv");
        setInWatchlist(true);
        setActionMessage("Añadida a watchlist");
      }
    });
  };

  const handleSaveReview = () => {
    if (!detailId) return;
    runProtected(async () => {
      const token = getStoredAccessToken()!;
      if (!userRating || userRating < 1) {
        setActionMessage("Selecciona una puntuación.");
        return;
      }
      if (myReviewId) {
        const u = await updateReview(token, myReviewId, userRating, "tv");
        setMyReviewId(u.id);
        setActionMessage("Reseña actualizada");
      } else {
        const c = await createReview(token, {
          movie_id: detailId,
          media_type: "tv",
          mode: "RAPIDO",
          rating: userRating,
          content: reviewText.trim() || "Reseña desde TVDetail",
        });
        setMyReviewId(c.id);
        setActionMessage("Reseña publicada");
      }
    });
  };

  const handleWriteReview = () => {
    if (!detailId) return;
    const ownReview = reviews.find(
      (review) => viewer && review.user_id === viewer.id,
    );
    setReviewLogForm(mapReviewToForm(ownReview || null));
    setEditingReviewId(ownReview?.id ?? myReviewId ?? null);
    setReviewLogOpen(true);
  };

  const handleEditReview = (review: AppReview) => {
    if (!viewer || review.user_id !== viewer.id) return;
    setReviewLogForm(mapReviewToForm(review));
    setEditingReviewId(review.id);
    setReviewLogOpen(true);
  };

  const handleDeleteReview = () => {
    const review = reviews.find((entry) => entry.id === myReviewId);
    if (!review) return;

    runProtected(async () => {
      const token = getStoredAccessToken()!;
      await deleteReview(token, review.id);
      setMyReviewId(null);
      setUserRating(0);
      setReviewText("");
      if (detailId) {
        await refreshReviews(detailId);
      }
      setActionMessage("Reseña eliminada");
    });
  };

  const handleSaveReviewLog = async () => {
    if (!detailId) return;
    const token = getStoredAccessToken();
    if (!token) {
      setActionMessage("Inicia sesión para usar esta acción.");
      return;
    }

    setReviewLogSaving(true);
    setActionMessage(null);

    try {
      const payload = {
        mode: reviewLogForm.mode,
        content: reviewLogForm.text.trim() || undefined,
        rating: reviewLogForm.rating > 0 ? reviewLogForm.rating : undefined,
        veredicto: reviewLogForm.veredicto.trim() || undefined,
        rating_direccion: reviewLogForm.dimensions.direccion || undefined,
        rating_guion: reviewLogForm.dimensions.guion || undefined,
        rating_fotografia: reviewLogForm.dimensions.fotografia || undefined,
        rating_actuaciones: reviewLogForm.dimensions.actuaciones || undefined,
        rating_banda_sonora: reviewLogForm.dimensions.bandaSonora || undefined,
        cita_dialogo: reviewLogForm.citaDialogo.trim() || undefined,
        cita_personaje: reviewLogForm.citaPersonaje.trim() || undefined,
        timestamps: reviewLogForm.timestamps.filter(
          (t) => t.minuto && t.descripcion,
        ),
        contiene_spoilers: reviewLogForm.contieneSpoilers,
        media_type: "tv" as const,
      };

      if (editingReviewId) {
        await updateReviewContent(token, editingReviewId, payload);
      } else {
        const created = await createReview(token, {
          movie_id: detailId,
          ...payload,
        });
        setMyReviewId(created.id);
      }

      await addToDiary(token, detailId, reviewLogForm.seenDate, "tv").catch(
        () => {},
      );
      setInDiary(true);
      setUserRating(reviewLogForm.rating);
      setReviewText(reviewLogForm.text);
      setReviewLogOpen(false);
      setActionMessage("Reseña actualizada");
      await refreshReviews(detailId);
    } catch (e) {
      setActionMessage((e as Error).message || "Error");
    } finally {
      setReviewLogSaving(false);
    }
  };

  return {
    userRating,
    setUserRating,
    reviewText,
    setReviewText,
    savingAction,
    actionMessage,
    isFavorite,
    inWatchlist,
    inDiary,
    diaryEntryId,
    reviews,
    myReviewId,
    isAuthenticated,
    viewer,
    reviewLogOpen,
    setReviewLogOpen,
    reviewLogForm,
    setReviewLogForm,
    reviewLogSaving,
    handleVault,
    handleWatchlist,
    handleSaveReview,
    handleWriteReview,
    handleEditReview,
    handleDeleteReview,
    handleSaveReviewLog,
  };
}
