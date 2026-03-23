import { authorizedFetch, getStoredAccessToken } from './authServices'

const API_URL = String(import.meta.env.VITE_API_URL || 'https://api.cinevault.art').trim().replace(/\/+$/, '')

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
  type: 'movie'
  movie: {
    id: number
    title: string
    year: number | null
    poster_path: string | null
    vote_average: number
    reason: string
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
  movie: {
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
