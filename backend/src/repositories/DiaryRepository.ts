/**
 * @file DiaryRepository.ts
 * @description Repositorio central para la gestión del historial cronológico de visionado (Diario).
 * Encapsula la persistencia del diario de usuario y orquestra la hidratación de datos
 * heterogéneos, integrando metadatos externos de TMDB y vinculaciones automáticas
 * con la capa de reseñas y calificaciones.
 */

import { diary_entries, ReviewMediaType } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import type { CrearEntradaDiarioDTO } from "../schemas/diary.js"

/** Contrato contractual para las operaciones del diario de visionado */
export interface IDiaryRepository {
  /** Recupera el historial plano de un usuario */
  findByUserId(userId: number): Promise<diary_entries[]>
  /** Localiza una entrada específica por su ID */
  findById(id: number): Promise<diary_entries | null>
  /** Registra un hito de visionado */
  create(userId: number, data: CrearEntradaDiarioDTO): Promise<diary_entries>
  /** Elimina un registro del historial */
  delete(id: number): Promise<void>
  /** Valida duplicados para una misma fecha y película */
  findByUserMovieDate(
    userId: number,
    movieId: number,
    watchedDate: Date
  ): Promise<diary_entries | null>
  /** Métrica de popularidad de una obra */
  countByMovie(movieId: number): Promise<number>
  /** Genera la vista de usuario enriquecida (Metadatos + Reseñas) */
  buildRichResponse(userId: number): Promise<RichDiaryEntry[] | null>
  /** Crea una sesión agrupada de visionado */
  createSession(userId: number, data: any): Promise<any>
  /** Obtiene las sesiones de diario de un usuario con sus películas */
  findSessionsByUserId(userId: number): Promise<any>
}

/**
 * Estructura de datos hidratada para la capa de presentación.
 * Fusiona la entrada del diario con información de arte gráfico y la última crítica realizada.
 */
export interface RichDiaryEntry {
  id: number
  movie_id: number
  watched_date: Date | null
  tmdb_id: number | null
  /** Metadatos básicos de TMDB (Título y Póster) */
  movie_info: {
    title: string
    poster_path: string | null
    media_type?: string | null
  } | null
  /** Vínculo opcional con la reseña realizada por el usuario */
  review: {
    movie_id: number
    rating: unknown
    content: string | null
    created_at: Date
  } | null
}

/**
 * Repositorio de Diario
 * Provee una interfaz de acceso unificado al "Log" de actividad de los usuarios.
 */
export class DiaryRepository implements IDiaryRepository {
  /**
   * Recupera el diario cronológico del usuario.
   *
   * @param userId - Propietario del historial.
   */
  async findByUserId(userId: number) {
    return prisma.diary_entries.findMany({
      where: { user_id: userId },
      orderBy: [{ watched_date: "desc" }, { id: "desc" }],
    })
  }

  /**
   * Localiza un registro único de visionado.
   */
  async findById(id: number) {
    return prisma.diary_entries.findUnique({ where: { id } })
  }

  /**
   * Registra un nuevo hito de visionado.
   */
  async create(
    userId: number,
    data: CrearEntradaDiarioDTO & { media_type?: ReviewMediaType }
  ) {
    return prisma.diary_entries.create({
      data: {
        user_id: userId,
        movie_id: data.movie_id,
        media_type: data.media_type || (data as any).mediaType || "movie",
        ...(data.watched_date && { watched_date: new Date(data.watched_date) }),
      },
    })
  }

  /**
   * Verifica solapamientos en el diario para evitar registros redundantes
   * de una misma fecha para la misma película.
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
   * Elimina un registro del diario personal.
   */
  async delete(id: number) {
    await prisma.diary_entries.delete({ where: { id } })
  }

  /**
   * Obtiene el conteo total de visionados registrados para una película.
   */
  async countByMovie(movieId: number) {
    return prisma.diary_entries.count({ where: { movie_id: movieId } })
  }

