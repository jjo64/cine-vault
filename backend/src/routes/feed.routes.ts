import { Router } from "express"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { prisma } from "../lib/prisma.js"

const router = Router()

const toNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

router.get(
  "/",
  middlewareAutenticacion,
  manejadorAsincrono(async (req, res) => {
    const viewerId = req.user!.user_id
    const page = Math.max(1, toNumber(req.query.page, 1))
    const limit = Math.min(30, Math.max(1, toNumber(req.query.limit, 10)))

    const following = await prisma.follows.findMany({
      where: { follower_id: viewerId },
      select: { following_id: true },
    })

    const sourceUserIds = [viewerId, ...following.map((entry) => entry.following_id)]

    const [reviews, vaultEntries, watchlistEntries] = await Promise.all([
      prisma.reviews.findMany({
        where: { user_id: { in: sourceUserIds } },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true } },
        },
        take: 120,
        orderBy: { created_at: "desc" },
      }),
      prisma.vault.findMany({
        where: { user_id: { in: sourceUserIds } },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true } },
        },
        take: 120,
        orderBy: { added_at: "desc" },
      }),
      prisma.watchlist.findMany({
        where: { user_id: { in: sourceUserIds } },
        include: {
          users: { select: { id: true, username: true, avatar_url: true } },
          movies_ref: { select: { id: true, tmdb_id: true } },
        },
        take: 120,
        orderBy: { added_at: "desc" },
      }),
    ])

    const items = [
      ...reviews.map((entry) => ({
        id: `review-${entry.id}`,
        type: "review",
        created_at: entry.created_at.toISOString(),
        user: {
          id: entry.users.id,
          username: entry.users.username,
          avatar_url: entry.users.avatar_url || null,
        },
        movie: {
          id: entry.movies_ref.id,
          tmdb_id: entry.movies_ref.tmdb_id,
        },
        review: {
          id: entry.id,
          content: entry.content,
          rating: entry.rating ? Number(entry.rating) : null,
          mode: entry.mode,
          likes: entry.likes || 0,
        },
      })),
      ...vaultEntries.map((entry) => ({
        id: `vault-${entry.id}`,
        type: "vault",
        created_at: entry.added_at.toISOString(),
        user: {
          id: entry.users.id,
          username: entry.users.username,
          avatar_url: entry.users.avatar_url || null,
        },
        movie: {
          id: entry.movies_ref.id,
          tmdb_id: entry.movies_ref.tmdb_id,
        },
      })),
      ...watchlistEntries.map((entry) => ({
        id: `watchlist-${entry.id}`,
        type: "watchlist",
        created_at: entry.added_at.toISOString(),
        user: {
          id: entry.users.id,
          username: entry.users.username,
          avatar_url: entry.users.avatar_url || null,
        },
        movie: {
          id: entry.movies_ref.id,
          tmdb_id: entry.movies_ref.tmdb_id,
        },
      })),
    ]

    items.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))

    const start = (page - 1) * limit
    const paginated = items.slice(start, start + limit)

    res.json({
      page,
      limit,
      total: items.length,
      has_more: start + limit < items.length,
      items: paginated,
    })
  })
)

export default router
