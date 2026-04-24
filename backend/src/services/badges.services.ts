/**
 * @file badges.services.ts
 * @description Motor de gamificación de CineVault.
 * Gestiona el otorgamiento de insignias basado en el comportamiento del usuario
 * y la evaluación de criterios automáticos.
 */

import { prisma } from "../lib/prisma.js"
import { Prisma } from "@prisma/client"

/**
 * Vincula una insignia específica a un usuario.
 * Maneja silenciosamente si el usuario ya posee la insignia (Race Condition Safe).
 * 
 * @param userId - ID del usuario.
 * @param badgeId - ID de la insignia.
 */
export const awardBadge = async (userId: number, badgeId: number) => {
  try {
    await prisma.user_badges.create({
      data: {
        user_id: userId,
        badge_id: badgeId
      }
    })
    console.log(`[Gamificación] Usuario ${userId} ha ganado la insignia ${badgeId}`)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // El usuario ya tiene la insignia, ignoramos.
      return
    }
    throw error
  }
}

/**
 * Analiza el historial del usuario contra los criterios de insignias automáticas.
 * Otorga las insignias que el usuario haya calificado pero que aún no posea.
 * 
 * @param userId - ID del usuario a evaluar.
 */
export const checkAndAwardAutomaticBadges = async (userId: number) => {
  // 1. Obtener insignias que el usuario NO tiene
  const earnedBadgeIds = (await prisma.user_badges.findMany({
    where: { user_id: userId },
    select: { badge_id: true }
  })).map(ub => ub.badge_id)

  const availableBadges = await prisma.badges.findMany({
    where: { 
      id: { notIn: earnedBadgeIds },
      criteria: { not: null }
    }
  })

  if (availableBadges.length === 0) return

  // 2. Cache de estadísticas básicas para evitar múltiples queries
  const stats = {
    diaryCount: await prisma.diary_entries.count({ where: { user_id: userId } }),
    reviewsCount: await prisma.reviews.count({ where: { user_id: userId } }),
    criticalReviewsCount: await prisma.reviews.count({ 
      where: { user_id: userId, mode: "CRITICO" } 
    }),
    tvDiaryCount: await prisma.diary_entries.count({ 
      where: { user_id: userId, media_type: "tv" } 
    })
  }

  // 3. Evaluación de criterios
  for (const badge of availableBadges) {
    const criteria = badge.criteria || ""
    const [type, valueStr] = criteria.split(":")
    const threshold = parseInt(valueStr, 10)

    let qualifies = false

    switch (type) {
      case "DIARY_COUNT":
        qualifies = stats.diaryCount >= threshold
        break
      case "REVIEWS_COUNT":
        qualifies = stats.reviewsCount >= threshold
        break
      case "CRITICAL_REVIEWS":
        qualifies = stats.criticalReviewsCount >= threshold
        break
      case "TV_COUNT":
        qualifies = stats.tvDiaryCount >= threshold
        break
    }

    if (qualifies) {
      await awardBadge(userId, badge.id)
    }
  }
}

/**
 * Recupera el listado de insignias obtenidas por un usuario.
 */
export const getUserBadgesService = async (userId: number) => {
  return prisma.user_badges.findMany({
    where: { user_id: userId },
    include: {
      badges: true
    },
    orderBy: { unlocked_at: "desc" }
  })
}
