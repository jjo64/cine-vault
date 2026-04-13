import { Router } from "express"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { prisma } from "../lib/prisma.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"

const router = Router()

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

type RecommendationItem =
  | {
      id: string
      type: "movie"
      movie: {
        id: number
        title: string
        year: number | null
        poster_path: string | null
        vote_average: number
        reason: string
      }
    }
  | {
      id: string
      type: "review"
      review: {
        id: number
        content: string | null
        rating: number | null
        mode: string
        created_at: string
      }
      user: {
        id: number
        username: string
        avatar_url: string | null
      }
      movie: {
        id: number
        tmdb_id: number
      }
    }

const curatedFallbackDirectors = [
  { name: "Chantal Akerman", reason: "Cine de observación y riesgo formal" },
  { name: "Andrei Tarkovsky", reason: "Poesía visual y tempo contemplativo" },
  { name: "Agnès Varda", reason: "Mirada íntima y documental sensible" },
  {
    name: "Apichatpong Weerasethakul",
    reason: "Narrativas hipnóticas y sensoriales",
  },
]

router.get(
  "/for-you",
  middlewareAutenticacion,
  manejadorAsincrono(async (req, res) => {
    const viewerId = req.user!.user_id
    const page = Math.max(1, toNumber(req.query.page, 1))
    const limit = 20

    const [vaultEntries, diaryEntries, ownReviews] = await Promise.all([
      prisma.vault.findMany({
        where: { user_id: viewerId },
        orderBy: { added_at: "desc" },
        take: 12,
        include: { movies_ref: { select: { id: true, tmdb_id: true } } },
      }),
      prisma.diary_entries.findMany({
        where: { user_id: viewerId },
        orderBy: { id: "desc" },
        take: 12,
        include: { movies_ref: { select: { id: true, tmdb_id: true } } },
      }),
      prisma.reviews.findMany({
        where: { user_id: viewerId },
        orderBy: { created_at: "desc" },
        take: 12,
        include: { movies_ref: { select: { id: true, tmdb_id: true } } },
      }),
    ])

    const seedTmdbIds = Array.from(
      new Set([
        ...vaultEntries.map((entry) => entry.movies_ref.tmdb_id),
        ...diaryEntries.map((entry) => entry.movies_ref.tmdb_id),
        ...ownReviews.map((entry) => entry.movies_ref.tmdb_id),
      ])
    ).slice(0, 5)

    const recommendedMovies: RecommendationItem[] = []
    if (seedTmdbIds.length > 0) {
      const recommendationPages = await Promise.all(
        seedTmdbIds.map(async (tmdbId) => {
          try {
            const payload = (await consultarTMDB(
              `movie/${tmdbId}/recommendations`,
              {
                page: "1",
              }
            )) as {
              results?: Array<{
                id: number
                title?: string
                release_date?: string
                poster_path?: string | null
                vote_average?: number
              }>
            }
            return Array.isArray(payload.results) ? payload.results : []
          } catch {
            return []
          }
        })
      )

      const merged = recommendationPages.flat()
      const seen = new Set<number>()
      for (const item of merged) {
        if (seen.has(item.id)) continue
        seen.add(item.id)

        recommendedMovies.push({
          id: `movie-${item.id}`,
          type: "movie",
          movie: {
            id: item.id,
            title: item.title || "Sin título",
            year: item.release_date
              ? Number(item.release_date.slice(0, 4)) || null
              : null,
            poster_path: item.poster_path || null,
            vote_average: Number(item.vote_average || 0),
            reason: "Basada en tu historial reciente",
          },
        })

        if (recommendedMovies.length >= 12) break
      }
    }

    if (recommendedMovies.length === 0) {
      const fallback = (await consultarTMDB("movie/popular", {
        page: "1",
        region: "ES",
      })) as {
        results?: Array<{
          id: number
          title?: string
          release_date?: string
          poster_path?: string | null
          vote_average?: number
        }>
      }

      for (const item of Array.isArray(fallback.results)
        ? fallback.results.slice(0, 12)
        : []) {
        recommendedMovies.push({
          id: `movie-${item.id}`,
          type: "movie",
          movie: {
            id: item.id,
            title: item.title || "Sin título",
            year: item.release_date
              ? Number(item.release_date.slice(0, 4)) || null
              : null,
            poster_path: item.poster_path || null,
            vote_average: Number(item.vote_average || 0),
            reason: "Selección general de descubrimiento",
          },
        })
      }
    }

    const movieRefCandidates = await prisma.movies_ref.findMany({
      where: {
        tmdb_id: {
          in: recommendedMovies
            .map((item) => (item.type === "movie" ? item.movie.id : null))
            .filter((value): value is number => Number.isFinite(value)),
        },
      },
      select: { id: true },
    })

    const reviewSuggestions = movieRefCandidates.length
      ? await prisma.reviews.findMany({
          where: {
            movie_id: { in: movieRefCandidates.map((item) => item.id) },
            user_id: { not: viewerId },
            content: { not: null },
          },
          take: 8,
          orderBy: { created_at: "desc" },
          include: {
            users: { select: { id: true, username: true, avatar_url: true } },
            movies_ref: { select: { id: true, tmdb_id: true } },
          },
        })
      : []

    const reviewItems: RecommendationItem[] = reviewSuggestions.map(
      (entry) => ({
        id: `review-${entry.id}`,
        type: "review",
        review: {
          id: entry.id,
          content: entry.content,
          rating: entry.rating ? Number(entry.rating) : null,
          mode: entry.mode,
          created_at: entry.created_at.toISOString(),
        },
        user: {
          id: entry.users.id,
          username: entry.users.username,
          avatar_url: entry.users.avatar_url || null,
        },
        movie: {
          id: entry.movies_ref.id,
          tmdb_id: entry.movies_ref.tmdb_id,
        },
      })
    )

    const mergedItems = [...recommendedMovies, ...reviewItems]
    const start = (page - 1) * limit
    const items = mergedItems.slice(start, start + limit)

    res.json({
      page,
      limit,
      total: mergedItems.length,
      has_more: start + limit < mergedItems.length,
      items,
    })
  })
)

