import { afterAll, beforeAll, describe, expect, it } from "vitest"
import request from "supertest"
import express from "express"
import cookieParser from "cookie-parser"
import { prisma } from "../lib/prisma.js"
import { crearTokenAcceso } from "../lib/tokens.js"
import rutasRecommendations from "../routes/recommendations.routes.js"
import { manejadorErrores } from "../middlewares/error.middlewares.js"

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use("/api/recommendations", rutasRecommendations)
app.use(manejadorErrores)

let userId = 0
let token = ""
let username = ""

beforeAll(async () => {
  username = `rec_test_${Date.now()}`

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
})

afterAll(async () => {
  await prisma.explicit_interactions.deleteMany({ where: { user_id: userId } })
  await prisma.user_taste_profiles.deleteMany({ where: { user_id: userId } })
  await prisma.users.deleteMany({ where: { id: userId } })
})

describe("Recommendations & Onboarding Status API", () => {
  it("GET /api/recommendations/onboarding/status returns needs_onboarding true initially", async () => {
    const response = await request(app)
      .get("/api/recommendations/onboarding/status")
      .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.needs_onboarding).toBe(true)
  })

  it("GET /api/recommendations/onboarding/status returns needs_onboarding false after 3 explicit interactions", async () => {
    // 1. Create 3 explicit interactions
    await prisma.explicit_interactions.createMany({
      data: [
        { user_id: userId, movie_id: 101, interaction_type: "like_onboarding" },
        { user_id: userId, movie_id: 102, interaction_type: "skip_onboarding" },
        { user_id: userId, movie_id: 103, interaction_type: "like_onboarding" },
      ],
    })

    const response = await request(app)
      .get("/api/recommendations/onboarding/status")
      .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.needs_onboarding).toBe(false)
  })
})
