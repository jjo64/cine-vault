import { afterAll, beforeAll, describe, expect, it } from "vitest"
import request from "supertest"
import express from "express"
import cookieParser from "cookie-parser"
import { prisma } from "../../lib/prisma.js"
import { crearTokenAcceso } from "../../lib/tokens.js"
import rutasReviews from "../../routes/reviews.routes.js"
import rutasActivity from "../../routes/activity.routes.js"
import rutasFeed from "../../routes/feed.routes.js"
import rutasVault from "../../routes/vault.routes.js"
import { manejadorErrores } from "../../middlewares/error.middlewares.js"

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use("/api/reviews", rutasReviews)
app.use("/api/activity", rutasActivity)
app.use("/api/feed", rutasFeed)
app.use("/api/vault", rutasVault)
app.use(manejadorErrores)

let userId = 0
let token = ""
let movieRefId = 0
let username = ""
let vaultEntryId = 0

beforeAll(async () => {
  username = `social_${Date.now()}`

  const user = await prisma.users.create({
    data: {
      username,
      email: `${username}@cinevault.com`,
      password: "hashedpassword",
      is_verified: true,
    },
  })
  userId = user.id
  token = crearTokenAcceso(user.id, user.role!, user.is_verified)

  const movieRef = await prisma.movies_ref.create({
    data: {
      tmdb_id: Math.floor(Math.random() * 9999999),
      slug: `${Date.now()}-movie-test`,
    },
  })
  movieRefId = movieRef.id

  // Primera reseña (más antigua)
  await prisma.reviews.create({
    data: {
      user_id: userId,
      movie_id: movieRefId,
      mode: "ESTANDAR",
      content: "Review para endpoint de hilo",
      veredicto: "Muy recomendable",
      rating: 4.5,
      created_at: new Date(Date.now() - 10000), // Asegurar que es más antigua
    },
  })

  // Segunda reseña (más nueva)
  await prisma.reviews.create({
    data: {
      user_id: userId,
      movie_id: movieRefId,
      mode: "RAPIDO",
      content: "Segunda review para la misma pelicula",
      rating: 5.0,
      created_at: new Date(),
    },
  })

  // Entrada de vault social
  await prisma.$executeRaw`
    INSERT INTO vault_social_entries (user_id, entry_type, title, content, is_public)
    VALUES (${userId}, 'reflexion', 'Mi primer vault', 'Contenido del vault', 1)
  `
  const vaultEntries = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM vault_social_entries WHERE user_id = ${userId} ORDER BY id DESC LIMIT 1
  `
  vaultEntryId = vaultEntries[0]?.id || 0
})

afterAll(async () => {
  await prisma.review_comments.deleteMany({
    where: {
      reviews: {
        user_id: userId,
      },
    },
  })
  await prisma.reviews.deleteMany({ where: { user_id: userId } })
  await prisma.vault.deleteMany({ where: { user_id: userId } })
  await prisma.$executeRaw`DELETE FROM vault_social_entries WHERE user_id = ${userId}`
  await prisma.watchlist.deleteMany({ where: { user_id: userId } })
  await prisma.diary_entries.deleteMany({ where: { user_id: userId } })
  await prisma.movies_ref.deleteMany({ where: { id: movieRefId } })
  await prisma.users.deleteMany({ where: { id: userId } })
})

describe("Sprint social endpoints", () => {
  it("GET /api/reviews/:username/:movieSlug devuelve hilo de reseña (por defecto la primera)", async () => {
    const response = await request(app).get(
      `/api/reviews/${username}/${movieRefId}`
    )

    expect(response.status).toBe(200)
    expect(response.body.user_id).toBe(userId)
    expect(response.body.movie_id).toBe(movieRefId)
    expect(response.body.content).toBe("Review para endpoint de hilo")
  })

  it("GET /api/reviews/:username/:movieSlug?index=1 devuelve la segunda reseña", async () => {
    const response = await request(app).get(
      `/api/reviews/${username}/${movieRefId}?index=1`
    )

    expect(response.status).toBe(200)
    expect(response.body.user_id).toBe(userId)
    expect(response.body.movie_id).toBe(movieRefId)
    expect(response.body.content).toBe("Segunda review para la misma pelicula")
  })

  it("GET /api/vault/social/entry/:id devuelve la entrada social de vault", async () => {
    const response = await request(app).get(
      `/api/vault/social/entry/${vaultEntryId}`
    )

    expect(response.status).toBe(200)
    expect(response.body.user_id).toBe(userId)
    expect(response.body.title).toBe("Mi primer vault")
    expect(response.body.content).toBe("Contenido del vault")
  })

  it("GET /api/activity/feed?type=own devuelve payload válido", async () => {
    const response = await request(app)
      .get("/api/activity/feed?type=own&page=1&limit=20")
      .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty("items")
    expect(Array.isArray(response.body.items)).toBe(true)
  })

  it("GET /api/feed devuelve payload paginado", async () => {
    const response = await request(app)
      .get("/api/feed?page=1&limit=10")
      .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty("items")
    expect(response.body).toHaveProperty("has_more")
  })
})
