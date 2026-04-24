/**
 * @file feed.services.ts
 * @description Capa de servicios para el motor del Feed Social de CineVault.
 * Orquestas la agregación de actividad entre amigos (reseñas, bóvedas, watchlists), 
 * gestiona las interacciones de usuario (likes, marcadores, ocultación) y provee 
 * una respuesta paginada y enriquecida para la interfaz.
 */

import { NotFoundError, ValidationError } from "../errors/AppErrors.js"
import { feedRepository } from "../repositories/FeedRepository.js"
import {
  FeedActionDTO,
  FeedBookmarkActionDTO,
  FeedHideActionDTO,
  FeedLikeActionDTO,
  FeedQueryDTO,
  FeedShareActionDTO,
} from "../schemas/feed.js"

// --- Tipos de Datos de Soporte ---

/**
 * Tipos de elementos que pueden aparecer y ser gestionados en el feed social.
 */
type FeedItemType =
  | "review"
  | "vault"
  | "watchlist"
  | "discovery"
  | "tonight"
  | "list"
  | "quote"

// --- Funciones de Utilidad Interna ---

/**
 * Procesa la referencia de un ítem (ej. 'review-123') para extraer su tipo e ID único.
 * Soporta retrocompatibilidad con campos separados.
 */
const parseFeedItemRef = (
  payload: FeedActionDTO
): { itemType: FeedItemType; itemId: number } => {
  if (payload.item_ref) {
    const [rawType, rawId] = payload.item_ref.split("-")
    const itemType = rawType as FeedItemType
    const itemId = Number(rawId)

    if (!rawType || !Number.isInteger(itemId) || itemId <= 0) {
      throw new ValidationError("item_ref inválido")
    }

    return { itemType, itemId }
  }

  if (!payload.item_type || !payload.item_id) {
    throw new ValidationError("Debe enviar item_ref o item_type + item_id")
  }

  return {
    itemType: payload.item_type,
    itemId: payload.item_id,
  }
}

// --- Servicios Principales ---

/**
 * Recupera el feed de actividad de los amigos/seguidos del usuario actual.
 * Realiza una agregación polimórfica de diferentes tipos de actividad y aplica filtros de visibilidad.
 */
