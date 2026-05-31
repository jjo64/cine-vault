/**
 * @file auth.middlewares.ts
 * @description Middleware central de seguridad para el control de acceso.
 * Implementa la verificación de identidad mediante JSON Web Tokens (JWT),
 * soportando tanto cabeceras Authorization (Bearer) como cookies de sesión seguras.
 */

import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { UnauthorizedError } from "../errors/AppErrors.js"

/** Estructura del payload contenido en el Token de Acceso */
export interface PayloadAcceso {
  /** Identificador único del usuario */
  user_id: number
  /** Rol asignado (RBAC) */
  role: "admin" | "editor" | "user"
  /** Estado de verificación del correo electrónico */
  is_verified: boolean
  /** Nivel de suscripción (inyectado dinámicamente por la capa de permisos) */
  membership?: string
}

/** Estructura del payload contenido en el Token de Refresco */
export interface PayloadRefresco {
  /** Identificador de la sesión persistente en base de datos */
  id_session: string
  user_id: number
}

// Extensión de los tipos globales de Express para incluir los datos del usuario autenticado
declare module "express-serve-static-core" {
  interface Request {
    /** Objeto con la identidad del usuario extraída del token */
    user?: PayloadAcceso
  }
}

/**
 * Alias semántico para peticiones que han pasado la barrera de autenticación.
 * Facilita el tipado en controladores y servicios.
 */
export type SolicitudAutenticada = Request

/**
 * Middleware que intercepta peticiones y valida la presencia de una sesión activa.
 *
 * @throws {UnauthorizedError} Si el token no está presente, es inválido o ha expirado.
 * @param req - Petición entrante.
 * @param res - Respuesta Express.
 * @param next - Función para continuar a la siguiente capa.
 */
export const middlewareAutenticacion = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Estrategia de recuperación híbrida: Cabecera Authorization o Cookie segurizada
  const authHeader = req.headers["authorization"]
  const bearerToken = authHeader && authHeader.split(" ")[1]
  const cookieToken = req.cookies?.access_token
  const token = bearerToken || cookieToken

  if (!token) {
    throw new UnauthorizedError(
      "Identidad no proporcionada: Se requiere un token de acceso válido"
    )
  }

  try {
    // Verificación criptográfica del token
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as PayloadAcceso

    // Inyección de la identidad en el objeto request para acceso compartido
    req.user = payload
    next()
  } catch {
    // Captura de expiraciones o manipulaciones del token
    next(
      new UnauthorizedError(
        "La sesión ha expirado o el token proporcionado es inválido"
      )
    )
  }
}

/**
 * Middleware que de forma opcional valida si existe una sesión activa.
 * Si no hay token o es inválido, continúa sin inyectar req.user.
 */
export const middlewareAutenticacionOpcional = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"]
  const bearerToken = authHeader && authHeader.split(" ")[1]
  const cookieToken = req.cookies?.access_token
  const token = bearerToken || cookieToken

  if (!token) {
    return next()
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as PayloadAcceso
    req.user = payload
  } catch {
    // Ignorar tokens expirados/inválidos en auth opcional
  }
  next()
}

