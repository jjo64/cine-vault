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

  console.log(`[RecommendationController] getForYou para usuario ${viewerId} (Página: ${page})`)

  try {
    const { items, total, has_more } =
      await RecommendationService.getPersonalizedFeed(viewerId, page, limit)

    res.json({
      page,
      limit,
      total,
      has_more,
      items,
    })
  } catch (error) {
    console.error(`[RecommendationController] Error en getForYou para usuario ${viewerId}:`, error)
    throw error
  }
}

/**
 * Sugiere directores basados en el perfil del usuario.
 */
export const getSuggestedDirectors = async (req: Request, res: Response) => {
  const viewerId = req.user!.user_id
  const queryUserId = toNumber(req.query.userId, viewerId)

  // Si no se pasa userId, usamos el del usuario autenticado
  const targetUserId = Number.isFinite(queryUserId) ? queryUserId : viewerId

  console.log(`[RecommendationController] getSuggestedDirectors para usuario ${targetUserId}`)
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

  console.log(`[RecommendationController] getTonight para usuario ${viewerId} (Clima: ${weather}, Hora: ${localHour})`)

  try {
    const item = await RecommendationService.getTonightMovie(
      viewerId,
      localHour,
      weather
    )
    res.json(item)
  } catch (error) {
    console.error(`[RecommendationController] Error en getTonight para usuario ${viewerId}:`, error)
    throw error
  }
}

/**
 * Verifica si el usuario necesita onboarding
 */
export const checkStatus = async (req: Request, res: Response) => {
  const viewerId = req.user!.user_id
  console.log(`[RecommendationController] checkStatus para usuario ${viewerId}`)
  
  try {
    const [
      profile,
      user,
      diaryCount,
      watchlistCount,
      vaultCount,
      reviewCount,
      listCount,
      onboardingInteractionsCount,
    ] = await Promise.all([
      prisma.user_taste_profiles.findUnique({ where: { user_id: viewerId } }),
      prisma.users.findUnique({
        where: { id: viewerId },
        select: { created_at: true },
      }),
      prisma.diary_entries.count({ where: { user_id: viewerId } }),
      prisma.watchlist.count({ where: { user_id: viewerId } }),
      prisma.vault.count({ where: { user_id: viewerId } }),
      prisma.reviews.count({ where: { user_id: viewerId } }),
      prisma.user_lists.count({ where: { user_id: viewerId } }),
      prisma.explicit_interactions.count({
        where: {
          user_id: viewerId,
          interaction_type: { in: ["like_onboarding", "skip_onboarding"] },
        },
      }),
    ])

    const footprintCount =
      diaryCount + watchlistCount + vaultCount + reviewCount + listCount

    const createdAt = user?.created_at
    const accountAgeHours = createdAt
      ? (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
      : Number.POSITIVE_INFINITY

    // El onboarding es requerido si la cuenta es nueva, no tiene huella previa,
    // y no ha realizado al menos 3 valoraciones en el onboarding.
    const needsOnboarding =
      onboardingInteractionsCount < 3 &&
      footprintCount === 0 &&
      accountAgeHours <= 72

    res.json({ needs_onboarding: needsOnboarding })
  } catch (error) {
    console.error(`[RecommendationController] Error en checkStatus para usuario ${viewerId}:`, error)
    throw error
  }
}

/**
 * Obtiene la siguiente película para el onboarding
 */
export const getOnboarding = async (req: Request, res: Response) => {
  const viewerId = req.user!.user_id
  const step = toNumber(req.query.step, 0)
  const seedId = req.query.seedId ? toNumber(req.query.seedId, 0) : undefined

  console.log(`[RecommendationController] getOnboarding para usuario ${viewerId} (Step: ${step})`)

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
  const normalizedMovieId = Number(movieId)

  if (!Number.isFinite(normalizedMovieId) || !type) {
    return res.status(400).json({ error: "movieId y type son requeridos" })
  }

  console.log(`[RecommendationController] postInteraction para usuario ${viewerId} (Tipo: ${type}, Movie: ${movieId})`)

  const result = await RecommendationService.saveExplicitInteraction(
    viewerId,
    normalizedMovieId,
    type,
    metadata
  )
  res.json(result)
}

export const completeRecommendation = async (req: Request, res: Response) => {
  const viewerId = req.user!.user_id
  const result = await RecommendationService.completeRecommendationService(
    viewerId,
    req.body
  )
  res.json(result)
}
