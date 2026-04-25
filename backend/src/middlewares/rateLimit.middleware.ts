/**
 * @file rateLimit.middleware.ts
 * @description Capa de protección contra abusos de red y ataques de fuerza bruta.
 * Implementa una jerarquía de limitación de tasa (Rate Limiting) con cuatro niveles
 * de severidad, integrando Redis como almacenamiento distribuido para garantizar
 * que los contadores de bloqueo sean persistentes y precisos.
 */

import rateLimit from "express-rate-limit"
import { RateLimiterRedis } from "rate-limiter-flexible"
import { redis } from "../config/redis.js"
import { checkIPSpike } from "../services/security.services.js"
import { TooManyRequestsError } from "../errors/AppErrors.js"

const isProduction = process.env.NODE_ENV === "production"

/**
 * 1. LIMITADOR GLOBAL
 * Aplica una restricción generosa a todos los endpoints para prevenir
 * el consumo excesivo de recursos por bots o rastreadores agresivos.
 */
export const limitadorGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de observación: 15 minutos
  max: 200, // Umbral máximo de peticiones por IP
  standardHeaders: true, // Expone cabeceras informativas RateLimit-*
  legacyHeaders: false,
  // Bypass en desarrollo para facilitar el testing
  skip: (req) =>
    !isProduction || ["GET", "HEAD", "OPTIONS"].includes(req.method),
  message: {
    error: {
      code: "RATE_LIMIT",
      message:
        "Se ha detectado un volumen inusual de peticiones. Inténtelo de nuevo en 15 minutos.",
    },
  },
})

/**
 * 2. LIMITADOR ESTRICTO (Autenticación)
 * Diseñado específicamente para proteger rutas críticas (Login, 2FA, Registro)
 * contra ataques de fuerza bruta y diccionarios.
 */
const limiterRedis = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl:auth", // Espacio de nombres en Redis
  points: 5, // Límite de 5 intentos fallidos
  duration: 15 * 60, // Reinicio de contador tras 15 minutos
  blockDuration: 15 * 60, // Duración del bloqueo tras exceder el límite
})

/**
 * Middleware que consume puntos de cuota para acciones de autenticación.
 */
export const limitadorAuth = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  if (!isProduction) return next()

  try {
    // Clave compuesta por IP y ruta para granularidad máxima
    const key = `${req.ip}:${req.path}`
    await limiterRedis.consume(key)
    next()
  } catch {
    res.status(429).json({
      error: {
        code: "BRUTE_FORCE_BLOCKED",
        message:
          "Se han detectado demasiados intentos de acceso fallidos. Su IP ha sido bloqueada temporalmente.",
      },
    })
  }
}

/**
 * 3. LIMITADOR DE ENVÍO DE CORREOS
 * Previene el abuso de los servicios de notificaciones (Spam de verificación de email).
 */
const limiterEmail = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl:email",
  points: 3, // Máximo 3 emails por hora
  duration: 60 * 60,
  blockDuration: 60 * 60,
})

export const limitadorEmail = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  if (!isProduction) return next()

  try {
    await limiterEmail.consume(req.ip!)
    next()
  } catch {
    res.status(429).json({
      error: {
        code: "EMAIL_LIMIT",
        message:
          "Límite de envío de correos alcanzado. Por favor, espere una hora.",
      },
    })
  }
}

/**
 * 4. LIMITADOR ANTI-SPIKE
 * Protege contra ráfagas rápidas de peticiones de escritura (scripts automatizados).
 * Utiliza una heurística de monitoreo en tiempo real sobre la IP.
 */
export const limitarSpikesIP = async (
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) => {
  try {
    // Si se detecta un pico sospechoso en la ventana de segundos actual
    if (await checkIPSpike(req.ip!)) {
      throw new TooManyRequestsError(
        "Se detectó una actividad inusualmente rápida. Por favor, reduzca la velocidad."
      )
    }
    next()
  } catch (error) {
    next(error)
  }
}
