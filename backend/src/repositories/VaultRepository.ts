/**
 * @file VaultRepository.ts
 * @description Repositorio maestro para la gestión de la "Bóveda" (Vault).
 * Administra tanto la colección física de películas como el componente editorial
 * ("Vault Social") donde los usuarios publican reflexiones, críticas y recomendaciones.
 * Combina la eficiencia de Prisma para CRUD básico con SQL nativo para JOINS complejos
 * e hidratación concurrente de metadatos externos de TMDB.
 */

import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"

// --- Definiciones de Tipado y Contratos ---

/**
 * Entrada de la bóveda hidratada para la capa de presentación.
 * Fusiona el registro local con arte gráfico y metadatos de TMDB.
 */
export interface RichVaultEntry {
  movie_id: number
  /** Identificador externo de referencia */
  tmdb_id: number | null
  /** Datos visuales y técnicos obtenidos en tiempo real */
  movie_info: {
    title: string
    poster_path: string
    release_date: string
  } | null
  added_at: Date | null
}

/**
 * Taxonomía de contenidos editoriales permitidos en el Vault Social.
 */
export type VaultSocialEntryType =
  | "reflexion" // Pensamientos breves sobre una obra
  | "edit" // Contenido audiovisual o montajes vinculados
  | "critica" // Análisis profundo (distinto del rating rápido)
  | "recomendacion" // Prescripción directa a la comunidad

/**
 * Representación de una publicación editorial proyectada desde base de datos.
 */
export type VaultSocialEntryRow = {
  id: number
  user_id: number
  movie_id: number | null
  tmdb_id: number | null
  media_type: string | null
  entry_type: VaultSocialEntryType
  title: string
  content: string
  /** Imagen de portada personalizada para el artículo o reflexión */
  cover_url: string | null
  /** Etiqueta de tiempo estimado (ej: "Lectura 5 min") */
  duration_label: string | null
  likes_count: number
  comments_count: number
  /** Control de visibilidad (Legacy: 0/1 mapped to boolean) */
  is_public: number
  created_at: Date
  updated_at: Date
}

/**
 * Interfaz IVaultRepository
 * Contrato de persistencia para la gestión de colecciones y redacción editorial.
 */
export interface IVaultRepository {
  /** Verifica la membresía de una película en la bóveda de un usuario */
  exists(userId: number, movieId: number): Promise<boolean>
  /** Integra una obra a la colección permanente */
  create(userId: number, movieId: number): Promise<void>
  /** Revoca una obra de la colección */
  deleteByMovieId(userId: number, movieId: number): Promise<void>
  /** Genera la vista de galería enriquecida (Metadatos + Local) */
  buildRichResponse(userId: number): Promise<RichVaultEntry[]>
  /** Listado paginado de publicaciones del diario social */
  listSocialEntries(params: {
    userId: number
    page: number
    limit: number
    includePrivate: boolean
  }): Promise<{ items: VaultSocialEntryRow[]; total: number }>
  /** Persiste una nueva pieza editorial */
  createSocialEntry(input: {
    userId: number
    movieId: number | null
    entryType: VaultSocialEntryType
    title: string
    content: string
    coverUrl: string | null
    durationLabel: string | null
    isPublic: boolean
  }): Promise<number | null>
  /** Actualiza parcialmente una publicación existente */
  updateSocialEntry(input: {
    id: number
    userId: number
    movieId: number | null
    entryType: VaultSocialEntryType | null
    title: string | null
    content: string | null
    coverUrl: string | null
    durationLabel: string | null
    isPublic: boolean | null
  }): Promise<void>
  /** Localiza una publicación verificando la propiedad del autor */
  getSocialEntryByIdForOwner(
    id: number,
    userId: number
  ): Promise<VaultSocialEntryRow | null>
  /** Elimina contenido editorial de forma permanente */
  deleteSocialEntry(id: number, userId: number): Promise<void>
}

/**
 * Repositorio de Bóveda
 * Implementación que unifica la gestión de colecciones y el componente social del Vault.
 */
