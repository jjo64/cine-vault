import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { prisma } from "../lib/prisma.js"
import { AccessPayload, RefreshPayload } from "../middlewares/auth.middlewares.js"

// Configuración de expiración de tokens
const ACCESS_TOKEN_EXPIRY = "15m"
const REFRESH_TOKEN_EXPIRY_DAYS = 7

/**
 * Genera un JWT de acceso de corta duración.
 * @param userId ID del usuario
 * @param role Rol del usuario
 */
export const createAccessToken = (userId: number, role: string) => {
  const payload: AccessPayload = { user_id: userId, role: role as AccessPayload['role'] }
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY })
}

/**
 * Genera un Refresh Token y crea una sesión en la base de datos.
 * @param userId ID del usuario
 */
export const createRefreshToken = async (userId: number) => {
  const session_id = crypto.randomUUID()
  const token = jwt.sign(
    { id_session: session_id, user_id: userId } as RefreshPayload,
    process.env.REFRESH_SECRET!,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
  )

  // Persistir sesión en DB
  await prisma.sessions.create({
    data: {
      id: session_id,
      refresh_token: token,
      user_id: userId,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    }
  })

  return { token, session_id }
}

/**
 * Verifica la validez de un Refresh Token y comprueba si la sesión existe en DB.
 * @param token Token a verificar
 */
export const verifyRefreshToken = async (token: string) => {
  const payload = jwt.verify(token, process.env.REFRESH_SECRET!) as RefreshPayload
  
  // Verificar que la sesión no haya sido revocada
  const session = await prisma.sessions.findUnique({ where: { id: payload.id_session } })
  if (!session) throw new Error("Sesión inválida o revocada")
  
  return payload
}

/**
 * Encripta una contraseña usando bcrypt.
 */
export const hashPassword = (password: string) => bcrypt.hash(password, 10)

/**
 * Compara una contraseña plana con su hash.
 */
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash)