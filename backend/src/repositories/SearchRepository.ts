/**
 * @file SearchRepository.ts
 * @description Repositorio auxiliar encargado de inyectar contexto social en el motor de búsqueda.
 * Provee métricas de tracción comunitaria (conteo de presencia en colecciones, 
 * críticas emitidas y listas de visionado) para enriquecer los resultados planos 
 * provenientes de fuentes externas como TMDB.
 */

import { prisma } from "../lib/prisma.js"

/**
 * Repositorio de Búsqueda
 * Especializado en operaciones de agregación para el descubrimiento de contenido.
 */
export class SearchRepository {
  /**
   * Recupera los indicadores de popularidad local para un conjunto de obras.
   * Permite que el buscador muestre qué películas son "tendencia" o están más 
   * presentes en las bóvedas de los usuarios de CineVault.
   * 
   * @param tmdbIds - Colección de identificadores de The Movie Database resultantes de una búsqueda.
   */
  async findMovieRefCounts(tmdbIds: number[]) {
    return prisma.movies_ref.findMany({
      where: { tmdb_id: { in: tmdbIds } },
      select: {
        tmdb_id: true,
        /** Contadores denormalizados por eficiencia */
        _count: {
          select: { 
            vault: true,     // Presencia en colecciones permanentes
            reviews: true,   // Volumen de críticas generadas
            watchlist: true  // Interés de visionado futuro
          },
        },
      },
    })
  }
}

/** Instancia exportada para el enriquecimiento del flujo de búsqueda */
export const searchRepository = new SearchRepository()
