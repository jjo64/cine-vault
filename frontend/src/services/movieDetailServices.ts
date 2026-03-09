import { authorizedFetch } from './authServices'

const API_URL = import.meta.env.VITE_API_URL

export type MovieDetailApi = {
  id: number
  title: string
  original_title?: string
  release_date?: string
  runtime?: number | null
  overview?: string
  tagline?: string | null
  vote_average?: number
  vote_count?: number
  poster_path?: string | null
  backdrop_path?: string | null
  genres?: Array<{ id: number; name: string }>
  production_countries?: Array<{ iso_3166_1: string; name: string }>
  spoken_languages?: Array<{ english_name?: string; name?: string }>
  production_companies?: Array<{ name: string }>
  credits?: {
    cast?: Array<{ id: number; name: string; character?: string; profile_path?: string | null }>
    crew?: Array<{ id: number; name: string; job?: string; profile_path?: string | null }>
  }
  watch_providers?: Record<string, {
    flatrate?: Array<{ provider_name: string }>
    rent?: Array<{ provider_name: string }>
    buy?: Array<{ provider_name: string }>
  }>
  images?: {
    backdrops?: Array<{ file_path?: string | null }>
  }
}

export type ReviewApi = {
  id: number
  user_id: number
  movie_id: number
  tmdb_id?: number | null
  content: string | null
  rating: number | null
  likes?: number
  created_at: string
}

type RequestOptions = {
  token?: string | null
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requestInit: RequestInit = {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  }

  const response = options.token !== undefined
    ? await authorizedFetch(path, requestInit)
    : await fetch(`${API_URL}${path}`, requestInit)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed (${response.status})`)
  }

  if (response.status === 204) return {} as T
  return (await response.json()) as T
}

export const fetchMovieDetail = (idOrSlug: string) => apiRequest<MovieDetailApi>(`/api/movies/${idOrSlug}`)

export const fetchMovieReviews = (movieId: number) => apiRequest<ReviewApi[]>(`/api/reviews/movie/${movieId}`)

export const fetchPopularMovies = () => apiRequest<{ results?: Array<{ id: number; title: string; poster_path: string | null; release_date?: string }> }>(`/api/movies/popular`)

export const fetchTopRatedMovies = () => apiRequest<{ results?: Array<{ id: number; title: string; poster_path: string | null; release_date?: string }> }>(`/api/movies/top-rated`)

export const fetchSearchMovies = (query: string) =>
  apiRequest<{ results?: Array<{ id: number; title: string; poster_path: string | null }> }>(`/api/search?q=${encodeURIComponent(query)}`)

export const fetchUserById = (userId: number) =>
  apiRequest<{ id: number; username?: string; avatar_url?: string | null }>(`/api/users/${userId}`)

export const fetchMyReviews = (token: string | null) => apiRequest<ReviewApi[]>('/api/reviews', { token })

export const createReview = (token: string | null, movieId: number, rating: number, content: string) =>
  apiRequest<ReviewApi>('/api/reviews', {
    token,
    method: 'POST',
    body: { movie_id: movieId, rating, content },
  })

export const updateReview = (token: string | null, reviewId: number, rating: number) =>
  apiRequest<ReviewApi>(`/api/reviews/${reviewId}`, {
    token,
    method: 'PATCH',
    body: { rating },
  })

export const updateReviewContent = (
  token: string | null,
  reviewId: number,
  payload: { rating?: number; content?: string }
) =>
  apiRequest<ReviewApi>(`/api/reviews/${reviewId}`, {
    token,
    method: 'PATCH',
    body: payload,
  })

export const deleteReview = (token: string | null, reviewId: number) =>
  apiRequest<{ message: string }>(`/api/reviews/${reviewId}`, {
    token,
    method: 'DELETE',
  })

export const fetchMyWatchlist = (token: string | null) =>
  apiRequest<Array<{ movie_id: number; tmdb_id?: number | null }>>('/api/watchlist', { token })

export const addToWatchlist = (token: string | null, movieId: number) =>
  apiRequest<{ message: string }>('/api/watchlist', {
    token,
    method: 'POST',
    body: { movie_id: movieId },
  })

export const removeFromWatchlist = (token: string | null, movieId: number) =>
  apiRequest<{ message: string }>(`/api/watchlist/${movieId}`, {
    token,
    method: 'DELETE',
  })

export const fetchMyFavorites = async (token: string | null) => {
  try {
    return await apiRequest<Array<{ movie_id: number; tmdb_id?: number | null }>>('/api/favorites', { token })
  } catch {
    return [] as Array<{ movie_id: number; tmdb_id?: number | null }>
  }
}

export const addToFavorites = (token: string | null, movieId: number) =>
  apiRequest('/api/favorites/' + movieId, {
    token,
    method: 'POST',
    body: { movieId },
  })

export const removeFromFavorites = (token: string | null, movieId: number) =>
  apiRequest('/api/favorites/' + movieId, {
    token,
    method: 'DELETE',
  })

export const fetchMyDiary = async (token: string | null) => {
  try {
    return await apiRequest<{ diary?: Array<{ id: number; movie_id: number; tmdb_id?: number | null; watched_date?: string | null }> }>('/api/diary', { token })
  } catch {
    return { diary: [] as Array<{ id: number; movie_id: number; tmdb_id?: number | null; watched_date?: string | null }> }
  }
}

export const addToDiary = (token: string | null, movieId: number, watchedDate?: string) =>
  apiRequest('/api/diary', {
    token,
    method: 'POST',
    body: {
      movie_id: movieId,
      watched_date: watchedDate || new Date().toISOString().slice(0, 10),
    },
  })

export const removeFromDiary = (token: string | null, diaryEntryId: number) =>
  apiRequest('/api/diary/' + diaryEntryId, {
    token,
    method: 'DELETE',
  })

export const likeReview = (token: string | null, reviewId: number) =>
  apiRequest<{ review: { id: number; likes: number } }>(`/api/reviews/${reviewId}/like`, {
    token,
    method: 'POST',
  })

export const unlikeReview = (token: string | null, reviewId: number) =>
  apiRequest<{ review: { id: number; likes: number } }>(`/api/reviews/${reviewId}/like`, {
    token,
    method: 'DELETE',
  })

export const commentOnReview = (token: string | null, reviewId: number, content: string) =>
  apiRequest(`/api/reviews/${reviewId}/comments`, {
    token,
    method: 'POST',
    body: { content },
  })