  /**
   * Construye el historial visual y narrativo del usuario.
   * Proceso de Alta Disponibilidad: Utiliza Promise.allSettled para garantizar que un fallo
   * en la API externa de TMDB no bloquee la carga de los datos locales del diario.
   *
   * @param userId - ID del usuario de quien se recupera el diario.
   */
  async buildRichResponse(userId: number): Promise<RichDiaryEntry[] | null> {
    // 1. Fase de Extracción: Recuperación de hitos cronológicos
    const entries = await prisma.diary_entries.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        movie_id: true,
        watched_date: true,
        media_type: true,
      },
      orderBy: [{ watched_date: "desc" }, { id: "desc" }],
    })

    if (entries.length === 0) return null

    const movieIds = entries.map((d) => d.movie_id)

    // 2. Fase de Hidratación Local: Carga paralela de ID TMDB y críticas emitidas
    const [movies, reviews] = await Promise.all([
      prisma.movies_ref.findMany({
        where: { id: { in: movieIds } },
        select: { id: true, tmdb_id: true, media_type: true },
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

    // 3. Fase de Enriquecimiento Externo: Consulta concurrente a TMDB
    type TmdbMedia = {
      title?: string
      name?: string
      poster_path: string | null
      release_date?: string
      first_air_date?: string
      credits?: { crew: Array<{ job: string; name: string }> }
    }
    const tmdbResults = await Promise.allSettled(
      movies.map((movie) =>
        movie.tmdb_id
          ? consultarTMDB(`${movie.media_type}/${movie.tmdb_id}`, {
              append_to_response: "credits",
            }).then((data) => {
              const mediaData = data as TmdbMedia
              const director =
                mediaData.credits?.crew?.find((p) => p.job === "Director")
                  ?.name ||
                mediaData.credits?.crew?.find((p) => p.job === "Creator")
                  ?.name ||
                "Desconocido"
              const dateStr = mediaData.release_date || mediaData.first_air_date
              const year = dateStr ? parseInt(dateStr.split("-")[0]) : null

              return {
                title: mediaData.title || mediaData.name || "Sin título",
                poster_path: mediaData.poster_path,
                director,
                year,
                media_type: movie.media_type,
              }
            })
          : Promise.resolve(null)
      )
    )

    // 4. Fase de Indexación: Mapeo de resultados para ensamblaje O(N)
    const tmdbMap = new Map(
      movies.map((movie, index) => {
        const result = tmdbResults[index]
        return [movie.id, result.status === "fulfilled" ? result.value : null]
      })
    )
    const movieMap = new Map(movies.map((m) => [m.id, m.tmdb_id]))

    // De-duplicación de reseñas: Solo vinculamos la más reciente a la entrada del diario
    const reviewMap = new Map<number, (typeof reviews)[number]>()
    for (const review of reviews) {
      if (!reviewMap.has(review.movie_id)) {
        reviewMap.set(review.movie_id, review)
      }
    }

    // 5. Fase de Ensamblaje: Construcción de la respuesta final hidratada
    return entries.map((entry) => ({
      id: entry.id,
      movie_id: entry.movie_id,
      watched_date: entry.watched_date,
      tmdb_id: movieMap.get(entry.movie_id) ?? null,
      movie_info: tmdbMap.get(entry.movie_id) ?? null,
      review: reviewMap.get(entry.movie_id) ?? null,
    }))
  }

  /**
   * Crea una nueva sesión agrupada y asocia (o crea) las entradas correspondientes.
   */
  async createSession(userId: number, data: any) {
    return prisma.diary_sessions.create({
      data: {
        user_id: userId,
        type: data.session_type || data.type || "single",
        date: data.date ? new Date(data.date) : new Date(),
        note: data.note,
        mood: data.mood,
        stage: data.stage,
        entries: {
          create: data.entries.map((entry: any) => ({
            user_id: userId,
            movie_id: entry.movie_id,
            media_type: entry.media_type || "movie",
            watched_date: data.date ? new Date(data.date) : new Date(),
          })),
        },
      },
      include: {
        entries: true,
      },
    })
  }

  /**
   * Obtiene todas las sesiones de un usuario hidratadas.
   */
  async findSessionsByUserId(userId: number) {
    const sessions = await prisma.diary_sessions.findMany({
      where: { user_id: userId },
      orderBy: [{ date: "desc" }, { id: "desc" }],
      include: {
        entries: {
          orderBy: { id: "asc" },
          include: {
            movies_ref: true,
          },
        },
      },
    })

    if (sessions.length === 0) return []

    // Recolectar pares [tmdb_id, media_type] necesarios
    const tmdbToFetch = new Map<number, string>()

    sessions.forEach((session) => {
      session.entries.forEach((entry) => {
        if (entry.movies_ref?.tmdb_id) {
          tmdbToFetch.set(
            entry.movies_ref.tmdb_id,
            entry.movies_ref.media_type || "movie"
          )
        }
      })
    })

    // Consultar TMDB en paralelo
    const tmdbMap = new Map<number, any>()
    await Promise.all(
      Array.from(tmdbToFetch.entries()).map(async ([tmdbId, mediaType]) => {
        try {
          const data = await consultarTMDB(`${mediaType}/${tmdbId}`)
          tmdbMap.set(tmdbId, { ...(data as any), _media_type: mediaType })
        } catch (e) {
          // Ignorar fallo de TMDB
        }
      })
    )

    // Mapeo final
    return await Promise.all(
      sessions.map(async (session) => ({
        id: session.id,
        dateISO: session.created_at.toISOString(),
        type: session.type.toLowerCase(),
        note: session.note,
        mood: session.mood,
        stage: session.stage,
        hasOrder: session.type !== "single",
        films: await Promise.all(
          session.entries.map(async (entry) => {
            const tmdbData = entry.movies_ref?.tmdb_id
              ? tmdbMap.get(entry.movies_ref.tmdb_id)
              : null

            // Recuperar reseña vinculada manualmente si no hay relación formal en Prisma
            const matchingReview = await prisma.reviews.findFirst({
              where: { user_id: userId, movie_id: entry.movie_id },
              orderBy: { created_at: "desc" },
            })

            return {
              id: entry.id,
              title:
                tmdbData?.title || tmdbData?.name || `Obra ${entry.movie_id}`,
              year:
                tmdbData?.release_date || tmdbData?.first_air_date
                  ? parseInt(
                      (tmdbData.release_date || tmdbData.first_air_date).split(
                        "-"
                      )[0]
                    )
                  : null,
              director: "TMDB Auth",
              poster: tmdbData?.poster_path
                ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
                : "https://images.unsplash.com/photo-1698159929266-28e8e8ef6b33?w=300&q=80",
              rating: matchingReview ? Number(matchingReview.rating) : 0,
              media_type: entry.movies_ref?.media_type || "movie",
            }
          })
        ),
      }))
    )
  }
}

export const diaryRepository = new DiaryRepository()
