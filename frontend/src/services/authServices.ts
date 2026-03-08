export type AuthUser = {
  id: number
  username: string
  avatar_url?: string | null
}

const API_URL = import.meta.env.VITE_API_URL
const ACCESS_TOKEN_KEY = 'token'
let refreshInFlight: Promise<string | null> | null = null

export const getStoredAccessToken = () => {
  const raw = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (!raw) return null

  const token = raw.trim()
  // Clean up accidental placeholders left in storage.
  if (!token || token === 'undefined' || token === 'null') {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    return null
  }

  return token
}

export const setStoredAccessToken = (token: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const clearStoredAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!res.ok) {
      clearStoredAccessToken()
      window.dispatchEvent(new CustomEvent('auth-state-changed'))
      return null
    }

    const data = (await res.json()) as { accessToken?: string }
    if (!data.accessToken) {
      clearStoredAccessToken()
      window.dispatchEvent(new CustomEvent('auth-state-changed'))
      return null
    }

    setStoredAccessToken(data.accessToken)
    window.dispatchEvent(new CustomEvent('auth-state-changed'))
    return data.accessToken
  })().finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

type AuthorizedFetchOptions = {
  retryOn401?: boolean
  allowRefreshWithoutToken?: boolean
}

export async function authorizedFetch(
  path: string,
  init: RequestInit = {},
  options: AuthorizedFetchOptions = {}
): Promise<Response> {
  const { retryOn401 = true, allowRefreshWithoutToken = false } = options

  const perform = async (token: string | null) => {
    const headers = new Headers(init.headers || {})
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    })
  }

  let token = getStoredAccessToken()
  if (!token && allowRefreshWithoutToken && path !== '/api/auth/refresh') {
    token = await refreshAccessToken()
  }

  let response = await perform(token)

  if (
    response.status === 401 &&
    retryOn401 &&
    path !== '/api/auth/refresh'
  ) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      response = await perform(refreshed)
    }
  }

  if (response.status === 401) {
    clearStoredAccessToken()
    window.dispatchEvent(new CustomEvent('auth-state-changed'))
  }

  return response
}

export async function authorizedJson<T>(
  path: string,
  init: RequestInit = {},
  options: AuthorizedFetchOptions = {}
): Promise<T> {
  const response = await authorizedFetch(path, init, options)
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Error ${response.status}`)
  }

  if (response.status === 204) return {} as T
  return (await response.json()) as T
}

export async function getCurrentUser(): Promise<AuthUser> {
  const token = getStoredAccessToken()
  if (!token) throw new Error('Usuario no autorizado')

  const res = await authorizedFetch('/api/auth/verify', {}, { allowRefreshWithoutToken: false })

  if (!res.ok) {
    throw new Error("Usuario no autorizado")
  }

  return await res.json()
}

export async function logoutCurrentUser() {
  const token = getStoredAccessToken()

  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    })
  } finally {
    clearStoredAccessToken()
    window.dispatchEvent(new CustomEvent('auth-state-changed'))
  }
}