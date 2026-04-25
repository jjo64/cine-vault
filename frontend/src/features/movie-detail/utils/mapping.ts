import type { MovieDetailApi, ReviewApi, ReviewCommentApi } from '../../../services/movieDetailServices';
import type { AppReview, PlatformEntry } from '../types';
import { createSlug } from '../../../utils/stringUtils';



export function parseMovieId(slugOrId?: string): number | null {
  if (!slugOrId) return null;
  const match = slugOrId.match(/^\d+/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

export function buildMovieCanonicalPath(movieId: number, title: string) {
  return `/movie/${movieId}-${createSlug(title)}`;
}

export function isCurrentMovieMatch(
  candidate: { movie_id?: number | null; tmdb_id?: number | null; media_type?: string | null; movie_info?: { media_type?: string | null } | null },
  detailId: number,
  routeMovieId: number | null,
  targetType?: 'movie' | 'tv'
) {
  const cType = candidate.media_type || candidate.movie_info?.media_type;
  if (targetType && cType && cType !== targetType) return false;

  if (candidate.tmdb_id && candidate.tmdb_id === detailId) return true;
  if (routeMovieId && candidate.tmdb_id && candidate.tmdb_id === routeMovieId) return true;
  if (candidate.movie_id && candidate.movie_id === detailId) return true;
  if (routeMovieId && candidate.movie_id && candidate.movie_id === routeMovieId) return true;
  return false;
}

export function getDirectorObj(movie: MovieDetailApi | null) {
  return (movie?.credits?.crew || []).find((person) => person.job === 'Director') || null;
}

export function getCrewByJob(movie: MovieDetailApi | null, jobs: string[]) {
  return (movie?.credits?.crew || []).find((person) => person.job && jobs.includes(person.job))?.name || 'Desconocido';
}

export function mapPlatforms(movie: MovieDetailApi | null): PlatformEntry[] {
  if (!movie?.watch_providers) return [];

  const region = movie.watch_providers.ES || movie.watch_providers.US || Object.values(movie.watch_providers)[0];
  if (!region) return [];

  const entries: PlatformEntry[] = [];
  const addEntries = (items: Array<{ provider_name: string }> | undefined, type: string) => {
    (items || []).forEach((provider) => {
      if (entries.some((entry) => entry.name === provider.provider_name && entry.type === type)) return;
      entries.push({
        name: provider.provider_name,
        type,
        url: `https://www.themoviedb.org/movie/${movie.id}/watch`,
      });
    });
  };

  addEntries(region.flatrate, 'Streaming incluido');
  addEntries(region.rent, 'Alquiler');
  addEntries(region.buy, 'Compra');

  return entries;
}

export function mapMovieReviews(
  reviews: ReviewApi[],
  userMeta: Record<number, { username: string; avatarUrl: string | null }>,
  commentsByReviewId: Record<number, ReviewCommentApi[]>
): AppReview[] {
  return reviews.map((review) => ({
    id: review.id,
    userId: review.user_id,
    movieId: review.movie_id,
    tmdbId: review.tmdb_id ?? null,
    mode: review.mode || 'RAPIDO',
    username: userMeta[review.user_id]?.username || `Usuario ${review.user_id}`,
    avatarUrl: userMeta[review.user_id]?.avatarUrl || null,
    content: review.content || 'Sin comentario',
    rating: review.rating || 0,
    veredicto: review.veredicto ?? null,
    dimensions: {
      direccion: review.rating_direccion ?? null,
      guion: review.rating_guion ?? null,
      fotografia: review.rating_fotografia ?? null,
      actuaciones: review.rating_actuaciones ?? null,
      bandaSonora: review.rating_banda_sonora ?? null,
    },
    quote: review.cita_dialogo
      ? {
        dialogo: review.cita_dialogo,
        personaje: review.cita_personaje ?? null,
      }
      : null,
    timestamps: Array.isArray(review.timestamps) ? review.timestamps : [],
    contieneSpoilers: Boolean(review.contiene_spoilers),
    esCriticaLarga: Boolean(review.es_critica_larga),
    tiempoLecturaMin: review.tiempo_lectura_min ?? null,
    likes: review.likes || 0,
    createdAt: review.created_at,
    comments: (commentsByReviewId[review.id] || []).map((comment) => ({
      id: comment.id,
      userId: comment.user_id,
      username: comment.users?.username || `Usuario ${comment.user_id}`,
      avatarUrl: comment.users?.avatar_url || null,
      content: comment.content,
      createdAt: comment.created_at,
    })),
  }));
}
