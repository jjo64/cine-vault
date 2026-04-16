/**
 * @file security.services.ts
 * @description Capa de servicios de seguridad auxiliar y detección de comportamientos anómalos.
 * Implementa mecanismos de defensa proactiva contra ráfagas de tráfico (Spike Detection) 
 * y control de spam en interacciones sociales mediante el uso de Redis como almacenamiento volátil.
 */

import { redis } from "../lib/redis.js"

// --- Servicios de Protección de Infraestructura ---

/**
 * Detecta incrementos súbitos y anómalos de tráfico (spikes) provenientes de una misma IP.
 * Se utiliza para identificar potenciales ataques de denegación de servicio (DoS) o scrapers agresivos.
 * 
 * @param ip Dirección IP del cliente a evaluar.
 * @returns true si se ha superado el umbral de peticiones en la ventana temporal.
 */
export const checkIPSpike = async (ip: string) => {
  const key = `spike:${ip}`
  const MAX_REQUESTS = 15 // Incrementado ligeramente para tolerar navegación rápida
  const WINDOW_SECONDS = 5

  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, WINDOW_SECONDS)
  }

  return count > MAX_REQUESTS
}

// --- Servicios de Moderación Automática ---

/**
 * Evalúa si un comentario es una repetición exacta (spam) dentro de las últimas 
 * interacciones del usuario.
 * 
 * @param userId ID del usuario que emite el comentario.
 * @param comment Texto del comentario a validar.
 * @returns true si el comentario se considera duplicado/spam.
 */
export const isDuplicateComment = async (userId: string, comment: string) => {
  const key = `spam_check:${userId}`
  const MAX_DUPLICATES = 3

  // Mantenemos una lista circular de los últimos N comentarios en Redis
  await redis.lpush(key, comment)
  await redis.ltrim(key, 0, MAX_DUPLICATES - 1)

  const lastComments = await redis.lrange(key, 0, -1)
  const repeats = lastComments.filter((c) => c === comment).length

  return repeats >= MAX_DUPLICATES
}

export { redis }
