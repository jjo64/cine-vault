import { Request } from "express"

/**
 * CineVault: Módulo auxiliar para la resolución y manejo del estado de Google OAuth.
 * Delegamos aquí la construcción del estado y la normalización de la URL de callback
 * para mantener limpias las capas de enrutamiento y seguir el Principio de Responsabilidad Única (SRP).
 */

const DEFAULT_LOCAL_GOOGLE_CALLBACK =
  "http://localhost:4000/api/auth/google/callback"
const GOOGLE_STATE_PREFIX = "cv_google_cb:"

/** Normaliza URLs eliminando slash final */
export const normalizeUrl = (value: string) => value.trim().replace(/\/+$/, "")

export const getDefaultGoogleCallback = () => {
  const explicit = String(process.env.GOOGLE_REDIRECT_URI || "").trim()
  if (explicit) return explicit

  const backendUrl = String(process.env.BACKEND_URL || "").trim()
  if (backendUrl) return `${normalizeUrl(backendUrl)}/api/auth/google/callback`

  return DEFAULT_LOCAL_GOOGLE_CALLBACK
}

export const getAllowedGoogleCallbacks = () => {
  const configured = String(process.env.GOOGLE_REDIRECT_URI_ALLOWLIST || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)

  return new Set([getDefaultGoogleCallback(), ...configured].map(normalizeUrl))
}

export const buildGoogleState = (callbackUrl: string) => {
  const encoded = Buffer.from(callbackUrl, "utf8").toString("base64url")
  return `${GOOGLE_STATE_PREFIX}${encoded}`
}

export const readCallbackFromState = (state: unknown) => {
  if (typeof state !== "string" || !state.startsWith(GOOGLE_STATE_PREFIX)) {
    return null
  }

  const encoded = state.slice(GOOGLE_STATE_PREFIX.length)
  if (!encoded) return null

  try {
    const decoded = Buffer.from(encoded, "base64url").toString("utf8").trim()
    return decoded || null
  } catch {
    return null
  }
}

export const resolveGoogleCallback = (req: Request) => {
  const fromState = readCallbackFromState(req.query.state)
  const fromQuery =
    typeof req.query.redirect_uri === "string"
      ? req.query.redirect_uri.trim()
      : ""

  const candidate = normalizeUrl(
    fromState || fromQuery || getDefaultGoogleCallback()
  )
  const allowlist = getAllowedGoogleCallbacks()
  
  if (allowlist.has(candidate)) return candidate

  return getDefaultGoogleCallback()
}
