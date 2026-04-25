/**
 * @file redis.ts
 * @description Configuración y helpers para la gestión de caché mediante Redis.
 * Centraliza la lógica de persistencia temporal para reducir la carga en la
 * base de datos principal (Prisma) y en las APIs externas (TMDB).
 */

import { redis } from "../lib/redis.js"

/**
 * Inicializa la conexión con el servidor Redis si el cliente se encuentra
 * en estado de espera o cerrado. Soporta mocks en entornos de test.
 */
export const conectarRedis = async () => {
  const client = redis as unknown as {
    status?: string
    connect?: () => Promise<void>
  }
  if (client?.status === "wait" || client?.status === "close") {
    await client.connect?.()
  }
}

const TTL_DEFAULT = 300 // 5 minutos por defecto

/**
 * Obtiene un valor de la caché o lo genera mediante una función fábrica si no existe.
 * Implementa el patrón "Stale-While-Revalidate" básico mediante persistencia directa.
 *
 * @param key - Clave única del recurso en Redis.
 * @param fn - Función asíncrona que recupera los datos originales si no hay caché.
 * @param ttl - Tiempo de vida en segundos (Time To Live).
 * @returns Los datos recuperados (desde la caché o desde la fuente original).
 */
export const getOSet = async <T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = TTL_DEFAULT
): Promise<T> => {
  try {
    const cached = await redis.get(key)
    if (cached) {
      return JSON.parse(cached) as T
    }
  } catch (error) {
    console.error(`[Redis] Error de lectura para la clave ${key}:`, error)
  }

  const resultado = await fn()

  try {
    // Establece el valor con expiración automática.
    await redis.setex(key, ttl, JSON.stringify(resultado))
  } catch (error) {
    console.error(`[Redis] Error de escritura para la clave ${key}:`, error)
  }

  return resultado
}

/**
 * Elimina una o varias claves específicas de la caché.
 * Útil para mantener la integridad tras operaciones de escritura (POST/PATCH/DELETE).
 */
export const invalidarCache = async (...keys: string[]) => {
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

/**
 * Busca e invalida todas las claves que coincidan con un patrón glob.
 * @param patron - Ejemplo: "perfil:*" para borrar todos los perfiles cacheados.
 */
export const invalidarPatron = async (patron: string) => {
  const keys = await redis.keys(patron)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

/**
 * Diccionario centralizado de generadores de claves.
 * Evita colisiones y asegura consistencia en el esquema de claves de Redis.
 */
export const CACHE_KEYS = {
  perfil: (userId: number) => `perfil:${userId}`,
  favorites: (userId: number) => `favorites:${userId}`,
  watchlist: (userId: number) => `watchlist:${userId}`,
  busqueda: (query: string, pagina: number) =>
    `tmdb:search:${query.toLowerCase().trim()}:p${pagina}`,
}

/**
 * Tiempos de expiración recomendados por tipo de recurso.
 */
export const CACHE_TTL = {
  perfil: 600, // 10 minutos
  listas: 300, // 5 minutos
  busqueda: 7200, // 2 horas
}

export { redis } from "../lib/redis.js"
