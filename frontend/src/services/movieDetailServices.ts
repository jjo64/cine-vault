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

  const response = options.token
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

export const fetchMyReviews = (token: string) => apiRequest<ReviewApi[]>('/api/reviews', { token })

export const createReview = (token: string, movieId: number, rating: number, content: string) =>
  apiRequest<ReviewApi>('/api/reviews', {
    token,
    method: 'POST',
    body: { movie_id: movieId, rating, content },
  })

export const updateReview = (token: string, reviewId: number, rating: number) =>
  apiRequest<ReviewApi>(`/api/reviews/${reviewId}`, {
    token,
    method: 'PATCH',
    body: { rating },
  })

export const fetchMyWatchlist = (token: string) =>
  apiRequest<Array<{ movie_id: number }>>('/api/watchlist', { token })

export const addToWatchlist = (token: string, movieId: number) =>
  apiRequest<{ message: string }>('/api/watchlist', {
    token,
    method: 'POST',
    body: { movie_id: movieId },
  })

export const removeFromWatchlist = (token: string, movieId: number) =>
  apiRequest<{ message: string }>(`/api/watchlist/${movieId}`, {
    token,
    method: 'DELETE',
    // El backend actual toma movie_id desde body.
    body: { movie_id: movieId },
  })

export const fetchMyFavorites = async (token: string) => {
  try {
    return await apiRequest<Array<{ movie_id: number }>>('/api/favorites', { token })
  } catch {
    return [] as Array<{ movie_id: number }>
  }
}

export const addToFavorites = (token: string, movieId: number) =>
  apiRequest('/api/favorites/' + movieId, {
    token,
    method: 'POST',
    body: { movieId },
  })

export const removeFromFavorites = (token: string, movieId: number) =>
  apiRequest('/api/favorites/' + movieId, {
    token,
    method: 'DELETE',
  })

export const fetchMyDiary = async (token: string) => {
  try {
    return await apiRequest<{ diary?: Array<{ movie_id: number }> }>('/api/diary', { token })
  } catch {
    return { diary: [] as Array<{ movie_id: number }> }
  }
}

export const addToDiary = (token: string, movieId: number) =>
  apiRequest('/api/diary', {
    token,
    method: 'POST',
    body: {
      movie_id: movieId,
      watched_date: new Date().toISOString().slice(0, 10),
    },
  })

export const likeReview = (token: string, reviewId: number) =>
  apiRequest<{ review: { id: number; likes: number } }>(`/api/reviews/${reviewId}/like`, {
    token,
    method: 'POST',
  })

export const unlikeReview = (token: string, reviewId: number) =>
  apiRequest<{ review: { id: number; likes: number } }>(`/api/reviews/${reviewId}/like`, {
    token,
    method: 'DELETE',
  })

export const commentOnReview = (token: string, reviewId: number, content: string) =>
  apiRequest(`/api/reviews/${reviewId}/comments`, {
    token,
    method: 'POST',
    body: { content },
  })