export class VaultRepository implements IVaultRepository {
  /**
   * Determina si el recurso cinematográfico ya reside en la bóveda del usuario.
   */
  async exists(userId: number, movieId: number) {
    const item = await prisma.vault.findFirst({
      where: { user_id: userId, movie_id: movieId },
      select: { id: true },
    })
    return item !== null
  }

  /**
   * Persiste la vinculación de una película con la bóveda del usuario.
   */
  async create(userId: number, movieId: number) {
    await prisma.vault.create({
      data: { user_id: userId, movie_id: movieId },
    })
  }

  /**
   * Desvincula una obra de la colección.
   */
  async deleteByMovieId(userId: number, movieId: number) {
    await prisma.vault.deleteMany({
      where: { user_id: userId, movie_id: movieId },
    })
  }

  /**
   * Construye el mosaico visual de la bóveda del usuario.
   * Ejecuta la hidratación de metadatos desde TMDB mediante concurrencia protegida
   * (Promise.allSettled) para garantizar la disponibilidad incluso ante fallos de la API externa.
   *
   * @param userId - Propietario de la colección.
   */
  async buildRichResponse(userId: number): Promise<RichVaultEntry[]> {
    const entries = await prisma.vault.findMany({
      where: { user_id: userId },
      select: { movie_id: true, added_at: true },
      orderBy: [{ added_at: "desc" }, { id: "desc" }],
    })

    if (entries.length === 0) return []

    const movieIds = entries.map((entry) => entry.movie_id)

    const movies = await prisma.movies_ref.findMany({
      where: { id: { in: movieIds } },
      select: { id: true, tmdb_id: true, media_type: true },
    })

    // Consultas concurrentes a TMDB para reconstruir el contexto visual
    const tmdbResults = await Promise.allSettled(
      movies.map((movie) => {
        const isTv = movie.media_type === "tv"
        const endpoint = isTv ? `tv/${movie.tmdb_id}` : `movie/${movie.tmdb_id}`

        return consultarTMDB(endpoint, { append_to_response: "credits" }).then(
          (data: unknown) => {
            const payload = data as {
              title?: string
              name?: string
              poster_path?: string
              release_date?: string
              first_air_date?: string
              credits?: { crew: Array<{ job: string; name: string }> }
            }

            const title = payload.title || payload.name || ""
            const date = payload.release_date || payload.first_air_date || ""
            const year = date ? parseInt(date.split("-")[0]) : null

            return {
              title,
              poster_path: payload.poster_path || "",
              release_date: date,
              director:
                payload.credits?.crew?.find(
                  (p) => p.job === "Director" || p.job === "Executive Producer"
                )?.name || "Desconocido",
              year,
              media_type: movie.media_type,
            }
          }
        )
      })
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

  /**
   * Recupera el feed editorial (Social Vault) del usuario.
   * Proporciona soporte para paginación y filtrado de visibilidad (público vs privado).
   */
  async listSocialEntries(params: {
    userId: number
    page: number
    limit: number
    includePrivate: boolean
  }) {
    const offset = (params.page - 1) * params.limit

    const visibilitySql = params.includePrivate
      ? Prisma.empty
      : Prisma.sql`AND vse.is_public = 1`

    const [items, totals] = await Promise.all([
      prisma.$queryRaw<VaultSocialEntryRow[]>(Prisma.sql`
        SELECT
          vse.id,
          vse.user_id,
          vse.movie_id,
          mr.tmdb_id,
          mr.media_type,
          vse.entry_type,
          vse.title,
          vse.content,
          vse.cover_url,
          vse.duration_label,
          vse.likes_count,
          vse.comments_count,
          vse.is_public,
          vse.created_at,
          vse.updated_at
        FROM vault_social_entries vse
        LEFT JOIN movies_ref mr ON mr.id = vse.movie_id
        WHERE vse.user_id = ${params.userId}
          ${visibilitySql}
        ORDER BY vse.created_at DESC
        LIMIT ${params.limit} OFFSET ${offset}
      `),
      prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*) AS total
        FROM vault_social_entries vse
        WHERE vse.user_id = ${params.userId}
          ${visibilitySql}
      `),
    ])

    return {
      items,
      total: Number(totals[0]?.total ?? 0),
    }
  }

  /**
   * Persiste una nueva adición social al Vault.
   * Utiliza SQL nativo para garantizar el orden de inserción y recuperación inmediata de ID.
   */
  async createSocialEntry(input: {
    userId: number
    movieId: number | null
    entryType: VaultSocialEntryType
    title: string
    content: string
    coverUrl: string | null
    durationLabel: string | null
    isPublic: boolean
  }) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO vault_social_entries (
        user_id,
        movie_id,
        entry_type,
        title,
        content,
        cover_url,
        duration_label,
        is_public
      )
      VALUES (
        ${input.userId},
        ${input.movieId},
        ${input.entryType},
        ${input.title},
        ${input.content},
        ${input.coverUrl},
        ${input.durationLabel},
        ${input.isPublic}
      )
    `)

    // Obtención del puntero recién creado
    const rows = await prisma.$queryRaw<Array<{ id: number }>>(Prisma.sql`
      SELECT id
      FROM vault_social_entries
      WHERE user_id = ${input.userId}
      ORDER BY id DESC
      LIMIT 1
    `)

    return rows[0]?.id ?? null
  }

  /**
   * Realiza una actualización selectiva (Coalesce) mediante SQL CASE.
   * Optimiza el rendimiento evitando múltiples llamadas de actualización.
   */
  async updateSocialEntry(input: {
    id: number
    userId: number
    movieId: number | null
    entryType: VaultSocialEntryType | null
    title: string | null
    content: string | null
    coverUrl: string | null
    durationLabel: string | null
    isPublic: boolean | null
  }) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE vault_social_entries
      SET
        movie_id = CASE WHEN ${input.movieId} IS NULL THEN movie_id ELSE ${input.movieId} END,
        entry_type = CASE WHEN ${input.entryType} IS NULL THEN entry_type ELSE ${input.entryType} END,
        title = CASE WHEN ${input.title} IS NULL THEN title ELSE ${input.title} END,
        content = CASE WHEN ${input.content} IS NULL THEN content ELSE ${input.content} END,
        cover_url = CASE WHEN ${input.coverUrl} IS NULL THEN cover_url ELSE ${input.coverUrl} END,
        duration_label = CASE WHEN ${input.durationLabel} IS NULL THEN duration_label ELSE ${input.durationLabel} END,
        is_public = CASE WHEN ${input.isPublic} IS NULL THEN is_public ELSE ${input.isPublic} END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${input.id} AND user_id = ${input.userId}
    `)
  }

  /**
   * Recupera la trazabilidad completa de una publicación verificando la propiedad.
   */
  async getSocialEntryByIdForOwner(id: number, userId: number) {
    const rows = await prisma.$queryRaw<VaultSocialEntryRow[]>(Prisma.sql`
      SELECT
        vse.id,
        vse.user_id,
        vse.movie_id,
        mr.tmdb_id,
        mr.media_type,
        vse.entry_type,
        vse.title,
        vse.content,
        vse.cover_url,
        vse.duration_label,
        vse.likes_count,
        vse.comments_count,
        vse.is_public,
        vse.created_at,
        vse.updated_at
      FROM vault_social_entries vse
      LEFT JOIN movies_ref mr ON mr.id = vse.movie_id
      WHERE vse.id = ${id} AND vse.user_id = ${userId}
      LIMIT 1
    `)

    return rows[0] ?? null
  }

  /**
   * Ejecuta la eliminación física de una entrada social.
   */
  async deleteSocialEntry(id: number, userId: number) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM vault_social_entries
      WHERE id = ${id} AND user_id = ${userId}
    `)
  }
}

/** Instancia maestra del repositorio de Bóveda */
export const vaultRepository = new VaultRepository()
