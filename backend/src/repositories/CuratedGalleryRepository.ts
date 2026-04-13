import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import type { ActualizarGaleriaCuradaDTO } from "../schemas/profile.js"

/* ==========================================================================
   CURATED GALLERY REPOSITORY
   --------------------------------------------------------------------------
   Raw justificado: el SELECT tiene un INNER JOIN con movies_ref que Prisma
   no puede expresar sin relaciones explícitas en el schema. El replace
   (DELETE + INSERT en transacción) es el patrón más limpio para reordenación.
   ========================================================================== */

type GaleriaItem = Record<string, string | number | null>

export const curatedGalleryRepository = {
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

  async existMovieIds(movieIds: number[]): Promise<number[]> {
    const rows = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
      SELECT id FROM movies_ref
      WHERE id IN (${Prisma.join(movieIds)})
    `)
    return rows.map((r) => r.id)
  },

  async replace(
    userId: number,
    data: ActualizarGaleriaCuradaDTO
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM curated_gallery_items WHERE user_id = ${userId}
      `)
      for (const item of data.items) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO curated_gallery_items (user_id, movie_id, order_index, note)
          VALUES (${userId}, ${item.movie_id}, ${item.order_index}, ${item.note ?? null})
        `)
      }
    })
  },
}
