import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { prisma } from "../lib/prisma.js"
import {
  PayloadAcceso,
  PayloadRefresco,
} from "../middlewares/auth.middlewares.js"

// Configuración de expiración de tokens
const EXPIRACION_TOKEN_ACCESO = "15m"
const DIAS_EXPIRACION_TOKEN_REFRESCO = 7

/**
 * Genera un JWT de acceso de corta duración.
 * @param idUsuario ID del usuario
 * @param rol Rol del usuario
 */
export const crearTokenAcceso = (idUsuario: number, rol: string) => {
  const payload: PayloadAcceso = {
    user_id: idUsuario,
    role: rol as PayloadAcceso["role"],
  }
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: EXPIRACION_TOKEN_ACCESO,
  })
}

/**
 * Genera un Refresh Token y crea una sesión en la base de datos.
 * @param idUsuario ID del usuario
 */
export const crearTokenRefresco = async (idUsuario: number) => {
  const idSesion = crypto.randomUUID()
  const token = jwt.sign(
    { id_session: idSesion, user_id: idUsuario } as PayloadRefresco,
    process.env.REFRESH_SECRET!,
    { expiresIn: `${DIAS_EXPIRACION_TOKEN_REFRESCO}d` }
  )

  // Persistir sesión en DB
  await prisma.sessions.create({
    data: {
      id: idSesion,
      refresh_token: token,
      user_id: idUsuario,
      expires_at: new Date(
        Date.now() + DIAS_EXPIRACION_TOKEN_REFRESCO * 24 * 60 * 60 * 1000
      ),
    },
  })

  return { token, idSesion }
}

/**
 * Verifica la validez de un Refresh Token y comprueba si la sesión existe en DB.
 * @param token Token a verificar
 */
export const verificarTokenRefresco = async (token: string) => {
  const payload = jwt.verify(
    token,
    process.env.REFRESH_SECRET!
  ) as PayloadRefresco

  // Verificar que la sesión no haya sido revocada
  const sesion = await prisma.sessions.findUnique({
    where: { id: payload.id_session },
  })
  if (!sesion) throw new Error("Sesión inválida o revocada")

  return payload
}

/**
 * Encripta una contraseña usando bcrypt.
 */
export const hashearContrasena = (password: string) => bcrypt.hash(password, 10)

/**
 * Compara una contraseña plana con su hash.
 */
export const compararContrasena = (password: string, hash: string) =>
  bcrypt.compare(password, hash)
