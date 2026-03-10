export type AuthUser = {
  id: number
  username: string
  avatar_url?: string | null
  two_factor_enabled?: boolean | null
}

type TwoFactorActivateResponse = {
  qr: string
  secreto: string
}

type TwoFactorConfirmResponse = {
  recoveryCodes?: string[]
}

type RecoveryCodesStatusResponse = {
  remaining: number
}

const API_URL = import.meta.env.VITE_API_URL
const ACCESS_TOKEN_KEY = 'token'
const AUTH_STORAGE_MODE_RAW = String(import.meta.env.VITE_AUTH_STORAGE_MODE || 'hybrid').toLowerCase()
const COOKIE_ONLY_MODES = new Set(['cookie', 'cookie-only'])
const IS_COOKIE_ONLY_MODE = COOKIE_ONLY_MODES.has(AUTH_STORAGE_MODE_RAW)
let refreshInFlight: Promise<string | null> | null = null
let volatileAccessToken: string | null = null

export const isCookieOnlyAuthMode = () => IS_COOKIE_ONLY_MODE

export const getStoredAccessToken = () => {
  if (volatileAccessToken) return volatileAccessToken
  if (IS_COOKIE_ONLY_MODE) {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    return null
  }

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
  volatileAccessToken = token
  if (!IS_COOKIE_ONLY_MODE) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  }
}

export const clearStoredAccessToken = () => {
  volatileAccessToken = null
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
  const { retryOn401 = true, allowRefreshWithoutToken = true } = options

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
  const res = await authorizedFetch('/api/auth/verify')

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

export async function finalizeOAuthCallback(): Promise<string> {
  const refreshed = await refreshAccessToken()
  if (!refreshed) {
    throw new Error('No se pudo completar la autenticacion con Google')
  }

  return refreshed
}

export async function verifyTwoFactorLogin(
  codigo: string,
  tokenTemporal: string,
  rememberDevice = false
): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/2fa/verificar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ codigo, tokenTemporal, rememberDevice }),
  })

  const data = (await response.json().catch(() => ({}))) as { accessToken?: string; message?: string }

  if (!response.ok || !data.accessToken) {
    throw new Error(data.message || 'No se pudo verificar el codigo 2FA')
  }

  setStoredAccessToken(data.accessToken)
  return data.accessToken
}

const parseApiErrorMessage = async (response: Response, fallback: string) => {
  const payload = (await response.json().catch(() => null)) as
    | { message?: string; error?: { message?: string } }
    | null

  return payload?.error?.message || payload?.message || fallback
}

export async function activateTwoFactor(): Promise<TwoFactorActivateResponse> {
  const response = await authorizedFetch('/api/auth/2fa/activar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response, 'No se pudo generar el QR de 2FA'))
  }

  return (await response.json()) as TwoFactorActivateResponse
}

export async function confirmTwoFactor(codigo: string): Promise<TwoFactorConfirmResponse> {
  const response = await authorizedFetch('/api/auth/2fa/confirmar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo }),
  })

  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response, 'No se pudo confirmar 2FA'))
  }

  return (await response.json().catch(() => ({}))) as TwoFactorConfirmResponse
}

export async function disableTwoFactor(codigo: string): Promise<void> {
  const response = await authorizedFetch('/api/auth/2fa/desactivar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo }),
  })

  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response, 'No se pudo desactivar 2FA'))
  }
}

export async function getRecoveryCodesStatus(): Promise<RecoveryCodesStatusResponse> {
  const response = await authorizedFetch('/api/auth/2fa/recovery-codes/status', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response, 'No se pudo obtener estado de recovery codes'))
  }

  return (await response.json()) as RecoveryCodesStatusResponse
}

export async function regenerateRecoveryCodes(codigo: string): Promise<string[]> {
  const response = await authorizedFetch('/api/auth/2fa/recovery-codes/regenerar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo }),
  })

  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response, 'No se pudieron regenerar los recovery codes'))
  }

  const payload = (await response.json().catch(() => ({}))) as { recoveryCodes?: string[] }
  return Array.isArray(payload.recoveryCodes) ? payload.recoveryCodes : []
}