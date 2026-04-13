import { afterAll, beforeAll, describe, expect, it } from "vitest"
import request from "supertest"
import express from "express"
import cookieParser from "cookie-parser"
import { prisma } from "../../lib/prisma.js"
import rutasResenas from "../../routes/reviews.routes.js"
import { manejadorErrores } from "../../middlewares/error.middlewares.js"
import { crearTokenAcceso } from "../../lib/tokens.js"

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use("/api/reviews", rutasResenas)
app.use(manejadorErrores)

let ownerId = 0
let commenterId = 0
let ownerToken = ""
let commenterToken = ""
let movieId = 0
let reviewId = 0
let commentId = 0

beforeAll(async () => {
  const owner = await prisma.users.create({
    data: {
      username: `owner_${Date.now()}`,
      email: `owner_${Date.now()}@cinevault.com`,
      password: "hashedpassword",
      is_verified: true,
    },
  })
  ownerId = owner.id
  ownerToken = crearTokenAcceso(owner.id, owner.role!, owner.is_verified)

  const commenter = await prisma.users.create({
    data: {
      username: `commenter_${Date.now()}`,
      email: `commenter_${Date.now()}@cinevault.com`,
      password: "hashedpassword",
      is_verified: true,
    },
  })
  commenterId = commenter.id
  commenterToken = crearTokenAcceso(
    commenter.id,
    commenter.role!,
    commenter.is_verified
  )

  const movie = await prisma.movies_ref.create({
    data: { tmdb_id: Math.floor(Math.random() * 999999) },
  })
  movieId = movie.id

  const review = await request(app)
    .post("/api/reviews")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      movie_id: movieId,
      rating: 4,
      content: "Reseña base para comentarios",
    })

  reviewId = review.body.id
})

afterAll(async () => {
  if (reviewId) {
    await prisma.review_comments.deleteMany({ where: { review_id: reviewId } })
    await prisma.reviews.deleteMany({ where: { id: reviewId } })
  }
  if (movieId) {
    await prisma.movies_ref.deleteMany({ where: { id: movieId } })
  }
  if (ownerId) {
    await prisma.users.deleteMany({ where: { id: ownerId } })
  }
  if (commenterId) {
    await prisma.users.deleteMany({ where: { id: commenterId } })
  }
})

describe("Reviews comments flow", () => {
  it("POST /api/reviews/:reviewId/comments — crea comentario y persiste en listado", async () => {
    const createResponse = await request(app)
      .post(`/api/reviews/${reviewId}/comments`)
      .set("Authorization", `Bearer ${commenterToken}`)
      .send({ content: "Comentario inicial", review_id: reviewId })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.review_id).toBe(reviewId)
    expect(createResponse.body.content).toBe("Comentario inicial")
    commentId = createResponse.body.id

    const listResponse = await request(app).get(
      `/api/reviews/${reviewId}/comments`
    )

    expect(listResponse.status).toBe(200)
    expect(Array.isArray(listResponse.body)).toBe(true)
    expect(
      listResponse.body.some((item: { id: number }) => item.id === commentId)
    ).toBe(true)
  })

  it("PUT /api/reviews/comments/:commentId — actualiza comentario via alias", async () => {
    const response = await request(app)
      .put(`/api/reviews/comments/${commentId}`)
      .set("Authorization", `Bearer ${commenterToken}`)
      .send({ content: "Comentario editado" })

    expect(response.status).toBe(200)
    expect(response.body.content).toBe("Comentario editado")
  })

  it("DELETE /api/reviews/comments/:commentId — elimina comentario via alias", async () => {
    const response = await request(app)
      .delete(`/api/reviews/comments/${commentId}`)
      .set("Authorization", `Bearer ${commenterToken}`)

    expect(response.status).toBe(200)
    expect(response.body.message).toBe("Comentario eliminado correctamente")
  })
})
