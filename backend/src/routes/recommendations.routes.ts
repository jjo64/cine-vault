/**
 * @file recommendations.routes.ts
 * @description Motor de recomendaciones personalizadas de CineVault.
 * Utiliza el historial del Vault, Diario y Reseñas del usuario para sugerir
 * nuevos títulos y directores afines mediante integración con la API de TMDB.
 * 
 * @note Este archivo contiene lógica de negocio compleja que será extraída
 * a RecommendationController y RecommendationService en la Fase 5.
 */

import { Router } from "express"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import { prisma } from "../lib/prisma.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * HELPERS Y CONSTANTES (Serán movidos a un Service en Fase 5)
 * ---------------------------------------------------------------------------
 */

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
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
      user: { id: number; username: string; avatar_url: string | null }
      movie: { id: number; tmdb_id: number }
    }

const curatedFallbackDirectors = [
  { name: "Chantal Akerman", reason: "Cine de observación y riesgo formal" },
  { name: "Andrei Tarkovsky", reason: "Poesía visual y tempo contemplativo" },
  { name: "Agnès Varda", reason: "Mirada íntima y documental sensible" },
  { name: "Apichatpong Weerasethakul", reason: "Narrativas hipnóticas y sensoriales" },
]

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: RECOMENDACIONES DE CONTENIDO
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /recommendations/for-you:
 *   get:
 *     summary: Obtener flujo personalizado de películas y reseñas sugeridas
 *     tags: [Recomendaciones]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/for-you",
  middlewareAutenticacion,
  manejadorAsincrono(async (req, res) => {
    const viewerId = req.user!.user_id
    const page = Math.max(1, toNumber(req.query.page, 1))
    const limit = 20

    // Recuperar semillas del historial del usuario
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
        ...vaultEntries.map((e) => e.movies_ref.tmdb_id),
        ...diaryEntries.map((e) => e.movies_ref.tmdb_id),
        ...ownReviews.map((e) => e.movies_ref.tmdb_id),
      ])
    ).slice(0, 5)

    const recommendedMovies: RecommendationItem[] = []

    if (seedTmdbIds.length > 0) {
      const results = await Promise.all(
        seedTmdbIds.map(async (tmdbId) => {
          try {
            const data = (await consultarTMDB(`movie/${tmdbId}/recommendations`, { page: "1" })) as any
            return Array.isArray(data.results) ? data.results : []
          } catch { return [] }
        })
      )

      const seen = new Set<number>()
      for (const item of results.flat()) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        recommendedMovies.push({
          id: `movie-${item.id}`,
          type: "movie",
          movie: {
            id: item.id,
            title: item.title || "Sin título",
            year: item.release_date ? Number(item.release_date.slice(0, 4)) || null : null,
            poster_path: item.poster_path || null,
            vote_average: Number(item.vote_average || 0),
            reason: "Porque viste películas similares",
          },
        })
        if (recommendedMovies.length >= 12) break
      }
    } else {
      // Fallback a populares si no hay historial
      const fallback = (await consultarTMDB("movie/popular", { page: "1", region: "ES" })) as any
      for (const item of (fallback.results || []).slice(0, 12)) {
        recommendedMovies.push({
          id: `movie-${item.id}`,
          type: "movie",
          movie: {
            id: item.id,
            title: item.title || "Sin título",
            year: item.release_date ? Number(item.release_date.slice(0, 4)) || null : null,
            poster_path: item.poster_path || null,
            vote_average: Number(item.vote_average || 0),
            reason: "Sugerencia global de descubrimiento",
          },
        })
      }
    }

    // Complementar con reseñas sugeridas de la comunidad
    const movieRefCandidates = await prisma.movies_ref.findMany({
      where: {
        tmdb_id: { in: recommendedMovies.map((m) => (m.type === "movie" ? m.movie.id : 0)).filter(id => id > 0) }
      },
      select: { id: true }
    })

    const reviewSuggestions = movieRefCandidates.length
      ? await prisma.reviews.findMany({
          where: {
            movie_id: { in: movieRefCandidates.map(c => c.id) },
            user_id: { not: viewerId },
            content: { not: null }
          },
          take: 8,
          orderBy: { created_at: "desc" },
          include: {
            users: { select: { id: true, username: true, avatar_url: true } },
            movies_ref: { select: { id: true, tmdb_id: true } }
          }
        })
      : []

    const items = [
      ...recommendedMovies,
      ...reviewSuggestions.map(r => ({
        id: `review-${r.id}`,
        type: "review" as const,
        review: {
          id: r.id,
          content: r.content,
          rating: r.rating ? Number(r.rating) : null,
          mode: r.mode,
          created_at: r.created_at.toISOString(),
        },
        user: { id: r.users.id, username: r.users.username, avatar_url: r.users.avatar_url },
        movie: { id: r.movies_ref.id, tmdb_id: r.movies_ref.tmdb_id }
      }))
    ]

    const start = (page - 1) * limit
    res.json({
      page,
      limit,
      total: items.length,
      has_more: start + limit < items.length,
      items: items.slice(start, start + limit),
    })
  })
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: DESCUBRIMIENTO DE AUTORES
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /recommendations/directors:
 *   get:
 *     summary: Sugerir directores basados en el contenido del Vault
 *     tags: [Recomendaciones]
 */
router.get(
  "/directors",
  middlewareAutenticacion,
  manejadorAsincrono(async (req, res) => {
    const viewerId = req.user!.user_id
    const targetUserId = toNumber(req.query.userId, viewerId)

    const refs = await prisma.vault.findMany({
      where: { user_id: targetUserId },
      include: { movies_ref: { select: { tmdb_id: true } } },
      take: 20,
      orderBy: { added_at: "desc" },
    })

    const tmdbIds = Array.from(new Set(refs.map(e => e.movies_ref.tmdb_id))).slice(0, 10)

    if (tmdbIds.length === 0) {
      return res.json({
        items: curatedFallbackDirectors.map((d, i) => ({
          id: `curated-${i}`,
          name: d.name,
          score: 0,
          reason: d.reason,
          source: "editorial"
        }))
      })
    }

    const credits = await Promise.all(
      tmdbIds.map(async (id) => {
        try {
          const data = (await consultarTMDB(`movie/${id}/credits`)) as any
          return { id, crew: data.crew || [] }
        } catch { return { id, crew: [] } }
      })
    )

    const byDirector = new Map<string, { name: string; score: number; movies: number[] }>()

    for (const e of credits) {
      for (const p of e.crew) {
        if (p.job !== "Director" || !p.name) continue
        const prev = byDirector.get(p.name) || { name: p.name, score: 0, movies: [] as number[] }
        prev.score++
        if (!prev.movies.includes(e.id)) prev.movies.push(e.id)
        byDirector.set(p.name, prev)
      }
    }

    const items = Array.from(byDirector.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((d, i) => ({
        id: `director-${i}`,
        name: d.name,
        score: d.score,
        reason: `Presente en ${d.score} obra(s) de tu colección`,
        source: "personalized",
        movie_tmdb_ids: d.movies
      }))

    res.json({ items })
  })
)

export default router
