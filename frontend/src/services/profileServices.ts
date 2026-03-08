import { authorizedFetch, getCurrentUser, getStoredAccessToken } from './authServices'

const API_URL = import.meta.env.VITE_API_URL

export type ProfileUser = {
  id: number
  username: string
  avatar_url?: string | null
  bio?: string | null
  created_at?: string
  _count?: {
    reviews?: number
    diary_entries?: number
    watchlist?: number
    follows_follows_follower_idTousers?: number
    follows_follows_following_idTousers?: number
  }
}

export type RichDiaryEntry = {
  movie_id: number
  watched_date: string | null
  tmdb_id: number | null
  movie_info?: { title: string; poster_path: string | null } | null
  review?: {
    movie_id: number
    rating: number | null
    content: string | null
    created_at: string
  } | null
}

export type RichWatchlistEntry = {
  movie_id: number
  tmdb_id: number | null
  movie_info?: { title: string; poster_path: string | null } | null
  rank_position?: number | null
  added_at?: string | null
}

export type ReviewEntry = {
  id: number
  user_id: number
  movie_id: number
  tmdb_id?: number | null
  content: string | null
  rating: number | null
  likes?: number
  created_at: string
  movies_ref?: {
    tmdb_id?: number | null
  } | null
}

export type FavoriteEntry = { movie_id: number; rank_position: number | null }

export type FollowUserEntry = {
  id: number
  username: string
  avatar_url?: string | null
}

type FetchOptions<T> = {
  token?: string | null
  method?: string
  body?: unknown
  defaultValue: T
}

const buildHeaders = (token?: string | null) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

async function apiFetch<T>(path: string, options: FetchOptions<T>): Promise<T> {
  const requestInit: RequestInit = {
    method: options.method ?? 'GET',
    headers: buildHeaders(options.token),
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  }

  const response = options.token
    ? await authorizedFetch(path, requestInit)
    : await fetch(`${API_URL}${path}`, requestInit)

  if (!response.ok) {
    if (response.status === 404) return options.defaultValue
    if (response.status === 401 || response.status === 403)
      return options.defaultValue

    const message = await response.text()
    throw new Error(message || `Error ${response.status}`)
  }

  // Algunas respuestas de borrado no devuelven JSON
  if (response.status === 204) return options.defaultValue

  return (await response.json()) as T
}

export async function resolveViewerId(): Promise<{ userId: number | null; username: string | null; token: string | null }> {
  const token = getStoredAccessToken()
  if (!token) return { userId: null, username: null, token: null }

  try {
    const user = await getCurrentUser()
    return { userId: user.id, username: user.username, token }
  } catch {
    return { userId: null, username: null, token: null }
  }
}

export const fetchUserProfile = (userId: number, token?: string | null) =>
  apiFetch<ProfileUser>(`/api/users/${userId}`, {
    token,
    defaultValue: { id: userId, username: 'Invitado' },
  })

export const fetchUserProfileByUsername = (username: string, token?: string | null) =>
  apiFetch<ProfileUser | null>(`/api/users/username/${encodeURIComponent(username)}`, {
    token,
    defaultValue: null,
  })

export const fetchDiary = (userId: number, token?: string | null, isSelf?: boolean) => {
  const path = isSelf ? '/api/diary' : `/api/diary/${userId}`
  return apiFetch<{ diary: RichDiaryEntry[] | null }>(path, {
    token: isSelf ? token : undefined,
    defaultValue: { diary: null },
  })
}

export const fetchWatchlist = (userId: number, token?: string | null, isSelf?: boolean) =>
  apiFetch<RichWatchlistEntry[]>(isSelf ? '/api/watchlist' : `/api/watchlist/${userId}`, {
    token: isSelf ? token : undefined,
    defaultValue: [],
  })

export const fetchFavorites = (userId: number, token?: string | null, isSelf?: boolean) =>
  apiFetch<FavoriteEntry[]>(isSelf ? '/api/favorites' : `/api/favorites/user/${userId}`, {
    token: isSelf ? token : undefined,
    defaultValue: [],
  })

export const fetchReviews = (userId: number, token?: string | null, isSelf?: boolean) =>
  apiFetch<ReviewEntry[]>(isSelf ? '/api/reviews' : `/api/reviews/user/${userId}`, {
    token: isSelf ? token : undefined,
    defaultValue: [],
  })

export const fetchFollowers = (userId: number) =>
  apiFetch<FollowUserEntry[]>(`/api/users/${userId}/followers`, {
    defaultValue: [],
  })

export const fetchFollowing = (userId: number) =>
  apiFetch<FollowUserEntry[]>(`/api/users/${userId}/following`, {
    defaultValue: [],
  })
