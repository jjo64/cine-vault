/**
 * @file CuratedGalleryRepository.ts
 * @description Repositorio para gestionar la "Galería Curada" del perfil de usuario. 
 * Maneja la selección, ordenación y notas personalizadas de películas favoritas mostradas en el perfil.
 */

import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import type { ActualizarGaleriaCuradaDTO } from "../schemas/profile.js"

/**
 * Representación de un ítem de la galería curada tras un JOIN con metadatos de referencia.
 */
type GaleriaItem = Record<string, string | number | null>

/**
 * Objeto curatedGalleryRepository
 * Provee métodos para la gestión de ítems en la galería pública del usuario.
 */
export const curatedGalleryRepository = {
  /**
   * Recupera los ítems de la galería curada de un usuario, incluyendo el TMDB ID de referencia.
   * @param userId - ID del usuario propietario.
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
   * Verifica la existencia de una lista de IDs de películas en la tabla de referencia global.
   * Útil para validar integridad antes de inserciones.
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
   * Reemplaza atómicamente la galería completa de un usuario.
   * Utiliza una transacción para asegurar que no se pierdan datos si falla la inserción por lotes.
   */
  async replace(
    userId: number,
    data: ActualizarGaleriaCuradaDTO
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Limpiar ítems previos
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM curated_gallery_items WHERE user_id = ${userId}
      `)

      if (data.items.length === 0) return

      // Construcción de inserción múltiple para eficiencia
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
