/**
 * @file activity.routes.ts
 * @description Definición de rutas para el sistema de Actividad y Social Feed.
 * Permite a los usuarios visualizar un flujo de eventos (reseñas, entradas de diario, 
 * adiciones al vault) de sus amigos o de su propia actividad.
 * 
 * @note Este archivo contiene actualmente lógica de negocio pesada que será 
 * delegada a un servicio dedicado en la Fase 5 para cumplir con SOLID.
 */

import { Router } from "express"
import { prisma } from "../lib/prisma.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

/**
 * Kind descriptivos de los eventos que pueden aparecer en el feed.
 */
type ActivityKind =
  | "review_published"
  | "diary_entry"
  | "vault_added"
  | "watchlist_added"
  | "review_liked"
  | "follow"

/**
 * Estructura de un evento de actividad para el frontend.
 */
type ActivityEvent = {
  id: string
  type: ActivityKind
  created_at: string
  user: {
    id: number
    username: string
    avatar_url: string | null
  }
  movie?: {
    id: number
    tmdb_id: number
  }
  review?: {
    id: number
    content: string | null
    rating: number | null
  }
  target_user?: {
    id: number
    username: string
    avatar_url: string | null
  }
}

const router = Router()

/**
 * Helper para normalización de valores numéricos en query strings.
 */
const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

/**
 * @swagger
 * /activity/feed:
 *   get:
 *     summary: Obtener el feed de actividad social
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/feed",
  middlewareAutenticacion,
  manejadorAsincrono(async (req, res) => {
    const viewerId = req.user!.user_id
    const type = String(req.query.type || "friends").toLowerCase()
    const page = Math.max(1, toNumber(req.query.page, 1))
    const limit = Math.min(50, Math.max(1, toNumber(req.query.limit, 20)))

    // --- Lógica de recuperación (Será movida a ActivityService en Fase 5) ---

    const followingIds =
      type === "friends"
        ? (
            await prisma.follows.findMany({
              where: { follower_id: viewerId },
              select: { following_id: true },
            })
          ).map((item) => item.following_id)
        : []

    const sourceUserIds =
      type === "own" ? [viewerId] : followingIds.length > 0 ? followingIds : []

    if (sourceUserIds.length === 0) {
      return res.json({
        page,
        limit,
        total: 0,
        has_more: false,
        items: [] as ActivityEvent[],
      })
    }

    const [
      reviews,
      diaryEntries,
      vaultEntries,
      watchlistEntries,
      likes,
      followsNotifications,
    ] = await Promise.all([
      prisma.reviews.findMany({
        where: { user_id: { in: sourceUserIds } },
        take: 100,
        orderBy: { created_at: "desc" },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true } },
        },
      }),
      prisma.diary_entries.findMany({
        where: { user_id: { in: sourceUserIds } },
        take: 100,
        orderBy: { id: "desc" },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true } },
        },
      }),
      prisma.vault.findMany({
        where: { user_id: { in: sourceUserIds } },
        take: 100,
        orderBy: { added_at: "desc" },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true } },
        },
      }),
      prisma.watchlist.findMany({
        where: { user_id: { in: sourceUserIds } },
        take: 100,
        orderBy: { added_at: "desc" },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true } },
        },
      }),
      prisma.review_likes.findMany({
        where: { user_id: { in: sourceUserIds } },
        take: 100,
        orderBy: { created_at: "desc" },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          reviews: {
            select: {
              id: true,
              content: true,
              rating: true,
              movies_ref: { select: { id: true, tmdb_id: true } },
            },
          },
        },
      }),
      prisma.notifications.findMany({
        where: {
          type: "follow",
          sender_id: { in: sourceUserIds },
        },
        take: 100,
        orderBy: { created_at: "desc" },
        include: {
          sender: { select: { id: true, username: true, avatar_url: true } },
          receiver: { select: { id: true, username: true, avatar_url: true } },
        },
      }),
    ])

    const events: ActivityEvent[] = [
      ...reviews.map((entry) => ({
        id: `review-${entry.id}`,
        type: "review_published" as const,
        created_at: entry.created_at.toISOString(),
        user: {
          id: entry.users.id,
          username: entry.users.username,
          avatar_url: entry.users.avatar_url || null,
        },
        movie: {
          id: entry.movies_ref.id,
          tmdb_id: entry.movies_ref.tmdb_id,
        },
        review: {
          id: entry.id,
          content: entry.content,
          rating: entry.rating ? Number(entry.rating) : null,
        },
      })),
      ...diaryEntries.map((entry) => ({
        id: `diary-${entry.id}`,
        type: "diary_entry" as const,
        created_at: (entry.watched_date || new Date()).toISOString(),
        user: {
          id: entry.users.id,
          username: entry.users.username,
          avatar_url: entry.users.avatar_url || null,
        },
        movie: {
          id: entry.movies_ref.id,
          tmdb_id: entry.movies_ref.tmdb_id,
        },
      })),
      ...vaultEntries.map((entry) => ({
        id: `vault-${entry.id}`,
        type: "vault_added" as const,
        created_at: entry.added_at.toISOString(),
        user: {
          id: entry.users.id,
          username: entry.users.username,
          avatar_url: entry.users.avatar_url || null,
        },
        movie: {
          id: entry.movies_ref.id,
          tmdb_id: entry.movies_ref.tmdb_id,
        },
      })),
      ...watchlistEntries.map((entry) => ({
        id: `watchlist-${entry.id}`,
        type: "watchlist_added" as const,
        created_at: entry.added_at.toISOString(),
        user: {
          id: entry.users.id,
          username: entry.users.username,
          avatar_url: entry.users.avatar_url || null,
        },
        movie: {
          id: entry.movies_ref.id,
          tmdb_id: entry.movies_ref.tmdb_id,
        },
      })),
      ...likes.map((entry) => ({
        id: `like-${entry.id}`,
        type: "review_liked" as const,
        created_at: (entry.created_at || new Date()).toISOString(),
        user: {
          id: entry.users.id,
          username: entry.users.username,
          avatar_url: entry.users.avatar_url || null,
        },
        movie: entry.reviews.movies_ref
          ? {
              id: entry.reviews.movies_ref.id,
              tmdb_id: entry.reviews.movies_ref.tmdb_id,
            }
          : undefined,
        review: {
          id: entry.reviews.id,
          content: entry.reviews.content,
          rating: entry.reviews.rating ? Number(entry.reviews.rating) : null,
        },
      })),
      ...followsNotifications.map((entry) => ({
        id: `follow-${entry.id}`,
        type: "follow" as const,
        created_at: entry.created_at.toISOString(),
        user: {
          id: entry.sender?.id || 0,
          username: entry.sender?.username || "usuario",
          avatar_url: entry.sender?.avatar_url || null,
        },
        target_user: entry.receiver
          ? {
              id: entry.receiver.id,
              username: entry.receiver.username,
              avatar_url: entry.receiver.avatar_url || null,
            }
          : undefined,
      })),
    ]

    events.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))

    const start = (page - 1) * limit
    const paginated = events.slice(start, start + limit)

    res.json({
      page,
      limit,
      total: events.length,
      has_more: start + limit < events.length,
      items: paginated,
    })
  })
)

export default router
