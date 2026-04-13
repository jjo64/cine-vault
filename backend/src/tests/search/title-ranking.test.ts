import { describe, expect, it } from "vitest"
import {
  mergeEnglishAndSpanishResults,
  rankMovieByQuery,
} from "../../helpers/titleRanking.js"

describe("title ranking helper", () => {
  it("prioriza coincidencia en title_en por encima de original/localized", () => {
    const query = "stalker"

    const englishMatch = {
      id: 1,
      title_en: "Stalker",
      original_title: "Сталкер",
      title_es: "Stalker",
    }

    const originalMatch = {
      id: 2,
      title_en: "Guide",
      original_title: "Stalker",
      title_es: "Guia",
    }

    const localizedMatch = {
      id: 3,
      title_en: "Guide",
      original_title: "Проводник",
      title_es: "Stalker",
      localized_titles: ["Stalker"],
    }

    const scoreEnglish = rankMovieByQuery(englishMatch, query)
    const scoreOriginal = rankMovieByQuery(originalMatch, query)
    const scoreLocalized = rankMovieByQuery(localizedMatch, query)

    expect(scoreEnglish).toBeGreaterThan(scoreOriginal)
    expect(scoreOriginal).toBeGreaterThan(scoreLocalized)
  })

  it("fusiona resultados EN y ES sin perder title_en y localized", () => {
    const en = [
      { id: 10, title: "Stalker", original_title: "Сталкер", overview: "A" },
    ]
    const es = [
      { id: 10, title: "La zona", original_title: "Сталкер", overview: "B" },
    ]

    const { merged } = mergeEnglishAndSpanishResults(en, es)

    expect(merged).toHaveLength(1)
    expect(merged[0].title).toBe("Stalker")
    expect(merged[0].title_en).toBe("Stalker")
    expect(merged[0].title_es).toBe("La zona")
    expect(merged[0].localized_titles).toContain("La zona")
  })

  it("ordena Stalker 1979 por delante de coincidencias débiles", () => {
    const query = "stalker"

    const candidates = [
      {
        id: 1398,
        title_en: "Stalker",
        original_title: "Сталкер",
        title_es: "Stalker",
        release_date: "1979-05-25",
        popularity: 22,
      },
      {
        id: 4421,
        title_en: "Roadside Notes",
        original_title: "Roadside Notes",
        title_es: "Notas del stalker",
        localized_titles: ["Notas del stalker"],
        release_date: "2012-01-01",
        popularity: 8,
      },
      {
        id: 9999,
        title_en: "Watcher",
        original_title: "Watcher",
        title_es: "El observador",
        release_date: "2023-01-01",
        popularity: 40,
      },
    ]

    const sorted = [...candidates].sort(
      (a, b) => rankMovieByQuery(b, query) - rankMovieByQuery(a, query)
    )

    expect(sorted[0].id).toBe(1398)
  })

  it("no duplica puntaje cuando el mismo titulo aparece en varios campos", () => {
    const duplicatedAcrossFields = {
      id: 1,
      title_en: "Stalker",
      original_title: "Stalker",
      title_es: "Stalker",
      localized_titles: ["Stalker"],
      popularity: 0,
      vote_count: 0,
    }

    const englishOnly = {
      id: 2,
      title_en: "Stalker",
      original_title: "Сталкер",
      title_es: "Acechador",
      localized_titles: ["Acechador"],
      popularity: 0,
      vote_count: 0,
    }

    const duplicatedScore = rankMovieByQuery(duplicatedAcrossFields, "stalker")
    const englishOnlyScore = rankMovieByQuery(englishOnly, "stalker")

    expect(duplicatedScore).toBe(englishOnlyScore)
  })
})
