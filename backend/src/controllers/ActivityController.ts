/**
 * @file ActivityController.ts
 * @description Controlador para el sistema de actividad social.
 * Orquesta la entrada de peticiones HTTP hacia los servicios de actividad
 * y devuelve respuestas estandarizadas.
 */

import { Response, Request } from "express"
import * as ActivityService from "../services/activity.services.js"

/**
 * Obtiene el feed de actividad para el usuario autenticado.
 * Filtra por seguidos (friends) o actividad propia (own).
 */
export const getFeed = async (req: Request, res: Response) => {
  const viewerId = req.user!.user_id
  const type = String(req.query.type || "friends").toLowerCase()

  // Normalización de paginación
  const page = Math.max(1, Number(req.query.page || 1))
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)))

  const { items, total, has_more } = await ActivityService.getSocialFeed({
    viewerId,
    type,
    page,
    limit,
  })

  res.json({
    page,
    limit,
    total,
    has_more,
    items,
  })
}
