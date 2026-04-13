type TMDBAlternativeTitle = {
  iso_3166_1?: string
  title?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SearchMovieLike = any

type MergeSearchResult = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  merged: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  byId: Map<number, any>
}

const ENGLISH_TITLE_FIELD_WEIGHT = 3000
const ORIGINAL_TITLE_FIELD_WEIGHT = 2000
const LOCALIZED_TITLE_FIELD_WEIGHT = 1000

const normalizeText = (value: string | null | undefined) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

const uniqueStrings = (values: Array<string | null | undefined>) => [
  ...new Set(values.map((value) => String(value || "").trim()).filter(Boolean)),
]

const matchStrength = (candidate: string, query: string) => {
  if (!candidate || !query) return 0
  if (candidate === query) return 100
  if (candidate.startsWith(query)) return 70
  if (candidate.includes(query)) return 40

  const queryTokens = query.split(/\s+/).filter(Boolean)
  if (
    queryTokens.length > 1 &&
    queryTokens.every((token) => candidate.includes(token))
  ) {
    return 25
  }

  return 0
}

const buildWeightedCandidateMap = (
  fields: Array<{ candidates: string[]; weight: number }>
) => {
  const map = new Map<string, { weight: number; strength: number }>()

  for (const field of fields) {
    for (const candidate of field.candidates) {
      const current = map.get(candidate)
      if (!current) {
        map.set(candidate, { weight: field.weight, strength: 0 })
        continue
      }

      // Keep the highest priority field for the same normalized title.
      current.weight = Math.max(current.weight, field.weight)
      map.set(candidate, current)
    }
  }

  return map
}

const withNormalizedCandidates = (values: Array<string | null | undefined>) =>
  uniqueStrings(values).map(normalizeText).filter(Boolean)

const getLocalizedTitlesFromAlternative = (
  titles: TMDBAlternativeTitle[] = []
) => uniqueStrings(titles.map((item) => item.title))

const getSpanishTitleFromAlternative = (titles: TMDBAlternativeTitle[] = []) =>
  titles.find((item) => (item.iso_3166_1 || "").toUpperCase() === "ES")
    ?.title || null

export const rankMovieByQuery = (movie: SearchMovieLike, rawQuery: string) => {
  const query = normalizeText(rawQuery)
  if (!query) return 0

  const englishCandidates = withNormalizedCandidates([
    movie.title_en,
    movie.title,
  ])

  const originalCandidates = withNormalizedCandidates([movie.original_title])

  const localizedCandidates = withNormalizedCandidates([
    movie.title_es,
    movie.localized_title,
    ...(Array.isArray(movie.localized_titles) ? movie.localized_titles : []),
    ...getLocalizedTitlesFromAlternative(movie.alternative_titles || []),
  ])

  const weightedCandidates = buildWeightedCandidateMap([
    { candidates: englishCandidates, weight: ENGLISH_TITLE_FIELD_WEIGHT },
    { candidates: originalCandidates, weight: ORIGINAL_TITLE_FIELD_WEIGHT },
    { candidates: localizedCandidates, weight: LOCALIZED_TITLE_FIELD_WEIGHT },
  ])

  let score = 0
  for (const [candidate, metadata] of weightedCandidates.entries()) {
    const strength = matchStrength(candidate, query)
    if (strength <= 0) continue
    score += metadata.weight + strength
  }

  // Secondary tie-breakers so stable ordering still favors known films.
  score += Number(movie.popularity || 0) * 0.01
  score += Number(movie.vote_count || 0) * 0.0001

  return score
}

export const mergeEnglishAndSpanishResults = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  englishResults: any[] = [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spanishResults: any[] = []
): MergeSearchResult => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byId = new Map<number, any>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const merged: any[] = []

  for (const movie of englishResults) {
    if (!movie?.id) continue
    const normalizedMovie = {
      ...movie,
      title_en: movie.title || movie.title_en || null,
      title_es: null,
      localized_title: null,
      localized_titles: [],
    }
    byId.set(movie.id, normalizedMovie)
    merged.push(normalizedMovie)
  }

  for (const movie of spanishResults) {
    if (!movie?.id) continue
    const existing = byId.get(movie.id)
    if (!existing) {
      const normalizedMovie = {
        ...movie,
        title_en: null,
        title_es: movie.title || null,
        localized_title: movie.title || null,
        localized_titles: movie.title ? [movie.title] : [],
      }
      byId.set(movie.id, normalizedMovie)
      merged.push(normalizedMovie)
      continue
    }

    const mergedLocalized = uniqueStrings([
      ...(Array.isArray(existing.localized_titles)
        ? existing.localized_titles
        : []),
      movie.title,
    ])

    Object.assign(existing, {
      // Keep english title as primary response title to satisfy priority requirement.
      title:
        existing.title_en ||
        existing.title ||
        movie.title ||
        existing.original_title,
      title_en:
        existing.title_en ||
        movie.original_title ||
        existing.original_title ||
        null,
      title_es: movie.title || existing.title_es || null,
      localized_title: movie.title || existing.localized_title || null,
      localized_titles: mergedLocalized,
      // Keep richer overview if english one is missing.
      overview: existing.overview || movie.overview || null,
      poster_path: existing.poster_path || movie.poster_path || null,
    })

    byId.set(movie.id, existing)
  }

  return {
    merged,
    byId,
  }
}

export const attachAlternativeTitles = (
  movie: SearchMovieLike,
  titles: TMDBAlternativeTitle[] = []
) => {
  const spanishFromAlt = getSpanishTitleFromAlternative(titles)
  const localizedTitles = uniqueStrings([
    ...(Array.isArray(movie.localized_titles) ? movie.localized_titles : []),
    spanishFromAlt,
    movie.title_es,
    movie.localized_title,
    ...getLocalizedTitlesFromAlternative(titles),
  ])

  return {
    ...movie,
    alternative_titles: titles,
    title_es: movie.title_es || spanishFromAlt || null,
    localized_title:
      movie.localized_title || movie.title_es || spanishFromAlt || null,
    localized_titles: localizedTitles,
  }
}
