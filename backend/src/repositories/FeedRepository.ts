/**
 * @file FeedRepository.ts
 * @description Repositorio encargado de la orquestación recursiva del Feed social. 
 * Recupera actividades de usuarios seguidos (reseñas, bóveda, watchlist) y gestiona interacciones 
 * sociales como "likes", "bookmarks" y eventos de compartir.
 */

import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

/**
 * Tipos de actividades que pueden aparecer en el Feed.
 */
type FeedItemType =
  | "review"
  | "vault"
  | "watchlist"
  | "discovery"
  | "tonight"
  | "list"
  | "quote"

/**
 * Clase FeedRepository
 * Gestiona la agregación de eventos sociales para construir la línea de tiempo del usuario.
 */
export class FeedRepository {
  /**
   * Obtiene la lista de IDs de usuarios que el espectador sigue, incluyendo el suyo propio.
   * @param viewerId - ID del usuario que solicita el feed.
   */
  async listSourceUserIds(viewerId: number) {
    const following = await prisma.follows.findMany({
      where: { follower_id: viewerId },
      select: { following_id: true },
    })

    return [viewerId, ...following.map((entry) => entry.following_id)]
  }

  /**
   * Recupera las filas crudas de diversas tablas de actividad para los usuarios origen.
   * Limitado a 160 entradas por tipo para optimizar rendimiento previo al filtrado de negocio.
   */
  async listFeedRows(sourceUserIds: number[]) {
    const [reviews, vaultEntries, watchlistEntries] = await Promise.all([
      prisma.reviews.findMany({
        where: { user_id: { in: sourceUserIds } },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true } },
        },
        take: 160,
        orderBy: { created_at: "desc" },
      }),
      prisma.vault.findMany({
        where: { user_id: { in: sourceUserIds } },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true } },
        },
        take: 160,
        orderBy: { added_at: "desc" },
      }),
      prisma.watchlist.findMany({
        where: { user_id: { in: sourceUserIds } },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true } },
        },
        take: 160,
        orderBy: { added_at: "desc" },
      }),
    ])

    return { reviews, vaultEntries, watchlistEntries }
  }

  /**
   * Determina qué reseñas de una lista han sido marcadas con "like" por el espectador.
   */
  async listLikedReviewIds(viewerId: number, reviewIds: number[]) {
    if (reviewIds.length === 0) return []

    const likes = await prisma.review_likes.findMany({
      where: {
        user_id: viewerId,
        review_id: { in: reviewIds },
      },
      select: { review_id: true },
    })

    return likes.map((item) => item.review_id)
  }

  /**
   * Recupera los favoritos (bookmarks) guardados por el usuario para una lista de referencias.
   */
  async listBookmarkedRefs(
    viewerId: number,
    refs: Array<{ item_type: FeedItemType; item_id: number }>
  ) {
    if (!refs.length) return []

    const byType = refs.reduce<Record<FeedItemType, number[]>>(
      (acc, ref) => {
        if (!acc[ref.item_type]) acc[ref.item_type] = []
        acc[ref.item_type].push(ref.item_id)
        return acc
      },
      {} as Record<FeedItemType, number[]>
    )

    const conditions = Object.entries(byType).map(
      ([itemType, itemIds]) =>
        Prisma.sql`(item_type = ${itemType as FeedItemType} AND item_id IN (${Prisma.join(itemIds)}))`
    )

    return prisma.$queryRaw<
      Array<{ item_type: FeedItemType; item_id: number }>
    >(Prisma.sql`
      SELECT item_type, item_id
      FROM user_feed_bookmarks
      WHERE user_id = ${viewerId}
        AND (${Prisma.join(conditions, " OR ")})
    `)
  }

  /**
   * Recupera los elementos que el usuario ha decidido ocultar de su feed.
   */
  async listHiddenRefs(
    viewerId: number,
    refs: Array<{ item_type: FeedItemType; item_id: number }>
  ) {
    if (!refs.length) return []

    const byType = refs.reduce<Record<FeedItemType, number[]>>(
      (acc, ref) => {
        if (!acc[ref.item_type]) acc[ref.item_type] = []
        acc[ref.item_type].push(ref.item_id)
        return acc
      },
      {} as Record<FeedItemType, number[]>
    )

    const conditions = Object.entries(byType).map(
      ([itemType, itemIds]) =>
        Prisma.sql`(item_type = ${itemType as FeedItemType} AND item_id IN (${Prisma.join(itemIds)}))`
    )

    return prisma.$queryRaw<
      Array<{ item_type: FeedItemType; item_id: number }>
    >(Prisma.sql`
      SELECT item_type, item_id
      FROM user_feed_hides
      WHERE user_id = ${viewerId}
        AND (${Prisma.join(conditions, " OR ")})
    `)
  }

  /**
   * Verifica la existencia de una reseña por ID.
   */
  async existsReview(reviewId: number) {
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
      select: { id: true },
    })
    return Boolean(review)
  }

  /**
   * Alterna el estado de "like" en una reseña de forma atómica.
   * Actualiza el contador denormalizado en la tabla de reseñas para optimización de lectura.
   */
  async setReviewLike(viewerId: number, reviewId: number, active: boolean) {
    return prisma.$transaction(async (tx) => {
      if (active) {
        await tx.$executeRaw(Prisma.sql`
          INSERT IGNORE INTO review_likes (user_id, review_id)
          VALUES (${viewerId}, ${reviewId})
        `)
      } else {
        await tx.$executeRaw(Prisma.sql`
          DELETE FROM review_likes
          WHERE user_id = ${viewerId} AND review_id = ${reviewId}
        `)
      }

      const rows = await tx.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*) AS total
        FROM review_likes
        WHERE review_id = ${reviewId}
      `)

      const likes = Number(rows[0]?.total ?? 0)

      await tx.$executeRaw(Prisma.sql`
        UPDATE reviews
        SET likes = ${likes}
        WHERE id = ${reviewId}
      `)

      return likes
    })
  }

  /**
   * Guarda o elimina un bookmark sobre un elemento del feed.
   */
  async setBookmark(
    viewerId: number,
    itemType: FeedItemType,
    itemId: number,
    active: boolean
  ) {
    if (active) {
      await prisma.$executeRaw(Prisma.sql`
        INSERT IGNORE INTO user_feed_bookmarks (user_id, item_type, item_id)
        VALUES (${viewerId}, ${itemType}, ${itemId})
      `)
      return
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM user_feed_bookmarks
      WHERE user_id = ${viewerId} AND item_type = ${itemType} AND item_id = ${itemId}
    `)
  }

  /**
   * Registra o elimina la ocultación de un elemento para un usuario.
   */
  async setHidden(
    viewerId: number,
    itemType: FeedItemType,
    itemId: number,
    active: boolean
  ) {
    if (active) {
      await prisma.$executeRaw(Prisma.sql`
        INSERT IGNORE INTO user_feed_hides (user_id, item_type, item_id)
        VALUES (${viewerId}, ${itemType}, ${itemId})
      `)
      return
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM user_feed_hides
      WHERE user_id = ${viewerId} AND item_type = ${itemType} AND item_id = ${itemId}
    `)
  }

  /**
   * Registra un evento de compartición para analíticas o efectos secundarios.
   */
  async createShareEvent(
    viewerId: number,
    itemType: FeedItemType,
    itemId: number,
    channel?: string
  ) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO feed_share_events (user_id, item_type, item_id, channel)
      VALUES (${viewerId}, ${itemType}, ${itemId}, ${channel || null})
    `)
  }
}

export const feedRepository = new FeedRepository()
