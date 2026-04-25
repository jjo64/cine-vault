/**
 * @file auth.ts
 * @description Definiciones de tipos globales para los flujos de autenticación.
 * Centraliza las interfaces de respuesta para los procesos de Login, 2FA
 * y la representación segura del objeto Usuario.
 */

/** Respuesta exitosa de autenticación directa */
export type LoginSuccess = {
  type: "OK"
  tokenAcceso: string
  tokenRefresco: string
}

/** Respuesta que indica que el usuario debe validar su identidad mediante 2FA */
export type LoginTwoFactorRequired = {
  type: "2FA_REQUIRED"
  tokenTemporal: string // Token de corta duración para validar el segundo factor
}

/** Tipo unión para el resultado del proceso de login */
export type LoginResult = LoginSuccess | LoginTwoFactorRequired

/**
 * Interfaz de usuario "segura".
 * Representa los datos del usuario que pueden ser expuestos al cliente
 * o compartidos entre capas sin incluir información sensible como hashes de contraseñas.
 */
export type SafeUser = {
  id: number
  username: string
  email: string
  role: string
  avatar_url?: string | null
  bio?: string | null
  is_verified?: boolean | null
  two_factor_enabled?: boolean | null
}
