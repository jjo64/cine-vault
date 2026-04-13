import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

export type ArcoSummaryRow = {
  id: number
  created_by_user_id: number
  reviewed_by_user_id: number | null
  slug: string
  title: string
  description: string | null
  poster_url: string | null
  level: string
  moderation_status:
    | "draft"
    | "pending_review"
    | "approved"
    | "rejected"
    | "archived"
  review_note: string | null
  cinevault_badge: string | null
  is_official: number
  reviewed_at: Date | null
  created_at: Date
  updated_at: Date
  film_count: bigint
  required_count: bigint
  engaged_users: bigint
}

export type ArcoMovieRow = {
  movie_id: number
  order_index: number
  note: string | null
  is_optional: number
  tmdb_id: number | null
}

type CreateArcoInput = {
  created_by_user_id: number
  slug: string
  title: string
  description: string
  poster_url: string
  level: string
}

type UpdateArcoInput = {
  title: string | null
  description: string | null
  poster_url: string | null
  level: string | null
}

type ArcoMovieInsertInput = {
  movie_id: number
  order_index: number
  note: string | null
  is_optional: boolean
}

type ModerateArcoInput = {
  status: "approved" | "rejected" | "archived"
  review_note: string | null
  cinevault_badge: string | null
  reviewed_by_user_id: number
  is_official: boolean
}

const ARCO_SUMMARY_SELECT = Prisma.sql`
  SELECT
    a.id,
    a.created_by_user_id,
    a.reviewed_by_user_id,
    a.slug,
    a.title,
    a.description,
    a.poster_url,
    a.level,
    a.moderation_status,
    a.review_note,
    a.cinevault_badge,
    a.is_official,
    a.reviewed_at,
    a.created_at,
    a.updated_at,
    COUNT(am.id) AS film_count,
    SUM(CASE WHEN am.is_optional = 0 THEN 1 ELSE 0 END) AS required_count,
    COUNT(DISTINCT uap.user_id) AS engaged_users
  FROM arcos a
  LEFT JOIN arco_movies am ON am.arco_id = a.id
  LEFT JOIN user_arco_progress uap ON uap.arco_id = a.id
`

export class ArcosRepository {
  listPublicArcos() {
    return prisma.$queryRaw<ArcoSummaryRow[]>(Prisma.sql`
      ${ARCO_SUMMARY_SELECT}
      WHERE a.moderation_status = 'approved'
      GROUP BY a.id, a.created_by_user_id, a.reviewed_by_user_id, a.slug, a.title, a.description, a.poster_url, a.level, a.moderation_status, a.review_note, a.cinevault_badge, a.is_official, a.reviewed_at, a.created_at, a.updated_at
      ORDER BY a.is_official DESC, a.created_at DESC
    `)
  }

  listArcosByOwner(userId: number) {
    return prisma.$queryRaw<ArcoSummaryRow[]>(Prisma.sql`
      ${ARCO_SUMMARY_SELECT}
      WHERE a.created_by_user_id = ${userId}
      GROUP BY a.id, a.created_by_user_id, a.reviewed_by_user_id, a.slug, a.title, a.description, a.poster_url, a.level, a.moderation_status, a.review_note, a.cinevault_badge, a.is_official, a.reviewed_at, a.created_at, a.updated_at
      ORDER BY a.updated_at DESC
    `)
  }

  listArcosByModerationStatus(
    status: "pending_review" | "approved" | "rejected" | "archived"
  ) {
    return prisma.$queryRaw<ArcoSummaryRow[]>(Prisma.sql`
      ${ARCO_SUMMARY_SELECT}
      WHERE a.moderation_status = ${status}
      GROUP BY a.id, a.created_by_user_id, a.reviewed_by_user_id, a.slug, a.title, a.description, a.poster_url, a.level, a.moderation_status, a.review_note, a.cinevault_badge, a.is_official, a.reviewed_at, a.created_at, a.updated_at
      ORDER BY a.updated_at DESC
    `)
  }

  async findPublicArcoById(arcoId: number) {
    const rows = await prisma.$queryRaw<ArcoSummaryRow[]>(Prisma.sql`
      ${ARCO_SUMMARY_SELECT}
      WHERE a.id = ${arcoId} AND a.moderation_status = 'approved'
      GROUP BY a.id, a.created_by_user_id, a.reviewed_by_user_id, a.slug, a.title, a.description, a.poster_url, a.level, a.moderation_status, a.review_note, a.cinevault_badge, a.is_official, a.reviewed_at, a.created_at, a.updated_at
      LIMIT 1
    `)

    return rows[0] ?? null
  }

  async findArcoByIdForOwner(arcoId: number, userId: number) {
    const rows = await prisma.$queryRaw<ArcoSummaryRow[]>(Prisma.sql`
      ${ARCO_SUMMARY_SELECT}
      WHERE a.id = ${arcoId} AND a.created_by_user_id = ${userId}
      GROUP BY a.id, a.created_by_user_id, a.reviewed_by_user_id, a.slug, a.title, a.description, a.poster_url, a.level, a.moderation_status, a.review_note, a.cinevault_badge, a.is_official, a.reviewed_at, a.created_at, a.updated_at
      LIMIT 1
    `)

    return rows[0] ?? null
  }

