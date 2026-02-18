import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

// Interfaces para los payloads de los tokens JWT
export interface PayloadAcceso {
  user_id: number
  role: "admin" | "editor" | "user"
}

export interface PayloadRefresco {
  id_session: string
  user_id: number
}

// Extensión de la interfaz Request de Express para incluir los datos del usuario autenticado
export interface SolicitudAutenticada extends Request {
  user?: PayloadAcceso
}

/**
 * Middleware de Autenticación
 * Verifica si la petición tiene un token de acceso válido en los headers.
 * Si es válido, inyecta la información del usuario en `req.user`.
 */
export const middlewareAutenticacion = (
  req: SolicitudAutenticada,
  res: Response,
  next: NextFunction
) => {
  // Intentar obtener el header de autorización
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1] // Formato: "Bearer [token]"

  // Si no hay token, denegar acceso inmediatamente
  if (!token)
    return res
      .status(401)
      .json({ message: "No se proporcionó token de acceso" })

  try {
    // Verificar firma y expiración del token
    const secret = process.env.JWT_SECRET || "secret_fallback_dev" // Fallback solo para desarrollo local
    const payload = jwt.verify(token, secret) as PayloadAcceso

    // Adjuntar payload a la request para usarlo en los controladores
    req.user = payload
    next()
  } catch (err) {
    // Token inválido o expirado
    res.status(403).json({ message: "Token inválido o expirado" })
  }
}
