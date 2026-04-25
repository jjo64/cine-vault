/**
 * @file activity.services.ts
 * @description Capa de servicios para la gestión de actividad social en CineVault.
 * Implementa la lógica de filtrado por seguidores, consolidación de eventos
 * de múltiples fuentes y formateo de respuesta para el feed.
 */

import { prisma } from "../lib/prisma.js"

/**
 * Kind descriptivos de los eventos que pueden aparecer en el feed.
 */
export type ActivityKind =
  | "review_published"
  | "diary_entry"
  | "vault_added"
  | "watchlist_added"
  | "review_liked"
  | "follow"

/**
 * Estructura de un evento de actividad normalizado.
 */
export type ActivityEvent = {
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

/**
 * Parámetros para la consulta del feed social.
 */
export interface FeedParams {
  viewerId: number
  type: "friends" | "own" | string
  page: number
  limit: number
}

/**
 * Obtiene el feed de actividad social consolidado.
 * @param params Parámetros de consulta y paginación.
 */
export const getSocialFeed = async ({
  viewerId,
  type,
  page,
  limit,
}: FeedParams) => {
  // 1. Determinar los usuarios de interés (seguidos o uno mismo)
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

  if (sourceUserIds.length === 0 && type !== "own") {
    return {
      items: [],
      total: 0,
      has_more: false,
    }
  }

  // Si es "own" y no hay resultados, o si es "friends" y no sigue a nadie, 
  // permitimos que el flujo continúe pero sourceUserIds podría estar vacío.
  // Sin embargo, si es amigos y no sigue a nadie, devolvemos vacío directamente.
  if (type === "friends" && followingIds.length === 0) {
    return { items: [], total: 0, has_more: false }
  }

  // 2. Recuperar eventos de múltiples fuentes en paralelo
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

  // 3. Normalizar y mezclar eventos
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

  // 4. Ordenar y paginar
  events.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))

  const start = (page - 1) * limit
  const paginatedItems = events.slice(start, start + limit)

  return {
    items: paginatedItems,
    total: events.length,
    has_more: start + limit < events.length,
  }
}