router.get(
  "/directors",
  middlewareAutenticacion,
  manejadorAsincrono(async (req, res) => {
    const viewerId = req.user!.user_id
    const queryUserId = toNumber(req.query.userId, viewerId)
    const targetUserId = Number.isFinite(queryUserId) ? queryUserId : viewerId

    const refs = await prisma.vault.findMany({
      where: { user_id: targetUserId },
      include: { movies_ref: { select: { tmdb_id: true } } },
      take: 20,
      orderBy: { added_at: "desc" },
    })

    const tmdbIds = Array.from(
      new Set(refs.map((entry) => entry.movies_ref.tmdb_id))
    ).slice(0, 10)

    if (tmdbIds.length === 0) {
      return res.json({
        items: curatedFallbackDirectors.map((item, index) => ({
          id: `curated-${index}`,
          name: item.name,
          score: 0,
          reason: item.reason,
          source: "editorial",
        })),
      })
    }

    const creditsPayload = await Promise.all(
      tmdbIds.map(async (tmdbId) => {
        try {
          const payload = (await consultarTMDB(`movie/${tmdbId}/credits`)) as {
            crew?: Array<{ id: number; name?: string; job?: string }>
          }
          return {
            tmdbId,
            crew: Array.isArray(payload.crew) ? payload.crew : [],
          }
        } catch {
          return {
            tmdbId,
            crew: [] as Array<{ id: number; name?: string; job?: string }>,
          }
        }
      })
    )

    const byDirector = new Map<
      string,
      { name: string; score: number; movies: number[] }
    >()

    for (const entry of creditsPayload) {
      for (const person of entry.crew) {
        if (person.job !== "Director" || !person.name) continue
        const previous = byDirector.get(person.name)
        if (!previous) {
          byDirector.set(person.name, {
            name: person.name,
            score: 1,
            movies: [entry.tmdbId],
          })
          continue
        }

        previous.score += 1
        if (!previous.movies.includes(entry.tmdbId)) {
          previous.movies.push(entry.tmdbId)
        }
      }
    }

    const items = Array.from(byDirector.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((item, index) => ({
        id: `director-${index}`,
        name: item.name,
        score: item.score,
        reason: `Aparece en ${item.score} película${item.score > 1 ? "s" : ""} de tu vault`,
        source: "personalized",
        movie_tmdb_ids: item.movies,
      }))

    res.json({ items })
  })
)

export default router
