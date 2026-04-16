/**
 * @file WatchlistRepository.ts
 * @description Repositorio central para la gestión de la lista de seguimiento (Watchlist).
 * Permite a los usuarios organizar películas que desean ver, enriqueciendo los datos 
 * locales con metadatos visuales de TMDB.
 */

import { watchlist } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"

// --- Tipos y Estructuras de Datos ---

/**
 * Estructura de respuesta de la API de TMDB para películas básicas.
 */
type TMDBMovieResponse = {
  title: string
  poster_path: string
}

/**
 * Representación de una entrada de watchlist con metadatos hidratados.
 */
export interface RichWatchlistEntry {
  movie_id: number
  tmdb_id: number | null
  movie_info: { title: string; poster_path: string } | null
  added_at: Date | null
}

/**
 * Interfaz IWatchlistRepository
 * Define las operaciones permitidas sobre la lista de seguimiento.
 */
export interface IWatchlistRepository {
  findByUserId(userId: number): Promise<watchlist[]>
  exists(userId: number, movieId: number): Promise<boolean>
  create(userId: number, movieId: number): Promise<watchlist>
  deleteByMovieId(userId: number, movieId: number): Promise<void>
  buildRichResponse(userId: number): Promise<RichWatchlistEntry[]>
}

/**
 * Clase WatchlistRepository
 * Implementa la gestión de la watchlist integrando Prisma y TMDB.
 */
export class WatchlistRepository implements IWatchlistRepository {
  /**
   * Recupera las entradas crudas de la watchlist para un usuario.
   */
  async findByUserId(userId: number) {
    return prisma.watchlist.findMany({
      where: { user_id: userId },
      orderBy: { id: "desc" },
    })
  }

  /**
   * Verifica la existencia de una película en la lista de un usuario.
   */
  async exists(userId: number, movieId: number) {
    const item = await prisma.watchlist.findFirst({
      where: { user_id: userId, movie_id: movieId },
    })
    return item !== null
  }

  /**
   * Registra una nueva película en la lista de seguimiento.
   */
  async create(userId: number, movieId: number) {
    return prisma.watchlist.create({
      data: { user_id: userId, movie_id: movieId },
    })
  }

  /**
   * Elimina una película específica de la lista.
   */
  async deleteByMovieId(userId: number, movieId: number) {
    await prisma.watchlist.deleteMany({
      where: { user_id: userId, movie_id: movieId },
    })
  }

  /**
   * Construye una respuesta hidratada consultando TMDB para obtener póster y título.
   * Utiliza consultas paralelas para optimizar el rendimiento.
   */
  async buildRichResponse(userId: number): Promise<RichWatchlistEntry[]> {
    const entries = await prisma.watchlist.findMany({
      where: { user_id: userId },
      select: { movie_id: true, added_at: true },
      orderBy: { added_at: "desc" },
    })

    if (entries.length === 0) return []

    const movieIds = entries.map((e) => e.movie_id)

    const movies = await prisma.movies_ref.findMany({
      where: { id: { in: movieIds } },
      select: { id: true, tmdb_id: true },
    })

    const tmdbResults = await Promise.allSettled(
      movies.map((movie) =>
        consultarTMDB<TMDBMovieResponse>(`movie/${movie.tmdb_id}`).then(
          (data) => ({
            title: data.title,
            poster_path: data.poster_path,
          })
        )
      )
    )

    const tmdbMap = new Map(
      movies.map((movie, index) => {
        const result = tmdbResults[index]
        return [movie.id, result.status === "fulfilled" ? result.value : null]
      })
    )
    const movieMap = new Map(movies.map((m) => [m.id, m.tmdb_id]))

    return entries.map((entry) => ({
      movie_id: entry.movie_id,
      tmdb_id: movieMap.get(entry.movie_id) ?? null,
      movie_info: tmdbMap.get(entry.movie_id) ?? null,
      added_at: entry.added_at,
    }))
  }
}

export const watchlistRepository = new WatchlistRepository()
