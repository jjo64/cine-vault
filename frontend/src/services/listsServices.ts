import { authorizedJson } from './authServices'

export type UserListSummary = {
  id: number
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  items_count: number
}

export type UserListItem = {
  movie_id: number
  tmdb_id: number | null
  added_at: string
}

export type UserListDetail = UserListSummary & {
  items: UserListItem[]
}

export const getMyLists = () => authorizedJson<UserListSummary[]>('/api/lists')

export const getMyListDetail = (listId: number) =>
  authorizedJson<UserListDetail>(`/api/lists/${listId}`)

export const createList = (payload: {
  name: string
  description?: string | null
  is_public?: boolean
}) =>
  authorizedJson<UserListSummary>('/api/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export const updateList = (
  listId: number,
  payload: { name?: string; description?: string | null; is_public?: boolean }
) =>
  authorizedJson<UserListSummary>(`/api/lists/${listId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

export const deleteList = (listId: number) =>
  authorizedJson<{ message: string }>(`/api/lists/${listId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

export const addMovieToList = (listId: number, movieId: number) =>
  authorizedJson<{ message: string }>(`/api/lists/${listId}/movies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ movie_id: movieId }),
  })

export const removeMovieFromList = (listId: number, movieId: number) =>
  authorizedJson<{ message: string }>(`/api/lists/${listId}/movies/${movieId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
