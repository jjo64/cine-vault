/**
 * @file RecommendationController.ts
 * @description Controlador para el motor de recomendaciones.
 * Gestiona el flujo de entrada para las sugerencias de películas y directores.
 */

import { Request, Response } from "express"
import * as RecommendationService from "../services/recommendation.services.js"

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Obtiene el flujo de recomendaciones "Para Ti".
 */
export const getForYou = async (req: Request, res: Response) => {
  const viewerId = req.user!.user_id
  const page = Math.max(1, toNumber(req.query.page, 1))
  const limit = Math.min(50, Math.max(1, toNumber(req.query.limit, 20)))

  const { items, total, has_more } = await RecommendationService.getPersonalizedFeed(
    viewerId,
    page,
    limit
  )

  res.json({
    page,
    limit,
    total,
    has_more,
    items,
  })
}

/**
 * Sugiere directores basados en el perfil del usuario.
 */
export const getSuggestedDirectors = async (req: Request, res: Response) => {
  const viewerId = req.user!.user_id
  const queryUserId = toNumber(req.query.userId, viewerId)
  
  // Si no se pasa userId, usamos el del usuario autenticado
  const targetUserId = Number.isFinite(queryUserId) ? queryUserId : viewerId

  const items = await RecommendationService.getSuggestedDirectors(targetUserId)

  res.json({ items })
}
