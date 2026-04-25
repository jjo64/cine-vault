/**
 * @file search.services.ts
 * @description Capa de servicios para el enriquecimiento de resultados de búsqueda.
 * Actúa como orquestador para inyectar métricas sociales locales (conteo de reseñas,
 * vault, watchlist) en los resultados obtenidos de proveedores externos (TMDB).
 */

import type { LocalCounts } from "../helpers/searchUtils.js"
import { searchRepository } from "../repositories/SearchRepository.js"

// --- Servicios de Enriquecimiento ---

/**
 * Enriquece una lista de IDs de TMDB con estadísticas de actividad real en CineVault.
 * Permite mostrar en los resultados globales cuántas personas han visto o reseñado
 * una película sin necesidad de realizar múltiples consultas por ítem.
 *
 * @param tmdbIds Colección de identificadores de TMDB a consultar.
 * @returns Mapa cuya clave es el tmdb_id y el valor son los contadores locales.
 */
export const enriquecerConDatosLocalesService = async (
  tmdbIds: number[]
): Promise<Map<number, LocalCounts>> => {
  if (tmdbIds.length === 0) return new Map()

  try {
    const refs = await searchRepository.findMovieRefCounts(tmdbIds)

    const mapa = new Map<number, LocalCounts>()
    for (const ref of refs) {
      mapa.set(ref.tmdb_id, {
        vault_count: ref._count.vault,
        review_count: ref._count.reviews,
        watchlist_count: ref._count.watchlist,
      })
    }
    return mapa
  } catch (error) {
    /**
     * Gestión de errores de persistencia. P2022 indica fallos de esquema o tabla inexistente.
     * En caso de error crítico de infraestructura, retornamos un mapa vacío para
     * degradar la experiencia de forma elegante (resiliencia).
     */
    const maybePrismaError = error as { code?: string }
    if (maybePrismaError?.code === "P2022") return new Map()
    throw error
  }
}
