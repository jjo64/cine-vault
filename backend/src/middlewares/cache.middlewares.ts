/**
 * @file cache.middlewares.ts
 * @description Capa de persistencia temporal (Caché) para respuestas de la API.
 * Implementa un patrón de interceptación sobre el método nativo de respuesta de Express,
 * permitiendo almacenar flujos de datos JSON en Redis de forma transparente para
 * los controladores, optimizando drásticamente los tiempos de respuesta subsiguientes.
 */

import { Response, NextFunction } from "express"
import { redis } from "../config/redis.js"
import { SolicitudAutenticada } from "./auth.middlewares.js"

/**
 * Fábrica de middlewares para la gestión de caché de alto rendimiento.
 *
 * Funcionalidad:
 * 1. Genera una clave única basada en la lógica de la función 'keyFn'.
 * 2. Si la clave existe en Redis, intercepta la petición y devuelve el JSON inmediatamente.
 * 3. Si no existe, envuelve la función 'res.json' para capturar y cachear la respuesta
 *    exitosa antes de enviarla al cliente.
 *
 * @param ttl - Tiempo de vida de la entrada en caché (en segundos).
 * @param keyFn - Función que transforma la petición en una clave de base de datos (string).
 * @returns Middleware compatible con Express.
 */
export const cachear = (
  ttl: number,
  keyFn: (req: SolicitudAutenticada) => string
) => {
  return async (
    req: SolicitudAutenticada,
    res: Response,
    next: NextFunction
  ) => {
    const key = keyFn(req)

    try {
      /** Intento de recuperación desde memoria persistente */
      const cached = await redis.get(key)
      if (cached) {
        // Cache Hit: Respuesta inmediata sin ejecución de controladores
        return res.json(JSON.parse(cached))
      }

      /**
       * Cache Miss: Interceptamos res.json
       * Aplicamos el patrón Proxy/Wrapper sobre el método original.
       */
      const jsonOriginal = res.json.bind(res)

      res.json = (body) => {
        // Política de guardado: Solo persistimos respuestas con estados exitosos (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis
            .setex(key, ttl, JSON.stringify(body))
            .catch((err) =>
              console.error(
                "[CINEVAULT:REDIS] Error al persistir respuesta en caché:",
                err
              )
            )
        }
        return jsonOriginal(body)
      }

      next()
    } catch (err) {
      /**
       * Tolerancia a fallos:
       * Si el servidor de Redis presenta latencia o falla, la aplicación
       * continúa operando normalmente (bypass de caché).
       */
      console.error(
        "[CINEVAULT:CACHE] Error crítico en middleware de recuperación:",
        err
      )
      next()
    }
  }
}
