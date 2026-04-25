/**
 * @file googleAuth.ts
 * @description Módulo de soporte para el flujo de autenticación mediante Google OAuth 2.0.
 * Gestiona la resolución dinámica de URLs de retorno (callbacks), la persistencia
 * del estado mediante mutación de cadenas en base64 y la validación de dominios
 * permitidos para prevenir vulnerabilidades de redirección abierta (Open Redirect).
 */

import { Request } from "express"

const DEFAULT_LOCAL_GOOGLE_CALLBACK =
  "http://localhost:4000/api/auth/google/callback"

/** Prefijo utilizado para identificar estados generados por CineVault */
const GOOGLE_STATE_PREFIX = "cv_google_cb:"

/**
 * Normaliza URLs eliminando espacios y barras diagonales finales.
 */
export const normalizeUrl = (value: string) => value.trim().replace(/\/+$/, "")

/**
 * Determina la URL de callback por defecto basada en las variables de entorno.
 */
export const getDefaultGoogleCallback = () => {
  const explicit = String(process.env.GOOGLE_REDIRECT_URI || "").trim()
  if (explicit) return explicit

  const backendUrl = String(process.env.BACKEND_URL || "").trim()
  if (backendUrl) return `${normalizeUrl(backendUrl)}/api/auth/google/callback`

  return DEFAULT_LOCAL_GOOGLE_CALLBACK
}

/**
 * Construye el conjunto de URLs de redirección permitidas (Allowlist).
 * Combina la URL base con las configuradas en GOOGLE_REDIRECT_URI_ALLOWLIST.
 */
export const getAllowedGoogleCallbacks = () => {
  const configured = String(process.env.GOOGLE_REDIRECT_URI_ALLOWLIST || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)

  return new Set([getDefaultGoogleCallback(), ...configured].map(normalizeUrl))
}

/**
 * Genera un parámetro 'state' de OAuth que codifica la URL de retorno deseada.
 *
 * @param callbackUrl - URL a la que el frontend espera volver tras el login.
 * @returns Cadena opaca prefijada con codificación base64url.
 */
export const buildGoogleState = (callbackUrl: string) => {
  const encoded = Buffer.from(callbackUrl, "utf8").toString("base64url")
  return `${GOOGLE_STATE_PREFIX}${encoded}`
}

/**
 * Extrae y decodifica la URL de callback almacenada en el parámetro 'state'.
 */
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

/**
 * Orquestador que resuelve cuál es la URL de callback válida para la petición actual.
 * Prioriza el estado codificado seguido de los parámetros de consulta explícitos.
 * Siempre valida el resultado contra la lista blanca de seguridad.
 *
 * @param req - Objeto de petición de Express.
 * @returns URL de callback normalizada y validada.
 */
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

  // Fallback de seguridad al callback predeterminado del sistema
  return getDefaultGoogleCallback()
}
