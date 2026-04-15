import { authorizedFetch, getCurrentUser, getStoredAccessToken } from './authServices'

const API_URL = import.meta.env.VITE_API_URL

export type ProfileUser = {
  id: number
  username: string
  avatar_url?: string | null
  bio?: string | null
  created_at?: string
  is_following?: boolean
  _count?: {
    reviews?: number
    diary_entries?: number
    watchlist?: number
    follows_follows_follower_idTousers?: number
    follows_follows_following_idTousers?: number
  }
}

export type RichDiaryEntry = {
  id: number
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

export type VaultSocialEntry = {
  id: number
  user_id: number
  movie_id: number | null
  tmdb_id: number | null
  entry_type: 'reflexion' | 'edit' | 'critica' | 'recomendacion'
  card_type: 'review' | 'video' | 'list'
  title: string
  content: string
  cover_url: string | null
  duration_label: string | null
  likes_count: number
  comments_count: number
  is_public: boolean
  created_at: string
  updated_at: string
  movie_info?: {
    title?: string | null
    poster_path?: string | null
  } | null
}

export type VaultSocialResponse = {
  page: number
  limit: number
  total: number
  has_more: boolean
  items: VaultSocialEntry[]
}

export type FavoriteEntry = { movie_id: number; rank_position: number | null }

export type FollowUserEntry = {
  id: number
  username: string
  avatar_url?: string | null
}

export type SessionEntry = {
  id: string
  user_agent?: string | null
  ip_address?: string | null
  created_at: string
  expires_at: string
}

export type CinematicSignatureData = {
  user_id: number
  pivotal_film: string | null
  pivotal_film_detail: string | null
  formative_director: string | null
  formative_director_detail: string | null
  unforgettable_scene: string | null
  unforgettable_scene_detail: string | null
  cinema_turning_year: string | null
  cinema_turning_year_detail: string | null
}

export type CuratedGalleryItemData = {
  movie_id: number
  order_index: number
  note: string | null
  tmdb_id: number | null
}

type SettingsWrappedResponse<T> = {
  ok: boolean
  message?: string
  data: T
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

  const response = options.token !== undefined
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

export const fetchVaultSocial = (
  userId: number,
  token?: string | null,
  isSelf?: boolean,
  page = 1,
  limit = 24,
) =>
  apiFetch<VaultSocialResponse>(
    isSelf
      ? `/api/vault/social/mine?page=${page}&limit=${limit}`
      : `/api/vault/social/user/${userId}?page=${page}&limit=${limit}`,
    {
      token: isSelf ? token : undefined,
      defaultValue: { page, limit, total: 0, has_more: false, items: [] },
    }
  )

export const fetchFollowers = (userId: number) =>
  apiFetch<FollowUserEntry[]>(`/api/users/${userId}/followers`, {
    defaultValue: [],
  })

export const fetchFollowing = (userId: number) =>
  apiFetch<FollowUserEntry[]>(`/api/users/${userId}/following`, {
    defaultValue: [],
  })

export const followUser = async (targetUserId: number, token?: string | null) =>
  apiFetch<{ message: string }>(`/api/users/follow/${targetUserId}`, {
    token,
    method: 'POST',
    defaultValue: { message: '' },
  })

export const unfollowUser = async (targetUserId: number, token?: string | null) =>
  apiFetch<{ message: string }>(`/api/users/unfollow/${targetUserId}`, {
    token,
    method: 'DELETE',
    defaultValue: { message: '' },
  })

export const checkUsernameAvailability = async (username: string) => {
  const candidate = username.trim()
  if (!candidate) return { available: false }

  const response = await fetch(`${API_URL}/api/users/username/${encodeURIComponent(candidate)}`)
  if (response.status === 404) return { available: true }
  if (!response.ok) throw new Error('No se pudo validar username')
  return { available: false }
}

export const updateProfileSettings = (token: string | null | undefined, body: { username?: string; email?: string; bio?: string }) =>
  apiFetch<{ message: string }>('/api/settings', {
    token,
    method: 'PATCH',
    body,
    defaultValue: { message: '' },
  })

export const updateAvatarSettings = (token: string | null | undefined, avatar: string) =>
  apiFetch<{ message: string; avatar_url?: string }>('/api/settings/avatar', {
    token,
    method: 'PATCH',
    body: { avatar },
    defaultValue: { message: '' },
  })

export const updateAuthSettings = (
  token: string | null | undefined,
  body: { password_actual: string; password_nueva: string; password_confirmacion: string }
) =>
  apiFetch<{ message: string }>('/api/settings/auth', {
    token,
    method: 'PATCH',
    body,
    defaultValue: { message: '' },
  })

export const deleteAccountSettings = (token: string | null | undefined) =>
  apiFetch<{ message: string }>('/api/settings', {
    token,
    method: 'DELETE',
    defaultValue: { message: '' },
  })

export const fetchAuthSessions = (token: string | null | undefined) =>
  apiFetch<{ sessions: SessionEntry[] }>('/api/auth/sessions', {
    token,
    defaultValue: { sessions: [] },
  })

export const revokeAuthSession = (token: string | null | undefined, sessionId: string) =>
  apiFetch<{ message: string }>(`/api/auth/sessions/${sessionId}`, {
    token,
    method: 'DELETE',
    defaultValue: { message: '' },
  })

export const revokeAllAuthSessions = (token: string | null | undefined) =>
  apiFetch<{ message: string }>('/api/auth/revocar-sesiones', {
    token,
    method: 'POST',
    defaultValue: { message: '' },
  })

export const fetchOwnerCinematicSignature = (token: string | null | undefined) =>
  apiFetch<SettingsWrappedResponse<CinematicSignatureData>>('/api/settings/profile/signature', {
    token,
    defaultValue: {
      ok: true,
      data: {
        user_id: 0,
        pivotal_film: null,
        pivotal_film_detail: null,
        formative_director: null,
        formative_director_detail: null,
        unforgettable_scene: null,
        unforgettable_scene_detail: null,
        cinema_turning_year: null,
        cinema_turning_year_detail: null,
      },
    },
  })

export const fetchPublicCinematicSignature = (userId: number) =>
  apiFetch<CinematicSignatureData>(`/api/users/${userId}/profile/signature`, {
    defaultValue: {
      user_id: userId,
      pivotal_film: null,
      pivotal_film_detail: null,
      formative_director: null,
      formative_director_detail: null,
      unforgettable_scene: null,
      unforgettable_scene_detail: null,
      cinema_turning_year: null,
      cinema_turning_year_detail: null,
    },
  })

export const updateOwnerCinematicSignature = (
  token: string | null | undefined,
  body: Partial<Omit<CinematicSignatureData, 'user_id'>>,
) =>
  apiFetch<SettingsWrappedResponse<CinematicSignatureData>>('/api/settings/profile/signature', {
    token,
    method: 'PATCH',
    body,
    defaultValue: {
      ok: true,
      data: {
        user_id: 0,
        pivotal_film: null,
        pivotal_film_detail: null,
        formative_director: null,
        formative_director_detail: null,
        unforgettable_scene: null,
        unforgettable_scene_detail: null,
        cinema_turning_year: null,
        cinema_turning_year_detail: null,
      },
    },
  })

export const fetchOwnerCuratedGallery = (token: string | null | undefined) =>
  apiFetch<SettingsWrappedResponse<{ items: CuratedGalleryItemData[] }>>('/api/settings/profile/curated-gallery', {
    token,
    defaultValue: { ok: true, data: { items: [] } },
  })

export const fetchPublicCuratedGallery = (userId: number) =>
  apiFetch<{ items: CuratedGalleryItemData[] }>(`/api/users/${userId}/profile/curated-gallery`, {
    defaultValue: { items: [] },
  })

export const updateOwnerCuratedGallery = (
  token: string | null | undefined,
  items: Array<{ movie_id: number; order_index: number; note?: string | null }>,
) =>
  apiFetch<SettingsWrappedResponse<{ items: CuratedGalleryItemData[] }>>('/api/settings/profile/curated-gallery', {
    token,
    method: 'PUT',
    body: { items },
    defaultValue: { ok: true, data: { items: [] } },
  })
