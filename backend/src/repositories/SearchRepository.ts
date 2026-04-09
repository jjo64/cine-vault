import { prisma } from "../lib/prisma.js"

export const searchRepository = {
  findMovieRefCounts: (tmdbIds: number[]) =>
    prisma.movies_ref.findMany({
      where: { tmdb_id: { in: tmdbIds } },
      select: {
        tmdb_id: true,
        _count: {
          select: { vault: true, reviews: true, watchlist: true },
        },
      },
    }),
}