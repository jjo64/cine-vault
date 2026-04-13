import { prisma } from "../lib/prisma.js"

/* ==========================================================================
   MOVIE REF REPOSITORY
   --------------------------------------------------------------------------
   Encapsula todas las queries sobre movies_ref. Esta tabla actúa como proxy
   local que mapea tmdb_id → id interno, evitando duplicar metadata de TMDB
   en MariaDB. El servicio movieRef.services.ts orquesta la lógica de negocio
   (fallbacks, race conditions, ensure) usando estos métodos.
   ========================================================================== */

export interface IMovieRefRepository {
  findById(id: number): Promise<{ id: number } | null>
  findByTmdbId(tmdbId: number): Promise<{ id: number } | null>
  findBySlug(slug: string): Promise<{ id: number } | null>
  create(tmdbId: number): Promise<{ id: number }>
}

class MovieRefRepository implements IMovieRefRepository {
  async findById(id: number): Promise<{ id: number } | null> {
    return prisma.movies_ref.findUnique({
      where: { id },
      select: { id: true },
    })
  }

  async findByTmdbId(tmdbId: number): Promise<{ id: number } | null> {
    return prisma.movies_ref.findUnique({
      where: { tmdb_id: tmdbId },
      select: { id: true },
    })
  }

  async findBySlug(slug: string): Promise<{ id: number } | null> {
    return prisma.movies_ref.findUnique({
      where: { slug },
      select: { id: true },
    })
  }

  async create(tmdbId: number): Promise<{ id: number }> {
    return prisma.movies_ref.create({
      data: { tmdb_id: tmdbId },
      select: { id: true },
    })
  }
}

export const movieRefRepository = new MovieRefRepository()
