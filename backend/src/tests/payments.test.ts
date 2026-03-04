import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import request from "supertest"
import express from "express"
import cookieParser from "cookie-parser"
import { prisma } from "../lib/prisma.js"
import { manejadorErrores } from "../middlewares/error.middlewares.js"
import { crearTokenAcceso } from "../lib/tokens.js"

// Configurar secrets y precios dummy para evitar que Stripe falle en tests
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret"
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "sk_test_dummy"
process.env.STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO ?? "price_test_pro"
process.env.STRIPE_PRICE_VIP = process.env.STRIPE_PRICE_VIP ?? "price_test_vip"

// Mock de Stripe para evitar llamadas externas en tests
vi.mock("stripe", () => {
  const createSession = vi.fn(async () => ({ url: "https://stripe.test/session" }))
  const constructEvent = vi.fn(() => ({ type: "noop", data: { object: {} } }))
  return {
    default: class {
      checkout = { sessions: { create: createSession } }
      webhooks = { constructEvent }
    },
  }
})

const rutasPagos = (await import("../routes/payments.routes.js")).default

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

    expect(res.status).toBe(200)
    expect(res.body.url).toContain("https://stripe.test/session")
  })

  it("POST /api/payments/create-checkout-session — falla con plan inválido", async () => {
    const res = await request(app)
      .post("/api/payments/create-checkout-session")
      .set("Authorization", `Bearer ${tokenTest}`)
      .send({ plan: "platinum" })

    expect(res.status).toBe(400)
    expect(res.body.error?.message).toBe("Plan inválido")
  })

  it("POST /api/payments/create-checkout-session — falla sin autenticación", async () => {
    const res = await request(app)
      .post("/api/payments/create-checkout-session")
      .send({ plan: "pro" })

    expect(res.status).toBe(401)
  })
})