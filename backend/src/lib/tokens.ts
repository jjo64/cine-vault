/**
 * @file tokens.ts
 * @description Gestión centralizada de tokens JWT y configuración de cookies de seguridad.
 * Implementa la lógica de autenticación de doble token (Access + Refresh) y 
 * la persistencia de sesiones en base de datos mediante hashing SHA-256.
 */

import {
  PayloadAcceso,
  PayloadRefresco,
} from "../middlewares/auth.middlewares.js"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { sessionRepository } from "../repositories/SessionRepository.js"

const EXPIRACION_TOKEN_ACCESO = "15m"
const DIAS_EXPIRACION_TOKEN_REFRESCO = 7
const IS_PRODUCTION = process.env.NODE_ENV === "production"

/** Determina la política de SameSite basándose en el entorno de ejecución */
const COOKIE_SAME_SITE: "none" | "lax" = IS_PRODUCTION ? "none" : "lax"

/**
 * ---------------------------------------------------------------------------
 * CONFIGURACIÓN DE COOKIES
 * ---------------------------------------------------------------------------
 */

/** Opciones base para la cookie de Refresh Token (larga duración) */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: COOKIE_SAME_SITE,
  path: "/",
  maxAge: DIAS_EXPIRACION_TOKEN_REFRESCO * 24 * 60 * 60 * 1000,
}

/** Opciones para la cookie de Access Token (corta duración) */
export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: COOKIE_SAME_SITE,
  path: "/",
  maxAge: 15 * 60 * 1000,
}

/** Opciones para la cookie de dispositivo de confianza (30 días) */
export const TRUSTED_DEVICE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: COOKIE_SAME_SITE,
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
}

// Opciones de limpieza de cookies (Logout)
export const COOKIE_CLEAR_OPTIONS = { httpOnly: true, secure: IS_PRODUCTION, sameSite: COOKIE_SAME_SITE, path: "/" }
export const ACCESS_COOKIE_CLEAR_OPTIONS = { ...COOKIE_CLEAR_OPTIONS }
export const TRUSTED_DEVICE_COOKIE_CLEAR_OPTIONS = { ...COOKIE_CLEAR_OPTIONS }

/**
 * ---------------------------------------------------------------------------
 * GESTIÓN DE TOKENS JWT
 * ---------------------------------------------------------------------------
 */

/**
 * Crea un token de acceso firmado digitalmente.
 * 
 * @param idUsuario - Identificador único del usuario.
 * @param rol - Rol administrativo asignado.
 * @param isVerified - Estado de verificación de la cuenta.
 * @returns Token JWT firmado.
 */
export const crearTokenAcceso = (
  idUsuario: number,
  rol: string,
  isVerified: boolean
) => {
  const payload: PayloadAcceso = {
    user_id: idUsuario,
    role: rol as PayloadAcceso["role"],
    is_verified: isVerified,
  }
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: EXPIRACION_TOKEN_ACCESO,
  })
}

/**
 * Genera un Refresh Token, crea una sesión en DB y devuelve el token.
 * Se guarda el HASH del token en DB para mayor seguridad (Slow lookup).
 * 
 * @param idUsuario - ID del usuario solicitante.
 * @returns Objeto con el token en texto plano y el ID de sesión.
 */
export const crearTokenRefresco = async (idUsuario: number) => {
  const idSesion = crypto.randomUUID()
  const token = jwt.sign(
    { id_session: idSesion, user_id: idUsuario } as PayloadRefresco,
    process.env.REFRESH_SECRET!,
    { expiresIn: `${DIAS_EXPIRACION_TOKEN_REFRESCO}d` }
  )

  await sessionRepository.create({
    id: idSesion,
    refresh_token: token, // Se almacena por compatibilidad, pero se valida por hash
    token_hash: hashearToken(token),
    users: { connect: { id: idUsuario } },
    expires_at: new Date(
      Date.now() + DIAS_EXPIRACION_TOKEN_REFRESCO * 24 * 60 * 60 * 1000
    ),
  })

  return { token, idSesion }
}

/**
 * Valida un Refresh Token y verifica su vigencia en la base de datos.
 * 
 * @param token - Token de refresco recibido por el cliente.
 * @returns Payload de la sesión si es válido.
 * @throws Error si el token es inválido o la sesión ha sido revocada explícitamente.
 */
export const verificarTokenRefresco = async (token: string) => {
  const payload = jwt.verify(
    token,
    process.env.REFRESH_SECRET!
  ) as PayloadRefresco

  const sesion = await sessionRepository.findByHashAndId(
    payload.id_session,
    hashearToken(token)
  )

  if (!sesion) throw new Error("Sesión inválida, inexistente o revocada")

  return payload
}

/**
 * Genera un resumen SHA-256 de un token para almacenamiento seguro.
 */
export const hashearToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex")
}
