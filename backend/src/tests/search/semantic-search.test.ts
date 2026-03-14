import { describe, expect, it } from "vitest"
import {
  analizarQuery,
  calcularPersonNameScore,
  fuzzyMatch,
  fuzzyTokenMatchAny,
  levenshtein,
} from "../../services/search.services.js"

describe("semantic search helpers", () => {
  it("detecta consulta de persona con tokens improbables", () => {
    const analysis = analizarQuery("calum y sophie")

    expect(analysis.tipo_detectado).toBe("mixto")
    expect(analysis.queries_tmdb.buscar_personas).toBe(true)
    expect(analysis.queries_tmdb.buscar_peliculas).toBe(true)
    expect(analysis.queries_tmdb.buscar_tv).toBe(true)
  })

  it("detecta consulta mixta cuando combina titulo y nombre", () => {
    const analysis = analizarQuery("aftersun charlotte wells")

    expect(analysis.tipo_detectado).toBe("mixto")
    expect(analysis.queries_tmdb.buscar_personas).toBe(true)
    expect(analysis.queries_tmdb.buscar_peliculas).toBe(true)
    expect(analysis.queries_tmdb.buscar_tv).toBe(true)
  })

  it("mantiene busqueda de titulo/contexto para query comun", () => {
    const analysis = analizarQuery("fight club")

    expect(analysis.tipo_detectado).toBe("titulo")
    expect(analysis.queries_tmdb.buscar_personas).toBe(false)
    expect(analysis.queries_tmdb.buscar_peliculas).toBe(true)
    expect(analysis.queries_tmdb.buscar_tv).toBe(true)
  })

  it("activa personas en token unico largo tipo apellido", () => {
    const analysis = analizarQuery("nolan")

    expect(analysis.tipo_detectado).toBe("mixto")
    expect(analysis.queries_tmdb.buscar_personas).toBe(true)
    expect(analysis.queries_tmdb.buscar_peliculas).toBe(true)
    expect(analysis.queries_tmdb.buscar_tv).toBe(true)
  })

  it("acepta typo por fuzzy con levenshtein corto", () => {
    expect(levenshtein("charlote", "charlotte")).toBe(1)
    expect(fuzzyMatch("charlote", "Charlotte Wells")).toBe(true)
  })

  it("fuzzy por tokens funciona contra candidatos de titulo", () => {
    const tokens = ["charlote", "wels"]
    const candidates = ["Charlotte Wells", "Aftersun"]

    expect(fuzzyTokenMatchAny(tokens, candidates)).toBe(true)
  })

  it("calcula score alto por apellido aislado", () => {
    const score = calcularPersonNameScore("nolan", "Christopher Nolan")

    expect(score).toBeGreaterThanOrEqual(0.82)
    expect(score).toBeCloseTo(0.88, 2)
  })

  it("calcula score alto por typo en nombre completo", () => {
    const typoScore = calcularPersonNameScore("charlote wells", "Charlotte Wells")
    const exactScore = calcularPersonNameScore("charlotte wells", "Charlotte Wells")

    expect(typoScore).toBeGreaterThanOrEqual(0.82)
    expect(exactScore).toBe(1)
    expect(exactScore).toBeGreaterThan(typoScore)
  })

  it("mantiene score alto por token matching en query compuesta con typo", () => {
    const score = calcularPersonNameScore("charlote wells", "Charlotte Wells")

    expect(score).toBeGreaterThanOrEqual(0.82)
  })

  it("mantiene score bajo para match no relacionado", () => {
    const score = calcularPersonNameScore("nolan", "Conan Obrien")

    expect(score).toBeLessThan(0.82)
  })
})
