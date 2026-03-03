import { prisma } from "../lib/prisma.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"

export const buildDiaryResponse = async (userId: number) => {
  try {
    const entries = await prisma.diary_entries.findMany({
      where: { user_id: userId },
      select: {
        movie_id: true,
        watched_date: true,
      },
      orderBy: { watched_date: "desc" },
    })

    if (entries.length === 0) {
      return null
    }

    const movieIds = entries.map((d) => d.movie_id)

    const movies = await prisma.movies_ref.findMany({
      where: {
        id: { in: movieIds },
        tmdb_id: { not: undefined },
      },
      select: {
        id: true,
        tmdb_id: true,
      },
    })

    const reviews = await prisma.reviews.findMany({
      where: { user_id: userId, movie_id: { in: movieIds } },
      select: {
        movie_id: true,
        rating: true,
        content: true,
        created_at: true,
      },
    })

    const tmdbResults = await Promise.allSettled(
      movies.map((movie) =>
        consultarTMDB(`movie/${movie.tmdb_id}`).then((data) => ({
          title: data.title,
          poster_path: data.poster_path,
        }))
      )
    )

    const tmdbMap = new Map(
      movies.map((movie, index) => {
        const result = tmdbResults[index]
        return [movie.id, result.status === "fulfilled" ? result.value : null]
      })
    )
    const movieMap = new Map(movies.map((m) => [m.id, m.tmdb_id]))
    const reviewMap = new Map(reviews.map((r) => [r.movie_id, r]))

    const result = entries.map((entry) => ({
      ...entry,
      tmdb_id: movieMap.get(entry.movie_id) ?? null,
      movie_info: tmdbMap.get(entry.movie_id) ?? null,
      review: reviewMap.get(entry.movie_id) ?? null,
    }))

    return result
  } catch (error) {
    console.error("Error getMyDiary:", error)
    return null
  }
}
