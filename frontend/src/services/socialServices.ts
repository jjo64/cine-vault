import { authorizedFetch, getStoredAccessToken } from './authServices'

const API_URL = String(import.meta.env.VITE_API_URL || 'https://cine-vault-ncuh.onrender.com').trim().replace(/\/+$/, '')

type FetchOptions = {
  token?: string | null
}

async function requestJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const response = await (options.token !== undefined
    ? authorizedFetch(path, { method: 'GET' })
    : fetch(`${API_URL}${path}`, { method: 'GET', credentials: 'include' }))

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Error ${response.status}`)
  }

  return (await response.json()) as T
}

export type ActivityItem = {
  id: string
  type: 'review_published' | 'diary_entry' | 'vault_added' | 'watchlist_added' | 'review_liked' | 'follow'
  created_at: string
  user: {
    id: number
    username: string
    avatar_url: string | null
  }
  movie?: {
    id: number
    tmdb_id: number
  }
  review?: {
    id: number
    content: string | null
    rating: number | null
  }
  target_user?: {
    id: number
    username: string
    avatar_url: string | null
  }
}

export type ActivityResponse = {
  page: number
  limit: number
  total: number
  has_more: boolean
  items: ActivityItem[]
}

export type ForYouMovieItem = {
  id: string
  type: 'media'
  media: {
    id: number
    title: string
    year: number | null
    poster_path: string | null
    vote_average: number
    reason: string
    media_type: "movie" | "tv"
  }
}

export type ForYouReviewItem = {
  id: string
  type: 'review'
  review: {
    id: number
    content: string | null
    rating: number | null
    mode: string
    created_at: string
  }
  user: {
    id: number
    username: string
    avatar_url: string | null
  }
  media: {
    id: number
    tmdb_id: number
  }
}

export type ForYouItem = ForYouMovieItem | ForYouReviewItem

export type ForYouResponse = {
  page: number
  limit: number
  total: number
  has_more: boolean
  items: ForYouItem[]
}

export const fetchActivityFeed = async (type: 'friends' | 'own', page = 1, limit = 20) => {
  const token = getStoredAccessToken()
  return requestJson<ActivityResponse>(`/api/activity/feed?type=${type}&page=${page}&limit=${limit}`, { token })
}

export const fetchForYouFeed = async (page = 1) => {
  const token = getStoredAccessToken()
  return requestJson<ForYouResponse>(`/api/recommendations/for-you?page=${page}`, { token })
}

export const fetchGlobalFeed = async (page = 1, limit = 10) => {
  const token = getStoredAccessToken()
  return requestJson(`/api/feed?page=${page}&limit=${limit}`, { token })
}

export type SuggestedDirector = {
  id: number
  name: string
  profile_path: string | null
  score: number
  reason: string
  source: string
  movie_tmdb_ids: number[]
}

export const fetchSuggestedDirectors = async (): Promise<{ items: SuggestedDirector[] }> => {
  const token = getStoredAccessToken()
  return requestJson<{ items: SuggestedDirector[] }>(`/api/recommendations/directors`, { token })
}

export type TonightResponse = {
  id: string
  type: 'tonight'
  media: {
    id: number
    title: string
    year: number | null
    poster_path: string | null
    vote_average: number | null
    media_type: 'movie'
    reason: string
    weather_context: string
  }
}

export const fetchTonightMovie = async (hour?: number, weather?: string) => {
  const token = getStoredAccessToken()
  let params = new URLSearchParams()
  if (hour) params.append('hour', hour.toString())
  if (weather) params.append('weather', weather)
  return requestJson<TonightResponse>(`/api/recommendations/tonight?${params.toString()}`, { token })
}

/**
 * Onboarding
 */

export type OnboardingMovie = {
  step: number
  movie: {
    id: number
    title: string
    poster_path: string | null
    year: number | null
    overview: string
  }
}

export const fetchOnboardingStatus = async (): Promise<{ needs_onboarding: boolean }> => {
  const token = getStoredAccessToken()
  return requestJson<{ needs_onboarding: boolean }>(`/api/recommendations/onboarding/status`, { token })
}

export const fetchOnboardingMovie = async (step: number, seedId?: number): Promise<OnboardingMovie> => {
  const token = getStoredAccessToken()
  let url = `/api/recommendations/onboarding?step=${step}`
  if (seedId) url += `&seedId=${seedId}`
  return requestJson<OnboardingMovie>(url, { token })
}

export const sendOnboardingInteraction = async (movieId: number, type: string, metadata: any = {}) => {
  const response = await authorizedFetch(`/api/recommendations/interact`, {
    method: 'POST',
    body: JSON.stringify({ movieId, type, metadata })
  })
  if (!response.ok) throw new Error("No se pudo guardar la interacción")
  return await response.json()
}