export const getFriendsFeedService = async (
  viewerId: number,
  query: FeedQueryDTO
) => {
  const page = Math.max(1, Number(query.page || 1))
  const limit = Math.min(30, Math.max(1, Number(query.limit || 10)))

  // 1. Obtener los IDs de los usuarios seguidos
  const sourceUserIds = await feedRepository.listSourceUserIds(viewerId)
  
  // 2. Recuperar registros de actividad crudos de diversas fuentes
  const { reviews, vaultEntries, watchlistEntries } =
    await feedRepository.listFeedRows(sourceUserIds)

  // 3. Preparar referencias para verificar estados de interacción (likes, bookmarks, etc)
  const refs: Array<{ item_type: FeedItemType; item_id: number }> = [
    ...reviews.map((entry) => ({
      item_type: "review" as const,
      item_id: entry.id,
    })),
    ...vaultEntries.map((entry) => ({
      item_type: "vault" as const,
      item_id: entry.id,
    })),
    ...watchlistEntries.map((entry) => ({
      item_type: "watchlist" as const,
      item_id: entry.id,
    })),
  ]

  // 4. Consultar estados de interacción del visor actual en paralelo para mejorar rendimiento
  const [likedReviewIds, bookmarkedRefs, hiddenRefs] = await Promise.all([
    feedRepository.listLikedReviewIds(
      viewerId,
      reviews.map((entry) => entry.id)
    ),
    feedRepository.listBookmarkedRefs(viewerId, refs),
    feedRepository.listHiddenRefs(viewerId, refs),
  ])

  const likedSet = new Set(likedReviewIds)
  const bookmarkSet = new Set(
    bookmarkedRefs.map((item) => `${item.item_type}-${item.item_id}`)
  )
  const hiddenSet = new Set(
    hiddenRefs.map((item) => `${item.item_type}-${item.item_id}`)
  )

  // 5. Normalizar y mezclar todos los ítems en una estructura única de feed
  const items = [
    ...reviews.map((entry) => ({
      id: `review-${entry.id}`,
      type: "review",
      created_at: entry.created_at.toISOString(),
      liked: likedSet.has(entry.id),
      bookmarked: bookmarkSet.has(`review-${entry.id}`),
      hidden: hiddenSet.has(`review-${entry.id}`),
      user: {
        id: entry.users.id,
        username: entry.users.username,
        avatar_url: entry.users.avatar_url || null,
      },
      movie: {
        id: entry.movies_ref.id,
        tmdb_id: entry.movies_ref.tmdb_id,
        media_type: entry.movies_ref.media_type,
      },
      review: {
        id: entry.id,
        content: entry.content,
        rating: entry.rating ? Number(entry.rating) : null,
        mode: entry.mode,
        likes: entry.likes || 0,
      },
    })),
    ...vaultEntries.map((entry) => ({
      id: `vault-${entry.id}`,
      type: "vault",
      created_at: entry.added_at.toISOString(),
      liked: false,
      bookmarked: bookmarkSet.has(`vault-${entry.id}`),
      hidden: hiddenSet.has(`vault-${entry.id}`),
      user: {
        id: entry.users.id,
        username: entry.users.username,
        avatar_url: entry.users.avatar_url || null,
      },
      movie: {
        id: entry.movies_ref.id,
        tmdb_id: entry.movies_ref.tmdb_id,
        media_type: entry.movies_ref.media_type,
      },
    })),
    ...watchlistEntries.map((entry) => ({
      id: `watchlist-${entry.id}`,
      type: "watchlist",
      created_at: entry.added_at.toISOString(),
      liked: false,
      bookmarked: bookmarkSet.has(`watchlist-${entry.id}`),
      hidden: hiddenSet.has(`watchlist-${entry.id}`),
      user: {
        id: entry.users.id,
        username: entry.users.username,
        avatar_url: entry.users.avatar_url || null,
      },
      movie: {
        id: entry.movies_ref.id,
        tmdb_id: entry.movies_ref.tmdb_id,
        media_type: entry.movies_ref.media_type,
      },
    })),
  ]
    .filter((item) => !item.hidden) // Filtrar ítems ocultados por el usuario
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)) // Orden cronológico descendente

  const start = (page - 1) * limit
  const paginated = items.slice(start, start + limit)

  return {
    page,
    limit,
    total: items.length,
    has_more: start + limit < items.length,
    items: paginated,
  }
}

/**
 * Registra o elimina un "Like" sobre una reseña del feed.
 */
export const setFeedLikeService = async (
  viewerId: number,
  payload: FeedLikeActionDTO
) => {
  const { itemType, itemId } = parseFeedItemRef(payload)

  if (itemType !== "review") {
    throw new ValidationError("Solo los items de tipo review soportan like")
  }

  const exists = await feedRepository.existsReview(itemId)
  if (!exists) throw new NotFoundError("Review no encontrada")

  const likes = await feedRepository.setReviewLike(
    viewerId,
    itemId,
    payload.active
  )

  return {
    item_ref: `${itemType}-${itemId}`,
    active: payload.active,
    likes,
  }
}

/**
 * Marca o desmarca un ítem del feed como "Guardado" (Marcador).
 */
export const setFeedBookmarkService = async (
  viewerId: number,
  payload: FeedBookmarkActionDTO
) => {
  const { itemType, itemId } = parseFeedItemRef(payload)

  await feedRepository.setBookmark(viewerId, itemType, itemId, payload.active)

  return {
    item_ref: `${itemType}-${itemId}`,
    active: payload.active,
  }
}

/**
 * Oculta un ítem del feed para el usuario actual.
 */
export const setFeedHideService = async (
  viewerId: number,
  payload: FeedHideActionDTO
) => {
  const { itemType, itemId } = parseFeedItemRef(payload)

  await feedRepository.setHidden(viewerId, itemType, itemId, payload.active)

  return {
    item_ref: `${itemType}-${itemId}`,
    active: payload.active,
  }
}

/**
 * Registra eventos de compartición externa de ítems del feed para analítica.
 */
export const trackFeedShareService = async (
  viewerId: number,
  payload: FeedShareActionDTO
) => {
  const { itemType, itemId } = parseFeedItemRef(payload)

  await feedRepository.createShareEvent(
    viewerId,
    itemType,
    itemId,
    payload.channel
  )

  return {
    item_ref: `${itemType}-${itemId}`,
    tracked: true,
  }
}
