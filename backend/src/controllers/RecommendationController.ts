/**
 * @file RecommendationController.ts
 * @description Controlador para el motor de recomendaciones.
 * Gestiona el flujo de entrada para las sugerencias de películas y directores.
 */

import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
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

  const { items, total, has_more } =
    await RecommendationService.getPersonalizedFeed(viewerId, page, limit)

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

/**
 * Obtiene la única película recomendada para "Esta Noche"
 */
export const getTonight = async (req: Request, res: Response) => {
  const viewerId = req.user!.user_id
  const localHour = toNumber(req.query.hour, new Date().getHours())
  const weather =
    typeof req.query.weather === "string" ? req.query.weather : "clear"

  const item = await RecommendationService.getTonightMovie(
    viewerId,
    localHour,
    weather
  )

  res.json(item)
}

/**
 * Verifica si el usuario necesita onboarding
 */
export const checkStatus = async (req: Request, res: Response) => {
  const viewerId = req.user!.user_id
  const profile = await prisma.user_taste_profiles.findUnique({
    where: { user_id: viewerId },
  })

  res.json({ needs_onboarding: !profile })
}

/**
 * Obtiene la siguiente película para el onboarding
 */
export const getOnboarding = async (req: Request, res: Response) => {
  const viewerId = req.user!.user_id
  const step = toNumber(req.query.step, 0)
  const seedId = req.query.seedId ? toNumber(req.query.seedId, 0) : undefined

  const data = await RecommendationService.getOnboardingMovies(
    viewerId,
    step,
    seedId
  )
  res.json(data)
}

/**
 * Registra una interacción (Like/Dislike)
 */
export const postInteraction = async (req: Request, res: Response) => {
  const viewerId = req.user!.user_id
  const { movieId, type, metadata } = req.body

  if (!movieId || !type) {
    return res.status(400).json({ error: "movieId y type son requeridos" })
  }

  const result = await RecommendationService.saveExplicitInteraction(
    viewerId,
    movieId,
    type,
    metadata
  )
  res.json(result)
}
