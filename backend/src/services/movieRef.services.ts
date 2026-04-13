import { Prisma } from "@prisma/client"
import { movieRefRepository } from "../repositories/MovieRefRepository.js"

/* ==========================================================================
   MOVIE REF SERVICE
   --------------------------------------------------------------------------
   Lógica de negocio para resolución y creación de referencias locales a TMDB.
   Las queries están en MovieRefRepository; aquí vive la estrategia de
   fallback y el manejo de race condition en inserciones concurrentes.
   ========================================================================== */

export const findMovieRefIdByCandidate = async (
  candidate: number
): Promise<number | null> => {
  const byId = await movieRefRepository.findById(candidate)
  if (byId) return byId.id

  const byTmdb = await movieRefRepository.findByTmdbId(candidate)
  return byTmdb?.id ?? null
}

export const ensureMovieRefId = async (candidate: number): Promise<number> => {
  const existing = await findMovieRefIdByCandidate(candidate)
  if (existing) return existing

  try {
    const created = await movieRefRepository.create(candidate)
    return created.id
  } catch (error) {
    // Race condition: otro request insertó el mismo tmdb_id entre el find y el create
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raceSafeLookup = await movieRefRepository.findByTmdbId(candidate)
      if (raceSafeLookup) return raceSafeLookup.id
    }
    throw error
  }
}
