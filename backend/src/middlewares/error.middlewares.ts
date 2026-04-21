/**
 * @file error.middlewares.ts
 * @description Orquestador centralizado para la gestión de excepciones y errores asíncronos.
 * Implementa una arquitectura de captura de errores que estandariza las respuestas 
 * de la API, garantizando que el cliente reciba códigos HTTP semánticos y 
 * mensajes estructurados (JSON), evitando fugas de información técnica (stack traces).
 */

import { Request, Response, NextFunction } from "express"
import { ApplicationError } from "../errors/AppErrors.js"

/**
 * Manejador global de errores de Express.
 * Debe registrarse como el ÚLTIMO middleware en la cadena de ejecución.
 * 
 * Intercepta:
 * 1. Excepciones personalizadas (ApplicationError).
 * 2. Errores de librerías externas (JWT, Multer, etc.).
 * 3. Errores inesperados de sintaxis o lógica (Internal Server Error).
 * 
 * @param err - Objeto de error capturado.
 * @param res - Objeto de respuesta para estandarizar el JSON de salida.
 */
export const manejadorErrores = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Caso 1: Errores controlados por la lógica de negocio de CineVault
  if (err instanceof ApplicationError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    })
  }

  // Caso 2: Errores específicos de seguridad (JWT)
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: {
        code: "TOKEN_INVALIDO",
        message: "La sesión ha expirado o el token de seguridad no es válido",
      },
    })
  }

  // Caso 3: Error genérico no capturado (Fallo estructural o de infraestructura)
  console.error("[MONITORIZACIÓN] Error no controlado detectado:", err)
  
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Se ha producido un error interno y el equipo técnico ha sido notificado",
    },
  })
}

/**
 * High-Order Function (Encapsulador) para controladores asíncronos.
 * Elimina la necesidad de bloques try/catch repetitivos en la capa de controladores,
 * delegando automáticamente cualquier rechazo de promesa al manejadorErrores global.
 * 
 * @param fn - Función controladora asíncrona (Controller).
 * @returns Función middleware compatible con Express.
 */
export const manejadorAsincrono =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
