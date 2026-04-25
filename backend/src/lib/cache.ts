/**
 * @file cache.ts
 * @description Utilidades de alto nivel para la interacción con el sistema de caché.
 * Proporciona wrappers tipados sobre Redis para simplificar la serialización/deserialización
 * de datos complejos y la gestión de su Ciclo de Vida (TTL).
 */

import { redis } from "./redis.js"

/** Tiempo de vida por defecto: 5 minutos */
const DEFAULT_TTL_SECONDS = 300

/** Tipado para asegurar que los datos guardados en caché sean serializables a JSON */
type Serializable =
  | Record<string, unknown>
  | Array<unknown>
  | string
  | number
  | boolean
  | null

/**
 * Obtiene un objeto tipado desde la caché de Redis.
 *
 * @param key - Clave única del recurso.
 * @returns El objeto deserializado o null si hubo un fallo o miss.
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  const raw = await redis.get(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    // Si el contenido corrupto no es JSON, invalidamos silenciosamente
    // para que la lógica de aplicación regenere el recurso.
    return null
  }
}

/**
 * Persiste un objeto en la caché con un límite de tiempo.
 *
 * @param key - Clave única del recurso.
 * @param value - Datos a serializar.
 * @param ttlSeconds - Tiempo de expiración (por defecto 300s).
 */
export const setCache = async <T extends Serializable>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
) => {
  const payload = JSON.stringify(value)
  if (ttlSeconds > 0) {
    await redis.set(key, payload, "EX", ttlSeconds)
  } else {
    await redis.set(key, payload)
  }
}

/**
 * Elimina de forma atómica múltiples claves de la caché.
 */
export const invalidateKeys = async (keys: string[]) => {
  if (!keys.length) return
  await redis.del(...keys)
}

export { redis }
