import { Prisma } from "@prisma/client"
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

export type VaultSocialEntryType = "reflexion" | "edit" | "critica" | "recomendacion"

export type VaultSocialEntryRow = {
  id: number
  user_id: number
  movie_id: number | null
  tmdb_id: number | null
  entry_type: VaultSocialEntryType
  title: string
  content: string
  cover_url: string | null
  duration_label: string | null
  likes_count: number
  comments_count: number
  is_public: number
  created_at: Date
  updated_at: Date
}

export interface IVaultRepository {
  exists(userId: number, movieId: number): Promise<boolean>
  create(userId: number, movieId: number): Promise<void>
  deleteByMovieId(userId: number, movieId: number): Promise<void>
  buildRichResponse(userId: number): Promise<RichVaultEntry[]>
  listSocialEntries(params: {
    userId: number
    page: number
    limit: number
    includePrivate: boolean
  }): Promise<{ items: VaultSocialEntryRow[]; total: number }>
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
  getSocialEntryByIdForOwner(id: number, userId: number): Promise<VaultSocialEntryRow | null>
  deleteSocialEntry(id: number, userId: number): Promise<void>
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

    const rows = await prisma.$queryRaw<Array<{ id: number }>>(Prisma.sql`
      SELECT id
      FROM vault_social_entries
      WHERE user_id = ${input.userId}
      ORDER BY id DESC
      LIMIT 1
    `)

    return rows[0]?.id ?? null
  }

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

  async getSocialEntryByIdForOwner(id: number, userId: number) {
    const rows = await prisma.$queryRaw<VaultSocialEntryRow[]>(Prisma.sql`
      SELECT
        vse.id,
        vse.user_id,
        vse.movie_id,
        mr.tmdb_id,
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

  async deleteSocialEntry(id: number, userId: number) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM vault_social_entries
      WHERE id = ${id} AND user_id = ${userId}
    `)
  }
}

export const vaultRepository = new VaultRepository()
