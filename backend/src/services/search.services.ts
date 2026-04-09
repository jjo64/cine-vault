import { searchRepository } from "../repositories/SearchRepository.js"
import type { LocalCounts } from "../helpers/searchUtils.js"

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
    const maybePrismaError = error as { code?: string }
    if (maybePrismaError?.code === "P2022") return new Map()
    throw error
  }
}