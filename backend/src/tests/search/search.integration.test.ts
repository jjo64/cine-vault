import { beforeEach, describe, expect, it, vi } from "vitest"
import request from "supertest"
import express from "express"

const {
  consultarTMDBMock,
  getOSetMock,
  checkIPSpikeMock,
  enriquecerConDatosLocalesMock,
} = vi.hoisted(() => ({
  consultarTMDBMock: vi.fn(),
  getOSetMock: vi.fn(),
  checkIPSpikeMock: vi.fn(),
  enriquecerConDatosLocalesMock: vi.fn(),
}))

vi.mock("../../helpers/fetchTMDB.js", () => ({
  consultarTMDB: consultarTMDBMock,
}))

vi.mock("../../config/redis.js", () => ({
  getOSet: getOSetMock,
}))

vi.mock("../../services/security.services.js", () => ({
  checkIPSpike: checkIPSpikeMock,
}))

vi.mock("../../services/search.services.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../services/search.services.js")>()
  return {
    ...actual,
    enriquecerConDatosLocales: enriquecerConDatosLocalesMock,
  }
})

const rutasBusqueda = (await import("../../routes/search.routes.js")).default
const { manejadorErrores } =
  await import("../../middlewares/error.middlewares.js")

const app = express()
app.use(express.json())
app.use("/api/search", rutasBusqueda)
app.use(manejadorErrores)

const createMovieResult = (id: number, title: string, popularity = 20) => ({
  id,
  title,
  original_title: title,
  overview: `${title} overview`,
  release_date: "2022-01-01",
  poster_path: "/poster.jpg",
  popularity,
  vote_count: 120,
})

beforeEach(() => {
  vi.clearAllMocks()

  getOSetMock.mockImplementation(
    async (_key: string, fn: () => Promise<unknown>) => fn()
  )
  checkIPSpikeMock.mockResolvedValue(false)
  enriquecerConDatosLocalesMock.mockImplementation(async (ids: number[]) => {
    const map = new Map<
      number,
      { vault_count: number; review_count: number; watchlist_count: number }
    >()
    if (ids.includes(101)) {
      map.set(101, { vault_count: 24, review_count: 18, watchlist_count: 30 })
    }
    if (ids.includes(202)) {
      map.set(202, { vault_count: 0, review_count: 0, watchlist_count: 0 })
    }
    return map
  })

  consultarTMDBMock.mockImplementation(
    async (endpoint: string, params: Record<string, string>) => {
      const query = String(params?.query || "").toLowerCase()

      if (endpoint === "search/movie") {
        if (query.includes("quentin tarantino")) {
          return { results: [], total_pages: 1, total_results: 0, page: 1 }
        }
        if (query.includes("aftersun")) {
          return {
            results: [
              createMovieResult(202, "Other Match", 80),
              createMovieResult(101, "Aftersun", 10),
            ],
            total_pages: 1,
            total_results: 2,
            page: 1,
          }
        }
        if (query.includes("fight club")) {
          return {
            results: [createMovieResult(550, "Fight Club", 90)],
            total_pages: 1,
            total_results: 1,
            page: 1,
          }
        }
        return { results: [], total_pages: 1, total_results: 0, page: 1 }
      }

      if (endpoint === "search/person") {
        if (
          query.includes("quentin tarantino") ||
          query === "quentin" ||
          query === "tarantino"
        ) {
          return {
            results: [
              {
                id: 900,
                name: "Quentin Tarantino",
                known_for_department: "Acting",
                profile_path: "/paul.jpg",
                known_for: [
                  { id: 101, title: "Aftersun", poster_path: "/aftersun.jpg" },
                ],
              },
            ],
            total_pages: 1,
            total_results: 1,
            page: 1,
          }
        }
        return { results: [], total_pages: 1, total_results: 0, page: 1 }
      }

      if (endpoint === "search/tv") {
        return {
          results: [
            {
              id: 3001,
              name: "Aftersun BTS",
              original_name: "Aftersun BTS",
              popularity: 12,
            },
          ],
          total_pages: 1,
          total_results: 1,
          page: 1,
        }
      }

      if (endpoint === "movie/550/credits") {
        return { crew: [{ job: "Director", name: "David Fincher" }] }
      }

      if (endpoint === "movie/550/alternative_titles") {
        return { titles: [{ iso_3166_1: "ES", title: "El club de la lucha" }] }
      }

      if (endpoint === "movie/101/credits") {
        return { crew: [{ job: "Director", name: "Charlotte Wells" }] }
      }

      if (endpoint === "movie/101/alternative_titles") {
        return { titles: [{ iso_3166_1: "ES", title: "Aftersun" }] }
      }

      if (endpoint === "movie/202/credits") {
        return { crew: [{ job: "Director", name: "Someone Else" }] }
      }

      if (endpoint === "movie/202/alternative_titles") {
        return { titles: [{ iso_3166_1: "ES", title: "Otro Match" }] }
      }

      if (endpoint === "person/900/movie_credits") {
        return {
          cast: [createMovieResult(101, "Aftersun", 10)],
          crew: [],
        }
      }

      return { results: [], total_pages: 1, total_results: 0, page: 1 }
    }
  )
})

describe("search integration", () => {
  it("evita buscar personas para query de titulo comun", async () => {
    const res = await request(app)
      .get("/api/search")
      .query({ q: "fight club", page: 1 })

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.results)).toBe(true)

    const personCalls = consultarTMDBMock.mock.calls.filter(
      ([endpoint, params]) =>
        endpoint === "search/person" &&
        String(params?.query || "").toLowerCase() === "fight club"
    )
    expect(personCalls.length).toBe(0)
  })

  it("expande peliculas por personas en query mixta", async () => {
    const res = await request(app)
      .get("/api/search")
      .query({ q: "quentin tarantino", page: 1 })

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.results)).toBe(true)
    const personCreditCalls = consultarTMDBMock.mock.calls.filter(
      ([endpoint]) => endpoint === "person/900/movie_credits"
    )
    expect(personCreditCalls.length).toBeGreaterThan(0)
    expect(Array.isArray(res.body.people_results)).toBe(true)
  })

  it("exhibe debug con desglose de score y metadata", async () => {
    const res = await request(app)
      .get("/api/search/debug")
      .query({ q: "aftersun", page: 1 })

    expect(res.status).toBe(200)
    expect(res.body._debug).toBeTruthy()
    expect(res.body._debug.analysis).toBeTruthy()
    expect(Array.isArray(res.body.results)).toBe(true)
    expect(res.body.results[0]._score_debug).toBeTruthy()
    expect(res.body.results[0]._score_debug).toHaveProperty("local_boost")
    expect(res.body.results[0]._score_debug).toHaveProperty(
      "token_source_boost"
    )
  })
})
