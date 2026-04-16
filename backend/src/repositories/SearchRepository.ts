/**
 * @file SearchRepository.ts
 * @description Repositorio auxiliar para la obtención de métricas de popularidad 
 * durante las búsquedas. Proporciona conteos de presencia en bóvedas, reseñas y watchlists.
 */

import { prisma } from "../lib/prisma.js"

/**
 * Clase SearchRepository
 * Centraliza consultas de agregación para el motor de búsqueda unificado.
 */
export class SearchRepository {
  /**
   * Recupera los contadores de interacción social para un conjunto de IDs de TMDB.
   * Útil para mostrar la popularidad de una película en los resultados de búsqueda.
   */
  async findMovieRefCounts(tmdbIds: number[]) {
    return prisma.movies_ref.findMany({
      where: { tmdb_id: { in: tmdbIds } },
      select: {
        tmdb_id: true,
        _count: {
          select: { vault: true, reviews: true, watchlist: true },
        },
      },
    })
  }
}

export const searchRepository = new SearchRepository()
