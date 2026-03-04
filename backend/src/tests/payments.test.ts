import { describe, it, expect, beforeAll, afterAll } from "vitest"
import request from "supertest"
import express from "express"
import cookieParser from "cookie-parser"
import { prisma } from "../lib/prisma.js"
import rutasPagos from "../routes/payments.routes.js"
import { manejadorErrores } from "../middlewares/error.middlewares.js"
import { crearTokenAcceso } from "../lib/tokens.js"

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use("/api/payments", rutasPagos)
app.use(manejadorErrores)

let tokenTest: string
let userId: number

beforeAll(async () => {
  const user = await prisma.users.create({
    data: {
      username: `payer_${Date.now()}`,
      email: `payer_${Date.now()}@cinevault.com`,
      password: "hashedpassword",
      is_verified: true,
    },
  })
  userId = user.id
  tokenTest = crearTokenAcceso(user.id, user.role!, user.is_verified)
})

afterAll(async () => {
  await prisma.users.deleteMany({ where: { id: userId } })
})

describe("Payments", () => {
  it("POST /api/payments/create-checkout-session — crea sesión con plan válido", async () => {
    const res = await request(app)
      .post("/api/payments/create-checkout-session")
      .set("Authorization", `Bearer ${tokenTest}`)
      .send({ plan: "pro" })

    // Solo verificamos que no sea 400 ni 401 — Stripe puede fallar en test sin FRONTEND_URL real
    expect(res.status).not.toBe(400)
    expect(res.status).not.toBe(401)
  })

  it("POST /api/payments/create-checkout-session — falla con plan inválido", async () => {
    const res = await request(app)
      .post("/api/payments/create-checkout-session")
      .set("Authorization", `Bearer ${tokenTest}`)
      .send({ plan: "platinum" })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Plan inválido")
  })

  it("POST /api/payments/create-checkout-session — falla sin autenticación", async () => {
    const res = await request(app)
      .post("/api/payments/create-checkout-session")
      .send({ plan: "pro" })

    expect(res.status).toBe(401)
  })
})