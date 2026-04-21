/**
 * @file FeedRepository.ts
 * @description Motor de agregación y persistencia para el "Cine-Feed" social de la plataforma.
 * Orquestra la recuperación de múltiples flujos de actividad (reseñas, adiciones a la boveda, 
 * seguimiento) para construir una línea de tiempo cohesiva y personalizada. 
 * Gestiona además la lógica de interacción social (likes, guardados, ocultaciones) 
 * asegurando la integridad de los contadores mediante transacciones atómicas.
 */

import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

/** 
 * Clasificación de los eventos que alimentan el ecosistema social de CineVault.
 */
type FeedItemType =
  | "review"     // Nueva crítica o calificación
  | "vault"      // Adición a la colección permanente (Bóveda)
  | "watchlist"  // Registro en la lista de visionado pendiente
  | "discovery"  // Recomendación generada por inteligencia de búsqueda
  | "tonight"    // Visionado programado para la sesión actual
  | "list"       // Creación o actualización de una lista curada
  | "quote"      // Cita cinematográfica destacada

/**
 * Repositorio de Feed
 * Provee la infraestructura de datos para la experiencia social central.
 */
export class FeedRepository {
  /**
   * Identifica el grafo de origen del feed del usuario.
   * Recupera a todos los usuarios seguidos e incluye el propio perfil del espectador.
   * 
   * @param viewerId - Usuario que solicita la visualización del feed.
   */
  async listSourceUserIds(viewerId: number) {
    const following = await prisma.follows.findMany({
      where: { follower_id: viewerId },
      select: { following_id: true },
    })

    return [viewerId, ...following.map((entry) => entry.following_id)]
  }

  /**
   * Recupera los bloques de actividad bruta de los usuarios origen.
   * Aplica un límite preventivo (Soft-cap) para equilibrar el rendimiento y 
   * la profundidad histórica del feed antes de su mezcla final en la capa de servicios.
   * 
   * @param sourceUserIds - Grafo de usuarios a monitorizar.
   */
  async listFeedRows(sourceUserIds: number[]) {
    // Recuperación paralela de los tres pilares de actividad
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
   * Procesa el estado de las interacciones (likes) del espectador sobre el feed recuperado.
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
   * Recupera las marcas de guardado (bookmarks) para una colección heterogénea de ítems.
   * Utiliza SQL Raw para optimizar la consulta multicriterio sobre tipos y IDs.
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
   * Identifica los elementos marcados por el usuario para su exclusión del feed.
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
   * Verifica la existencia física de una reseña.
   */
  async existsReview(reviewId: number) {
    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
      select: { id: true },
    })
    return Boolean(review)
  }

  /**
   * Alterna el estado de aceptación ("Like") de una reseña.
   * Implementa una de-normalización controlada actualizando el contador total en la tabla 
   * de reseñas mediante una transacción para mantener la consistencia eventual.
   */
  async setReviewLike(viewerId: number, reviewId: number, active: boolean) {
    return prisma.$transaction(async (tx) => {
      // 1. Registro de la interacción atómica
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

      // 2. Recalibración del contador denormalizado para optimización de lectura
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
   * Persiste el interés del usuario en un elemento guardándolo para acceso rápido posterior.
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
   * Excluye un elemento específico de la vista de feed del usuario.
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
   * Registra un hito de propagación (Share).
   * Estos eventos alimentan las métricas de visibilidad del contenido en la plataforma.
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

/** Instancia única de acceso al repositorio social */
export const feedRepository = new FeedRepository()
