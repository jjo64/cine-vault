import { prisma } from "../lib/prisma.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"

export interface RichVaultEntry {
  movie_id: number
  tmdb_id: number | null
  movie_info: {
    title: string
    poster_path: string
    release_date: string
  } | null
  added_at: Date | null
}

export interface IVaultRepository {
  exists(userId: number, movieId: number): Promise<boolean>
  create(userId: number, movieId: number): Promise<void>
  deleteByMovieId(userId: number, movieId: number): Promise<void>
  buildRichResponse(userId: number): Promise<RichVaultEntry[]>
}

export class VaultRepository implements IVaultRepository {
  async exists(userId: number, movieId: number) {
    const item = await prisma.vault.findFirst({
      where: { user_id: userId, movie_id: movieId },
      select: { id: true },
    })
    return item !== null
  }

  async create(userId: number, movieId: number) {
    await prisma.vault.create({
      data: { user_id: userId, movie_id: movieId },
    })
  }

  async deleteByMovieId(userId: number, movieId: number) {
    await prisma.vault.deleteMany({
      where: { user_id: userId, movie_id: movieId },
    })
  }

  async buildRichResponse(userId: number): Promise<RichVaultEntry[]> {
    const entries = await prisma.vault.findMany({
      where: { user_id: userId },
      select: { movie_id: true, added_at: true },
      orderBy: { added_at: "desc" },
    })

    if (entries.length === 0) return []

    const movieIds = entries.map((entry) => entry.movie_id)

    const movies = await prisma.movies_ref.findMany({
      where: { id: { in: movieIds } },
      select: { id: true, tmdb_id: true },
    })

    const tmdbResults = await Promise.allSettled(
      movies.map((movie) =>
        consultarTMDB(`movie/${movie.tmdb_id}`).then((data: unknown) => {
          const payload = data as {
            title?: string
            poster_path?: string
            release_date?: string
          }

          return {
            title: payload.title || "",
            poster_path: payload.poster_path || "",
            release_date: payload.release_date || "",
          }
        })
      )
    )

    const tmdbMap = new Map(
      movies.map((movie, index) => {
        const result = tmdbResults[index]
        return [movie.id, result.status === "fulfilled" ? result.value : null]
      })
    )

    const tmdbIdMap = new Map(movies.map((movie) => [movie.id, movie.tmdb_id]))

    return entries.map((entry) => ({
      movie_id: entry.movie_id,
      tmdb_id: tmdbIdMap.get(entry.movie_id) ?? null,
      movie_info: tmdbMap.get(entry.movie_id) ?? null,
      added_at: entry.added_at,
    }))
  }
}

export const vaultRepository = new VaultRepository()
