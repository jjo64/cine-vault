import { prisma } from "../lib/prisma.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"

export const buildWatchlistResponse = async (userId: number) => {
  try {
    const watchlist = await prisma.watchlist.findMany({
      where: { user_id: userId },
      select: {
        movie_id: true,
        added_at: true,
      },
    })

    if (!watchlist) return null

    const movieIds = watchlist.map((w) => w.movie_id)

    const movies = await prisma.movies_ref.findMany({
      where: { id: { in: movieIds } },
      select: {
        id: true,
        tmdb_id: true,
      },
    })

    const tmdbResults = await Promise.allSettled(
      movies.map((movie) =>
        consultarTMDB(`movie/${movie.tmdb_id}`).then((data: any) => ({
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

    const result = watchlist.map((w) => ({
      ...w,
      movie_info: tmdbMap.get(w.movie_id) ?? null,
    }))

    return result
  } catch (error) {
    console.error("Error getMyWatchlist:", error)
    return null
  }
}
