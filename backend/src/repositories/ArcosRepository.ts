import { Prisma } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

export type ArcoSummaryRow = {
  id: number
  slug: string
  title: string
  description: string | null
  level: string
  is_official: number
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

export class ArcosRepository {
  listArcos() {
    return prisma.$queryRaw<ArcoSummaryRow[]>(Prisma.sql`
      SELECT
        a.id,
        a.slug,
        a.title,
        a.description,
        a.level,
        a.is_official,
        COUNT(am.id) AS film_count,
        SUM(CASE WHEN am.is_optional = 0 THEN 1 ELSE 0 END) AS required_count,
        COUNT(DISTINCT uap.user_id) AS engaged_users
      FROM arcos a
      LEFT JOIN arco_movies am ON am.arco_id = a.id
      LEFT JOIN user_arco_progress uap ON uap.arco_id = a.id
      GROUP BY a.id, a.slug, a.title, a.description, a.level, a.is_official, a.created_at
      ORDER BY a.is_official DESC, a.created_at DESC
    `)
  }

  async findArcoById(arcoId: number) {
    const rows = await prisma.$queryRaw<ArcoSummaryRow[]>(Prisma.sql`
      SELECT
        a.id,
        a.slug,
        a.title,
        a.description,
        a.level,
        a.is_official,
        COUNT(am.id) AS film_count,
        SUM(CASE WHEN am.is_optional = 0 THEN 1 ELSE 0 END) AS required_count,
        COUNT(DISTINCT uap.user_id) AS engaged_users
      FROM arcos a
      LEFT JOIN arco_movies am ON am.arco_id = a.id
      LEFT JOIN user_arco_progress uap ON uap.arco_id = a.id
      WHERE a.id = ${arcoId}
      GROUP BY a.id, a.slug, a.title, a.description, a.level, a.is_official
      LIMIT 1
    `)

    return rows[0] ?? null
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
