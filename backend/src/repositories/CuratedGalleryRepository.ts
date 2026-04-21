/**
 * @file CuratedGalleryRepository.ts
 * @description Repositorio para la gestión de la vitrina personal ("Galería Curada") del usuario.
 * Permite a los cinéfilos destacar un conjunto selecto de películas en su perfil público, 
 * con soporte para ordenación personalizada y notas curatoriales.
 * Implementa sincronización atómica para garantizar la integridad de la colección.
 */

import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import type { ActualizarGaleriaCuradaDTO } from "../schemas/profile.js"

/** 
 * Estructura de un ítem destacado en la galería. 
 * Combina la relación del usuario con metadatos técnicos de la película.
 */
type GaleriaItem = {
  movie_id: number
  /** Índice para el posicionamiento visual en el carrusel */
  order_index: number
  /** Breve nota del usuario justificando la elección de la obra */
  note: string | null
  /** Referencia externa para carga de arte (póster/fondo) */
  tmdb_id: number | null
}

/**
 * Repositorio de Galería Curada
 * Gestiona el subconjunto de películas destacadas dentro del perfil social.
 */
export const curatedGalleryRepository = {
  /**
   * Recupera la colección completa de películas destacadas de un usuario.
   * Realiza un JOIN con la tabla de referencia para obtener identificadores TMDB.
   * 
   * @param userId - Propietario de la galería.
   */
  async findByUserId(userId: number): Promise<GaleriaItem[]> {
    return prisma.$queryRaw<GaleriaItem[]>(Prisma.sql`
      SELECT
        cgi.movie_id,
        cgi.order_index,
        cgi.note,
        mr.tmdb_id
      FROM curated_gallery_items cgi
      INNER JOIN movies_ref mr ON mr.id = cgi.movie_id
      WHERE cgi.user_id = ${userId}
      ORDER BY cgi.order_index ASC
    `)
  },

  /**
   * Valida la existencia de un conjunto de películas antes de su inserción.
   * Garantiza que no se referencien películas inexistentes en el catálogo local.
   * 
   * @param movieIds - Lista de identificadores a verificar.
   */
  async existMovieIds(movieIds: number[]): Promise<number[]> {
    if (movieIds.length === 0) return []
    const rows = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
      SELECT id FROM movies_ref
      WHERE id IN (${Prisma.join(movieIds)})
    `)
    return rows.map((r) => r.id)
  },

  /**
   * Realiza una sincronización completa de la galería de un usuario.
   * Utiliza una transacción atómica para asegurar que el proceso de "limpiar y repoblar"
   * sea seguro y no deje la galería en un estado inconsistente.
   * 
   * @param userId - Propietario de la galería.
   * @param data - DTO con el nuevo estado deseado de la vitrina.
   */
  async replace(
    userId: number,
    data: ActualizarGaleriaCuradaDTO
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 1. Evicción de ítems anteriores
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM curated_gallery_items WHERE user_id = ${userId}
      `)

      if (data.items.length === 0) return

      // 2. Construcción de inserción masiva (Bulk Insert)
      const values = data.items.map(
        (item) =>
          Prisma.sql`(${userId}, ${item.movie_id}, ${item.order_index}, ${item.note ?? null})`
      )

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO curated_gallery_items (user_id, movie_id, order_index, note)
        VALUES ${Prisma.join(values)}
      `)
    })
  },
}