  async findArcoByIdForModeration(arcoId: number) {
    const rows = await prisma.$queryRaw<ArcoSummaryRow[]>(Prisma.sql`
      ${ARCO_SUMMARY_SELECT}
      WHERE a.id = ${arcoId}
      GROUP BY a.id, a.created_by_user_id, a.reviewed_by_user_id, a.slug, a.title, a.description, a.poster_url, a.level, a.moderation_status, a.review_note, a.cinevault_badge, a.is_official, a.reviewed_at, a.created_at, a.updated_at
      LIMIT 1
    `)

    return rows[0] ?? null
  }

  async existsSlug(slug: string) {
    const rows = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
      SELECT id
      FROM arcos
      WHERE slug = ${slug}
      LIMIT 1
    `)

    return rows.length > 0
  }

  async createArcoDraft(data: CreateArcoInput) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO arcos (
        created_by_user_id,
        slug,
        title,
        description,
        poster_url,
        level,
        moderation_status,
        is_official
      )
      VALUES (
        ${data.created_by_user_id},
        ${data.slug},
        ${data.title},
        ${data.description},
        ${data.poster_url},
        ${data.level},
        'draft',
        0
      )
    `)

    const rows = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
      SELECT id
      FROM arcos
      WHERE slug = ${data.slug} AND created_by_user_id = ${data.created_by_user_id}
      ORDER BY id DESC
      LIMIT 1
    `)

    return rows[0]?.id ?? null
  }

  async updateArcoDraft(arcoId: number, userId: number, data: UpdateArcoInput) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE arcos
      SET
        title = CASE WHEN ${data.title} IS NULL THEN title ELSE ${data.title} END,
        description = CASE WHEN ${data.description} IS NULL THEN description ELSE ${data.description} END,
        poster_url = CASE WHEN ${data.poster_url} IS NULL THEN poster_url ELSE ${data.poster_url} END,
        level = CASE WHEN ${data.level} IS NULL THEN level ELSE ${data.level} END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${arcoId}
        AND created_by_user_id = ${userId}
        AND moderation_status IN ('draft', 'rejected')
    `)
  }

  async replaceArcoMovies(arcoId: number, movies: ArcoMovieInsertInput[]) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM arco_movies
        WHERE arco_id = ${arcoId}
      `)

      if (!movies.length) return

      const values = movies.map(
        (movie) =>
          Prisma.sql`(${arcoId}, ${movie.movie_id}, ${movie.order_index}, ${movie.note}, ${movie.is_optional})`
      )

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO arco_movies (arco_id, movie_id, order_index, note, is_optional)
        VALUES ${Prisma.join(values)}
      `)
    })
  }

  async countArcoMovies(arcoId: number) {
    const rows = await prisma.$queryRaw<{ total: bigint }[]>(Prisma.sql`
      SELECT COUNT(*) AS total
      FROM arco_movies
      WHERE arco_id = ${arcoId}
    `)

    return Number(rows[0]?.total ?? 0)
  }

  async sendArcoToReview(arcoId: number, userId: number) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE arcos
      SET
        moderation_status = 'pending_review',
        review_note = NULL,
        cinevault_badge = NULL,
        reviewed_by_user_id = NULL,
        reviewed_at = NULL,
        is_official = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${arcoId}
        AND created_by_user_id = ${userId}
        AND moderation_status IN ('draft', 'rejected')
    `)
  }

  async moderateArco(arcoId: number, input: ModerateArcoInput) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE arcos
      SET
        moderation_status = ${input.status},
        review_note = ${input.review_note},
        cinevault_badge = ${input.cinevault_badge},
        reviewed_by_user_id = ${input.reviewed_by_user_id},
        reviewed_at = CURRENT_TIMESTAMP,
        is_official = ${input.is_official},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${arcoId}
    `)
  }

  listArcoMovies(arcoId: number) {
    return prisma.$queryRaw<ArcoMovieRow[]>(Prisma.sql`
      SELECT
        am.movie_id,
        am.order_index,
        am.note,
        am.is_optional,
        mr.tmdb_id
      FROM arco_movies am
      INNER JOIN movies_ref mr ON mr.id = am.movie_id
      WHERE am.arco_id = ${arcoId}
      ORDER BY am.order_index ASC
    `)
  }

  listUserProgressMovieIds(userId: number, arcoId: number) {
    return prisma.$queryRaw<{ movie_id: number }[]>(Prisma.sql`
      SELECT movie_id
      FROM user_arco_progress
      WHERE user_id = ${userId} AND arco_id = ${arcoId}
    `)
  }

  async hasMovieInArco(arcoId: number, movieId: number) {
    const rows = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
      SELECT id
      FROM arco_movies
      WHERE arco_id = ${arcoId} AND movie_id = ${movieId}
      LIMIT 1
    `)

    return rows.length > 0
  }

  async createProgress(userId: number, arcoId: number, movieId: number) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO user_arco_progress (user_id, arco_id, movie_id)
      VALUES (${userId}, ${arcoId}, ${movieId})
      ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP
    `)
  }
}

export const arcosRepository = new ArcosRepository()
