/**
 * @file WatchlistRepository.ts
 * @description Repositorio encargado de la gestión de la lista de visionado pendiente (Watchlist).
 * Administra el catálogo de obras que los usuarios planean ver en el futuro. 
 * Al igual que la Bóveda, implementa una lógica de hidratación asíncrona para 
 * inyectar metadatos visuales (Título y Póster) desde la API externa de TMDB, 
 * asegurando una experiencia visual fluida.
 */

import { watchlist } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"

// --- Definiciones de Tipado de Hidratación ---

/** Estructura de respuesta cruda de la API de TMDB */
type TMDBMovieResponse = {
  title: string
  poster_path: string
}

/** 
 * Entrada de la watchlist enriquecida para el cliente.
 * Fusiona la marca temporal de adición local con los activos gráficos externos.
 */
export interface RichWatchlistEntry {
  movie_id: number
  /** Identificador de referencia externa */
  tmdb_id: number | null
  /** Metadatos básicos para renderizado de tarjetas */
  movie_info: { title: string; poster_path: string } | null
  added_at: Date | null
}

/**
 * Interfaz IWatchlistRepository
 * Define las operaciones permitidas sobre el flujo de visionados planeados.
 */
export interface IWatchlistRepository {
  /** Recupera el listado plano de seguimiento del usuario */
  findByUserId(userId: number): Promise<watchlist[]>
  /** Valida si una obra ya reside en la lista de pendientes */
  exists(userId: number, movieId: number): Promise<boolean>
  /** Registra una intención de visionado */
  create(userId: number, movieId: number): Promise<watchlist>
  /** Revoca una obra de la lista de seguimiento */
  deleteByMovieId(userId: number, movieId: number): Promise<void>
  /** Genera la vista hidratada del catálogo de pendientes del usuario */
  buildRichResponse(userId: number): Promise<RichWatchlistEntry[]>
}

/**
 * Repositorio de Watchlist
 * Implementación basada en Prisma y orquestación externa para el catálogo de pendientes.
 */
export class WatchlistRepository implements IWatchlistRepository {
  /**
   * Recupera las entradas de la watchlist por orden inverso de adición.
   */
  async findByUserId(userId: number) {
    return prisma.watchlist.findMany({
      where: { user_id: userId },
      orderBy: { id: "desc" },
    })
  }

  /**
   * Determina si la película ya ha sido marcada como "pendiente" por el usuario.
   */
  async exists(userId: number, movieId: number) {
    const item = await prisma.watchlist.findFirst({
      where: { user_id: userId, movie_id: movieId },
    })
    return item !== null
  }

  /**
   * Persiste la vinculación de seguimiento para una obra.
   */
  async create(userId: number, movieId: number) {
    return prisma.watchlist.create({
      data: { user_id: userId, movie_id: movieId },
    })
  }

  /**
   * Disocia una película de la lista de pendientes.
   */
  async deleteByMovieId(userId: number, movieId: number) {
    await prisma.watchlist.deleteMany({
      where: { user_id: userId, movie_id: movieId },
    })
  }

  /**
   * Reconstruye el mosaico visual del catálogo de pendientes.
   * Optimiza el rendimiento de red mediante el procesamiento concurrente de 
   * las solicitudes de metadatos externos.
   * 
   * @param userId - Propietario de la watchlist.
   */
  async buildRichResponse(userId: number): Promise<RichWatchlistEntry[]> {
    // 1. Fase de Extracción: Obtención de punteros locales
    const entries = await prisma.watchlist.findMany({
      where: { user_id: userId },
      select: { movie_id: true, added_at: true },
      orderBy: { added_at: "desc" },
    })

    if (entries.length === 0) return []

    const movieIds = entries.map((e) => e.movie_id)

    // 2. Fase de Resolución: Mapeo de IDs internos a TMDB
    const movies = await prisma.movies_ref.findMany({
      where: { id: { in: movieIds } },
      select: { id: true, tmdb_id: true },
    })

    // 3. Fase de Enriquecimiento: Consulta paralela a la API de TMDB
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

    // 4. Fase de Ensamblaje: Indexación y mapeo final de la respuesta O(N)
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

/** Instancia exportada del repositorio de watchlist */
export const watchlistRepository = new WatchlistRepository()
