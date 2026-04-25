/**
 * @file rbac.middleware.ts
 * @description Capa de autorización basada en roles (RBAC) y membresías.
 * Implementa una estrategia de autorización de alto rendimiento utilizando Redis como
 * caché de segundo nivel para roles y niveles de suscripción, minimizando la carga
 * sobre la base de datos principal y permitiendo cambios de permisos casi instantáneos.
 */

import { Response, NextFunction, Request } from "express"
import { tienePermiso, Permiso } from "../config/permisos.js"
import { ForbiddenError } from "../errors/AppErrors.js"
import { prisma } from "../lib/prisma.js"
import { redis } from "../config/redis.js"

// Configuración de la caché de autorización (2 minutos de persistencia)
const TTL_AUTORIZACION = 120

/**
 * Recupera el rol y la membresía del usuario, priorizando el almacenamiento en Redis.
 * En caso de cache-miss, consulta la base de datos y repuebla la caché.
 *
 * @param userId - Identificador único del usuario.
 * @returns Objeto con el rol técnico y el nivel de membresía.
 */
const obtenerRolYMembresia = async (
  userId: number
): Promise<{ role: string; membresia: string }> => {
  const rolKey = `rol:${userId}`
  const membresiaKey = `membresia:${userId}`

  try {
    // Intento de recuperación paralela desde caché
    const [cachedRol, cachedMembresia] = await Promise.all([
      redis.get(rolKey),
      redis.get(membresiaKey),
    ])

    if (cachedRol && cachedMembresia) {
      return { role: cachedRol, membresia: cachedMembresia }
    }

    // Fallback a base de datos si la caché ha expirado o está vacía
    const usuario = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true, membership: true },
    })

    const role = usuario?.role ?? "user"
    const membresia = usuario?.membership ?? "free"

    // Repoblación de caché con expiración corta (2 min)
    await Promise.all([
      redis.setex(rolKey, TTL_AUTORIZACION, role),
      redis.setex(membresiaKey, TTL_AUTORIZACION, membresia),
    ])

    return { role, membresia }
  } catch {
    // Resiliencia: Si Redis no está disponible, operamos directamente contra DB
    const usuario = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true, membership: true },
    })
    return {
      role: usuario?.role ?? "user",
      membresia: usuario?.membership ?? "free",
    }
  }
}

/**
 * Elimina la caché de rol del usuario.
 * Debe invocarse tras una reasignación administrativa de privilegios.
 */
export const invalidarCacheRol = async (userId: number) => {
  await redis.del(`rol:${userId}`)
}

/**
 * Elimina la caché de membresía del usuario.
 * Debe invocarse tras un cambio en el plan de suscripción o pago.
 */
export const invalidarCacheMembresia = async (userId: number) => {
  await redis.del(`membresia:${userId}`)
}

/** Realiza una invalidación completa del estado de autorización del usuario */
export const invalidarCacheUsuario = async (userId: number) => {
  await Promise.all([
    redis.del(`rol:${userId}`),
    redis.del(`membresia:${userId}`),
  ])
}

/**
 * Middleware: Verificación de Permiso Atómico.
 * Comprueba si el rol y la membresía actual permiten realizar una acción específica.
 *
 * @param permiso - Identificador del permiso requerido (ej: 'POST_REVIEWS').
 */
export const verificarPermiso = (permiso: Permiso) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.user!
      const { role, membresia } = await obtenerRolYMembresia(user_id)

      if (!tienePermiso(role, permiso, membresia)) {
        throw new ForbiddenError(
          "Permisos insuficientes: Su rol o nivel de membresía no autorizan esta operación"
        )
      }

      // Enriquecimiento del objeto user para la capa de controladores
      req.user!.role = role as "admin" | "editor" | "user"
      req.user!.membership = membresia

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware: Verificación por Rol Directo.
 * Permite el acceso únicamente si el usuario ostenta uno de los roles autorizados.
 */
export const verificarRol = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.user!
      const { role } = await obtenerRolYMembresia(user_id)

      if (!roles.includes(role)) {
        return next(
          new ForbiddenError(
            "Acceso restringido: Esta sección requiere un rol de mayor jerarquía"
          )
        )
      }

      req.user!.role = role as "admin" | "editor" | "user"
      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware: Política de Propietario o Permiso Administrativo (Híbrido).
 * Autoriza si el usuario es el dueño del recurso solicitado O si posee
 * un permiso administrativo de supervisión/edición ajena.
 *
 * @param permiso - Permiso necesario para usuarios que no son dueños.
 * @param obtenerOwnerIdFn - Función asíncrona que determina el ID del dueño del recurso.
 */
export const verificarPropietarioOPermiso = (
  permiso: Permiso,
  obtenerOwnerIdFn: (req: Request) => Promise<number | null>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.user!

      // Verificación de propiedad (Ownership)
      const ownerId = await obtenerOwnerIdFn(req)
      if (ownerId === user_id) return next()

      // Verificación subsidiaria por privilegios administrativos si no es el dueño
      const { role, membresia } = await obtenerRolYMembresia(user_id)

      if (!tienePermiso(role, permiso, membresia)) {
        throw new ForbiddenError(
          "Conflicto de propiedad: No es el dueño del recurso ni posee facultades administrativas"
        )
      }

      req.user!.role = role as "admin" | "editor" | "user"
      req.user!.membership = membresia
      next()
    } catch (error) {
      next(error)
    }
  }
}
