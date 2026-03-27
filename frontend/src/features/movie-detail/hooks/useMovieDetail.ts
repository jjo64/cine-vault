import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addToDiary,
  removeFromDiary,
  deleteReview,
  addToFavorites,
  addToWatchlist,
  commentOnReview,
  createReview,
  updateReviewContent,
  fetchMovieDetail,
  fetchMovieReviews,
  fetchReviewComments,
  fetchMyDiary,
  fetchMyFavorites,
  fetchMyReviews,
  type MovieDetailApi,
  fetchMyWatchlist,
  fetchTopRatedMovies,
  fetchUserById,
  likeReview,
  removeFromFavorites,
  removeFromWatchlist,
  type ReviewMode,
  unlikeReview,
  updateReview,
} from '../../../services/movieDetailServices';
import {
  addMovieToList,
  createList,
  getMyLists,
  type UserListSummary,
} from '../../../services/listsServices';
import { getCurrentUser, getStoredAccessToken } from '../../../services/authServices';
import type { AppReview, Viewer, SimilarFilm } from '../types';
import { 
  parseMovieId, 
  isCurrentMovieMatch, 
  mapMovieReviews 
} from '../utils/mapping';
import { TMDB_BASE, SIZES } from '../constants';

export function useMovieDetail() {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<MovieDetailApi | null>(null);
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<'success' | 'error' | 'info'>('info');

  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [myReviewId, setMyReviewId] = useState<number | null>(null);
  const [inVault, setInVault] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [liked, setLiked] = useState(false);
  
  const [similar, setSimilar] = useState<SimilarFilm[]>([]);
  const [likedReviewIds, setLikedReviewIds] = useState<Set<number>>(new Set());
  const [userLists, setUserLists] = useState<UserListSummary[]>([]);

  // Modals state
  const [reviewLogOpen, setReviewLogOpen] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);

  // Composer state
  const [composerMode, setComposerMode] = useState<'review' | 'reply' | null>(null);
  const [composerText, setComposerText] = useState('');
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  // Review log form state
  const [reviewLogForm, setReviewLogForm] = useState({
    text: '',
    rating: 0,
    mode: 'RAPIDO' as ReviewMode,
    veredicto: '',
    contieneSpoilers: false,
    citaDialogo: '',
    citaPersonaje: '',
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

  const [reviewLogSaving, setReviewLogSaving] = useState(false);

  // Add to list modal state
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [addToListLoading, setAddToListLoading] = useState(false);
  const [addToListSaving, setAddToListSaving] = useState(false);
  const [addToListCreating, setAddToListCreating] = useState(false);

  const movieId = useMemo(() => parseMovieId(slugOrId), [slugOrId]);
  const token = getStoredAccessToken();

  useEffect(() => {
    if (!slugOrId) {
      setError('Película no encontrada');
      setLoading(false);
      return;
    }

    let alive = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const detail = await fetchMovieDetail(slugOrId);
        if (!alive) return;
        setMovie(detail);
        setLoading(false);

        // Secondary data
        const loadSecondary = async () => {
          const [movieReviews, topRated] = await Promise.all([
            fetchMovieReviews(detail.id).catch(() => []),
            fetchTopRatedMovies().catch(() => ({ results: [] })),
          ]);

          if (!alive) return;

          const topRatedList = Array.isArray(topRated.results) ? topRated.results.slice(0, 6) : [];
          setSimilar(
            topRatedList
              .filter((item: any) => item.id !== detail.id)
              .map((item: any) => ({
                id: item.id,
                title: item.title,
                year: item.release_date ? new Date(item.release_date).getFullYear() : 0,
                img: item.poster_path ? `${TMDB_BASE}${SIZES.POSTER}${item.poster_path}` : '',
              }))
          );

          // Full reviews data
          const uniqueUserIds = [...new Set(movieReviews.map((r) => r.user_id))];
          const [userPairs, commentsPairs] = await Promise.all([
            Promise.all(uniqueUserIds.map(async (id) => {
              try {
                const user = await fetchUserById(id);
                return [id, { username: user.username ?? `Usuario ${id}`, avatarUrl: user.avatar_url ?? null }] as const;
              } catch {
                return [id, { username: `Usuario ${id}`, avatarUrl: null }] as const;
              }
            })),
            Promise.all(movieReviews.map(async (review) => {
              try {
                const c = await fetchReviewComments(review.id);
                return [review.id, Array.isArray(c) ? c : []] as const;
              } catch {
                return [review.id, []] as const;
              }
            }))
          ]);

          if (!alive) return;
          const userMeta = Object.fromEntries(userPairs);
          const commentsByReviewId = Object.fromEntries(commentsPairs);
          setReviews(mapMovieReviews(movieReviews, userMeta, commentsByReviewId));
        };

        const loadUserStatus = async () => {
          if (!token) return;
          const user = await getCurrentUser();
          setViewer({ id: user.id, username: user.username, avatar_url: user.avatar_url, membership: user.membership || null, role: user.role || null });

          const [myReviews, myWatchlist, myFavorites, myDiary] = await Promise.all([
            fetchMyReviews(token).catch(() => []),
            fetchMyWatchlist(token).catch(() => []),
            fetchMyFavorites(token).catch(() => []),
            fetchMyDiary(token).catch(() => ({ diary: [] })),
          ]);

          if (!alive) return;

          const myReview = myReviews.find((r: any) => isCurrentMovieMatch(r, detail.id, movieId));
          setMyReviewId(myReview?.id ?? null);
          setUserRating(Number(myReview?.rating ?? 0));
          setInWatchlist(myWatchlist.some((e: any) => isCurrentMovieMatch(e, detail.id, movieId)));
          setLiked(myFavorites.some((e: any) => isCurrentMovieMatch(e, detail.id, movieId)));
          setInVault((myDiary.diary || []).some((e: any) => isCurrentMovieMatch(e, detail.id, movieId)));
        };

        loadSecondary();
        loadUserStatus();

      } catch (err) {
        if (alive) {
          setError((err as Error).message || 'Error al cargar la película');
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { alive = false; };
  }, [slugOrId, token, movieId]);

  const showNotice = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotice(message);
    setNoticeType(type);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setViewer(null);
    showNotice('Sesión cerrada', 'success');
    navigate('/');
  };

  const requireAuth = () => {
    if (token) return true;
    window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }));
    showNotice('Tienes que loguearte para usar esta opción', 'info');
    return false;
  };

  const handleRate = async (value: number) => {
    if (!movie || !token) { requireAuth(); return; }
    try {
      if (myReviewId) {
        await updateReview(token, myReviewId, value);
      } else {
        const created = await createReview(token, { movie_id: movie.id, mode: 'RAPIDO', rating: value, content: 'Rating rapido' });
        setMyReviewId(created.id);
      }
      setUserRating(value);
      showNotice('Rating guardado', 'success');
    } catch (err) {
      showNotice('No se pudo guardar el rating', 'error');
    }
  };

  const handleToggleVault = async () => {
    if (!movie || !token) { requireAuth(); return; }
    try {
      if (inVault) {
        const diary = await fetchMyDiary(token);
        const entry = (diary.diary || []).find((e: any) => isCurrentMovieMatch(e, movie.id, movieId));
        if (entry) await removeFromDiary(token, entry.id);
        setInVault(false);
        showNotice('Eliminada de tu Vault', 'info');
      } else {
        await addToDiary(token, movie.id);
        setInVault(true);
        showNotice('Añadida a tu Vault', 'success');
      }
    } catch (err) {
      showNotice('Error al actualizar Vault', 'error');
    }
  };

  const handleToggleWatchlist = async () => {
    if (!movie || !token) { requireAuth(); return; }
    try {
      if (inWatchlist) {
        await removeFromWatchlist(token, movie.id);
        setInWatchlist(false);
        showNotice('Eliminada de Watchlist', 'info');
      } else {
        await addToWatchlist(token, movie.id);
        setInWatchlist(true);
        showNotice('Añadida a Watchlist', 'success');
      }
    } catch (err) {
      showNotice('Error al actualizar Watchlist', 'error');
    }
  };

  const handleToggleFavorite = async () => {
    if (!movie || !token) { requireAuth(); return; }
    try {
      if (liked) {
        await removeFromFavorites(token, movie.id);
        setLiked(false);
        showNotice('Quitada de favoritos', 'info');
      } else {
        await addToFavorites(token, movie.id);
        setLiked(true);
        showNotice('Añadida a favoritos', 'success');
      }
    } catch (err) {
      showNotice('Error al actualizar favoritos', 'error');
    }
  };

  const handleAddToList = async () => {
    if (!movie || !token) { requireAuth(); return; }
    setAddToListOpen(true);
    setAddToListLoading(true);
    try {
      const lists = await getMyLists();
      setUserLists(lists);
      if (lists.length > 0) setSelectedListId(lists[0].id);
    } catch (err) {
      showNotice('Error al cargar listas', 'error');
    } finally {
      setAddToListLoading(false);
    }
  };

  const handleConfirmAddToList = async () => {
    if (!movie || selectedListId === null) return;
    setAddToListSaving(true);
    try {
      await addMovieToList(selectedListId, movie.id);
      setAddToListOpen(false);
      showNotice('Añadida a la lista', 'success');
    } catch (err) {
      showNotice('Error al añadir a lista', 'error');
    } finally {
      setAddToListSaving(false);
    }
  };

  const handleCreateListFromModal = async () => {
    if (!newListName.trim()) return;
    setAddToListCreating(true);
    try {
      const created = await createList({ name: newListName.trim(), description: newListDescription.trim() || null });
      setUserLists(prev => [created, ...prev]);
      setSelectedListId(created.id);
      setNewListName('');
      setNewListDescription('');
      showNotice('Lista creada', 'success');
    } catch (err) {
      showNotice('Error al crear lista', 'error');
    } finally {
      setAddToListCreating(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showNotice('Enlace copiado', 'success');
    } catch {
      showNotice('Error al copiar enlace', 'error');
    }
  };

  const handleWriteReview = () => {
    if (!movie || !token) { requireAuth(); return; }
    const ownReview = reviews.find(r => r.userId === viewer?.id);
    setReviewLogForm({
      text: ownReview?.content || '',
      rating: ownReview?.rating || userRating || 0,
      mode: ownReview?.mode || 'RAPIDO',
      veredicto: ownReview?.veredicto || '',
      contieneSpoilers: !!ownReview?.contieneSpoilers,
      citaDialogo: ownReview?.quote?.dialogo || '',
      citaPersonaje: ownReview?.quote?.personaje || '',
      timestamps: ownReview?.timestamps || [],
      dimensions: ownReview?.dimensions || { direccion: null, guion: null, fotografia: null, actuaciones: null, bandaSonora: null },
      liked: liked,
      seenDate: new Date().toISOString().slice(0, 10),
      seenBefore: false,
    });
    setEditingReviewId(ownReview?.id || null);
    setReviewLogOpen(true);
  };

  const handleSaveReviewLog = async () => {
    if (!token || !movie) return;
    setReviewLogSaving(true);
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
        timestamps: reviewLogForm.timestamps.filter(t => t.minuto && t.descripcion),
        contiene_spoilers: reviewLogForm.contieneSpoilers,
      };

      if (editingReviewId) {
        await updateReviewContent(token, editingReviewId, payload);
      } else {
        const created = await createReview(token, { movie_id: movie.id, ...payload });
        setMyReviewId(created.id);
      }
      
      await addToDiary(token, movie.id, reviewLogForm.seenDate).catch(() => {});
      setInVault(true);
      setReviewLogOpen(false);
      showNotice('Review y log guardados', 'success');
      
      // Refresh reviews
      await fetchMovieReviews(movie.id);
      // Mapping would be repeated here, simplified for now
    } catch (err) {
      showNotice('Error al guardar log', 'error');
    } finally {
      setReviewLogSaving(false);
    }
  };

  const handleToggleReviewLike = async (reviewId: number, alreadyLiked: boolean) => {
    if (!token) { requireAuth(); return; }
    try {
      if (alreadyLiked) {
        await unlikeReview(token, reviewId);
        setLikedReviewIds(prev => { const n = new Set(prev); n.delete(reviewId); return n; });
      } else {
        await likeReview(token, reviewId);
        setLikedReviewIds(prev => new Set(prev).add(reviewId));
      }
    } catch (err) {
      showNotice('Error al actualizar like', 'error');
    }
  };

  const handleSubmitComposer = async () => {
    if (!token || !movie) return;
    const text = composerText.trim();
    if (!text) return;

    if (composerMode === 'reply' && replyTargetId) {
       await commentOnReview(token, replyTargetId, text);
       showNotice('Comentario enviado', 'success');
    } else {
       await createReview(token, { movie_id: movie.id, mode: 'ESTANDAR', content: text, rating: userRating || 4 });
       showNotice('Reseña publicada', 'success');
    }
    setComposerMode(null);
    setComposerText('');
  };

  return {
    movie,
    reviews,
    loading,
    error,
    notice,
    noticeType,
    viewer,
    userRating,
    inVault,
    inWatchlist,
    liked,
    similar,
    likedReviewIds,
    userLists,
    reviewLogOpen,
    addToListOpen,
    composerMode,
    composerText,
    reviewLogForm,
    reviewLogSaving,
    selectedListId,
    newListName,
    newListDescription,
    addToListLoading,
    addToListSaving,
    addToListCreating,
    setNotice,
    setReviewLogOpen,
    setAddToListOpen,
    setComposerMode,
    setComposerText,
    setReviewLogForm,
    setSelectedListId,
    setNewListName,
    setNewListDescription,
    handleLogout,
    handleRate,
    handleToggleVault,
    handleToggleWatchlist,
    handleToggleFavorite,
    handleAddToList,
    handleConfirmAddToList,
    handleCreateListFromModal,
    handleShare,
    handleWriteReview,
    handleSaveReviewLog,
    handleToggleReviewLike,
    handleSubmitComposer,
    handleEditReview: (r: AppReview) => { setEditingReviewId(r.id); setComposerText(r.content || ''); setComposerMode('review'); },
    handleDeleteReview: async (r: AppReview) => { if (token) { await deleteReview(token, r.id); setReviews(prev => prev.filter(i => i.id !== r.id)); showNotice('Reseña eliminada', 'success'); } },
    handleReplyReview: (id: number) => { setReplyTargetId(id); setComposerText(''); setComposerMode('reply'); },
  };
}
