/**
 * @file DiaryRepository.ts
 * @description Repositorio central para la gestión del diario de visionado (diary_entries).
 * Encapsula la persistencia en base de datos y la agregación de metadatos externos de TMDB.
 */

import { diary_entries } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import type { CrearEntradaDiarioDTO } from "../schemas/diary.js"

/**
 * Interfaz que define las operaciones permitidas sobre el repositorio del diario.
 */
export interface IDiaryRepository {
  findByUserId(userId: number): Promise<diary_entries[]>
  findById(id: number): Promise<diary_entries | null>
  create(userId: number, data: CrearEntradaDiarioDTO): Promise<diary_entries>
  delete(id: number): Promise<void>
  findByUserMovieDate(
    userId: number,
    movieId: number,
    watchedDate: Date
  ): Promise<diary_entries | null>
  countByMovie(movieId: number): Promise<number>
  buildRichResponse(userId: number): Promise<RichDiaryEntry[] | null>
}

/** 
 * Tipo enriquecido que combina datos de la base de datos local con info de TMDB y reseñas.
 */
export interface RichDiaryEntry {
  id: number
  movie_id: number
  watched_date: Date | null
  tmdb_id: number | null
  movie_info: { title: string; poster_path: string | null } | null
  review: {
    movie_id: number
    rating: unknown
    content: string | null
    created_at: Date
  } | null
}

/**
 * Clase DiaryRepository
 * Provee acceso unificado a las entradas del diario de los usuarios.
 */
export class DiaryRepository implements IDiaryRepository {
  /**
   * Obtiene todas las entradas del diario para un usuario, ordenadas por fecha reciente.
   */
  async findByUserId(userId: number) {
    return prisma.diary_entries.findMany({
      where: { user_id: userId },
      orderBy: { watched_date: "desc" },
    })
  }

  /**
   * Busca una entrada específica por su ID único.
   */
  async findById(id: number) {
    return prisma.diary_entries.findUnique({ where: { id } })
  }

  /**
   * Registra una nueva película vista en el diario.
   */
  async create(userId: number, data: CrearEntradaDiarioDTO) {
    return prisma.diary_entries.create({
      data: {
        user_id: userId,
        movie_id: data.movie_id,
        ...(data.watched_date && { watched_date: new Date(data.watched_date) }),
      },
    })
  }

  /**
   * Busca si ya existe una entrada para un usuario, película y fecha específica.
   */
  async findByUserMovieDate(
    userId: number,
    movieId: number,
    watchedDate: Date
  ) {
    return prisma.diary_entries.findFirst({
      where: {
        user_id: userId,
        movie_id: movieId,
        watched_date: watchedDate,
      },
    })
  }

  /**
   * Elimina una entrada del diario.
   */
  async delete(id: number) {
    await prisma.diary_entries.delete({ where: { id } })
  }

  /**
   * Cuenta cuántas veces se ha registrado una película en los diarios globales.
   */
  async countByMovie(movieId: number) {
    return prisma.diary_entries.count({ where: { movie_id: movieId } })
  }

  /**
   * Construye una respuesta hidratada con metadatos de TMDB y reseñas cruzadas.
   * Utiliza Promise.allSettled para tolerar fallos parciales en la API externa.
   * @param userId - ID del usuario de quien se recupera el diario.
   */
  async buildRichResponse(userId: number): Promise<RichDiaryEntry[] | null> {
    // 1. Obtención de entradas base
    const entries = await prisma.diary_entries.findMany({
      where: { user_id: userId },
      select: { id: true, movie_id: true, watched_date: true },
      orderBy: { watched_date: "desc" },
    })

    if (entries.length === 0) return null

    const movieIds = entries.map((d) => d.movie_id)

    // 2. Carga paralela de referencias locales (TMDB ID) y reseñas
    const [movies, reviews] = await Promise.all([
      prisma.movies_ref.findMany({
        where: { id: { in: movieIds } },
        select: { id: true, tmdb_id: true },
      }),
      prisma.reviews.findMany({
        where: { user_id: userId, movie_id: { in: movieIds } },
        orderBy: { created_at: "desc" },
        select: {
          movie_id: true,
          rating: true,
          content: true,
          created_at: true,
        },
      }),
    ])

    // 3. Hidratación con TMDB (concurrente)
    type TmdbMovie = { title: string; poster_path: string | null }
    const tmdbResults = await Promise.allSettled(
      movies.map((movie) =>
        movie.tmdb_id
          ? consultarTMDB(`movie/${movie.tmdb_id}`).then((data) => {
              const movieData = data as TmdbMovie
              return {
                title: movieData.title,
                poster_path: movieData.poster_path,
              }
            })
          : Promise.resolve(null)
      )
    )

    // 4. Mapeo eficiente de resultados
    const tmdbMap = new Map(
      movies.map((movie, index) => {
        const result = tmdbResults[index]
        return [movie.id, result.status === "fulfilled" ? result.value : null]
      })
    )
    const movieMap = new Map(movies.map((m) => [m.id, m.tmdb_id]))
    
    // Mantenemos solo la última reseña por película para evitar duplicados en el diario
    const reviewMap = new Map<number, (typeof reviews)[number]>()
    for (const review of reviews) {
      if (!reviewMap.has(review.movie_id)) {
        reviewMap.set(review.movie_id, review)
      }
    }

    // 5. Ensamblaje final de la respuesta
    return entries.map((entry) => ({
      id: entry.id,
      movie_id: entry.movie_id,
      watched_date: entry.watched_date,
      tmdb_id: movieMap.get(entry.movie_id) ?? null,
      movie_info: tmdbMap.get(entry.movie_id) ?? null,
      review: reviewMap.get(entry.movie_id) ?? null,
    }))
  }
}

export const diaryRepository = new DiaryRepository()
