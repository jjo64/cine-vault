/**
 * @file unifiedSearch.services.ts
 * @description Motor de búsqueda unificada y ranking inteligente de CineVault.
 * Implementa una arquitectura de búsqueda híbrida que combina resultados de TMDB,
 * detección de intención de usuario (NLP ligero), métricas sociales locales
 * y un sistema jerárquico de "Boosting" para priorizar resultados relevantes.
 */

import { Request } from "express"
import pMap from "p-map"
import { getOSet } from "../config/redis.js"
import { TooManyRequestsError } from "../errors/AppErrors.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import {
  analizarQuery,
  calcularPersonNameScore,
  fuzzyTokenMatchAny,
} from "../helpers/searchUtils.js"
import {
  attachAlternativeTitles,
  mergeEnglishAndSpanishResults,
  rankMovieByQuery,
} from "../helpers/titleRanking.js"
import { enriquecerConDatosLocalesService } from "../services/search.services.js"
import { checkIPSpike } from "../services/security.services.js"

// --- Configuración y Constantes del Motor ---

export const TTL_BUSQUEDA = 60 * 60 * 2
const SEARCH_PAGE_SIZE = 20
const FIRST_PAGE_CANDIDATE_PAGES = ["1", "2", "3"]
export const SEARCH_CACHE_VERSION = "v20"

const getEnvNumber = (name: string, fallback: number) => {
  const raw = process.env[name]
  if (raw === undefined || raw === null || String(raw).trim() === "")
    return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

const TITLE_EXACT_BOOST = getEnvNumber("SEARCH_TITLE_EXACT_BOOST", 4200)
const TITLE_SOURCE_BOOST = getEnvNumber("SEARCH_TITLE_SOURCE_BOOST", 1200)
const TOKEN_SOURCE_BOOST = getEnvNumber("SEARCH_TOKEN_SOURCE_BOOST", 800)
const DIRECTOR_CREDIT_BOOST = getEnvNumber("SEARCH_DIRECTOR_CREDIT_BOOST", 700)
const ACTOR_CREDIT_BOOST = getEnvNumber("SEARCH_ACTOR_CREDIT_BOOST", 450)
const TV_SOURCE_BOOST = getEnvNumber("SEARCH_TV_SOURCE_BOOST", 2200)
const TV_EXACT_BOOST = getEnvNumber("SEARCH_TV_EXACT_BOOST", 5000)
const LOCAL_VAULT_BOOST = getEnvNumber("SEARCH_LOCAL_VAULT_BOOST", 240)
const LOCAL_REVIEW_BOOST = getEnvNumber("SEARCH_LOCAL_REVIEW_BOOST", 180)
const LOCAL_WATCHLIST_BOOST = getEnvNumber("SEARCH_LOCAL_WATCHLIST_BOOST", 90)
const PERSON_STRONG_MATCH_BOOST = getEnvNumber(
  "SEARCH_PERSON_STRONG_MATCH_BOOST",
  3600
)
const PERSON_TITLE_NOISE_PENALTY = getEnvNumber(
  "SEARCH_PERSON_TITLE_NOISE_PENALTY",
  1600
)
const TV_NON_EXACT_PENALTY = getEnvNumber("SEARCH_TV_NON_EXACT_PENALTY", 1200)
const VOTE_COUNT_BOOST_WEIGHT = getEnvNumber(
  "SEARCH_VOTE_COUNT_BOOST_WEIGHT",
  700
)
const VOTE_AVERAGE_BOOST_WEIGHT = getEnvNumber(
  "SEARCH_VOTE_AVERAGE_BOOST_WEIGHT",
  140
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

type PersonCandidate = {
  id: number
  name: string
  personNameScore: number
  popularity?: number
  profile_path?: string | null
  known_for_department?: string
  known_for?: Array<{
    id: number
    title?: string
    name?: string
    poster_path?: string | null
  }>
}

type PersonRole = "director" | "actor"

type MovieAggregate = {
  movie: AnyRecord
  hasTitleSource: boolean
  hasTokenSource: boolean
  tokenMatches: number
  personRoleScore: number
  personNameScore: number
}

// --- Lógica de Normalización y Comparación ---

/**
 * Normaliza una cadena de búsqueda eliminando espacios redundantes.
 */
export const normalizeQuery = (raw: string) =>
  String(raw || "")
    .trim()
    .replace(/\s+/g, " ")

const getMatchStrength = (
  candidateRaw: string | null | undefined,
  rawQuery: string
) => {
  const candidate = normalizeQuery(candidateRaw || "").toLowerCase()
  const query = normalizeQuery(rawQuery).toLowerCase()
  if (!candidate || !query) return 0
  if (candidate === query) return 100
  if (candidate.startsWith(query)) return 70
  if (candidate.includes(query)) return 40
  return 0
}

const toTitleCandidates = (movie: AnyRecord) => {
  const localized = Array.isArray(movie.localized_titles)
    ? movie.localized_titles
    : []
  return [
    movie.title,
    movie.title_en,
    movie.original_title,
    movie.title_es,
    movie.localized_title,
    ...localized,
  ]
    .map((value) => normalizeQuery(value || "").toLowerCase())
    .filter(Boolean)
}

const toContextCandidates = (movie: AnyRecord) => {
  const overview = normalizeQuery(String(movie?.overview || "")).toLowerCase()
  const localizedOverview = normalizeQuery(
    String(movie?.overview_es || "")
  ).toLowerCase()
  return [...toTitleCandidates(movie), overview, localizedOverview].filter(
    Boolean
  )
}

const hasExactTitleMatch = (movie: AnyRecord, query: string) => {
  const normalizedQuery = normalizeQuery(query).toLowerCase()
  if (!normalizedQuery) return false
  return toTitleCandidates(movie).some(
    (candidate) => candidate === normalizedQuery
  )
}

const hasExactTVNameMatch = (tv: AnyRecord, query: string) => {
  const normalizedQuery = normalizeQuery(query).toLowerCase()
  if (!normalizedQuery) return false

  const candidates = [tv.name, tv.original_name]
    .map((value) => normalizeQuery(value || "").toLowerCase())
    .filter(Boolean)

  return candidates.includes(normalizedQuery)
}

const hasExactTokenTitleMatch = (movie: AnyRecord, tokens: string[]) => {
  if (tokens.length === 0) return false
  const candidates = toTitleCandidates(movie)
  return tokens.some((token) => {
    const normalizedToken = normalizeQuery(token).toLowerCase()
    if (!normalizedToken) return false
    return candidates.includes(normalizedToken)
  })
}

const hasFuzzyTokenTitleMatch = (movie: AnyRecord, tokens: string[]) => {
  if (tokens.length === 0) return false
  return fuzzyTokenMatchAny(tokens, toTitleCandidates(movie))
}

const selectLikelyPersonTokens = (tokens: string[]) => {
  const unique = new Set<string>()
  for (const token of tokens) {
    const normalized = normalizeQuery(token).toLowerCase()
    if (normalized.length >= 3) unique.add(normalized)
  }
  return Array.from(unique)
}

/**
 * Genera una clave de caché única basada en el ámbito, query y parámetros de filtrado.
 */
export const buildMovieSearchCacheKey = (
  scope: "general" | "movie" | "person" | "tv",
  query: string,
  page: string,
  withGenres?: string
) =>
  `tmdb:search:${SEARCH_CACHE_VERSION}:${scope}:${normalizeQuery(query)
    .toLowerCase()
    .replace(/\s+/g, "+")}:p${page}:g${withGenres || "all"}`

/**
 * Clave de caché para los créditos (filmografía) de una persona específica.
 */
const buildPersonCreditsCacheKey = (personId: number) =>
  `tmdb:search:${SEARCH_CACHE_VERSION}:person-credits:${personId}`

/**
 * Ejecuta una búsqueda de películas con ranking optimizado por relevancia de título.
 * Combina resultados multi-idioma (ES/EN) para garantizar la máxima cobertura.
 */
export const runRankedMovieSearch = async ({
  query,
  page,
  withGenres,
}: {
  query: string
  page: string
  withGenres?: string
}) => {
  const normalizedQuery = normalizeQuery(query)
  const currentPage = Math.max(1, Number(page || "1") || 1)
  const candidatePages =
    currentPage === 1 ? FIRST_PAGE_CANDIDATE_PAGES : [String(currentPage)]

  const pagePayloads: Array<{
    primaryData: AnyRecord
    spanishData: AnyRecord
  }> = await pMap(
    candidatePages,
    async (candidatePage) => {
      const [primaryData, spanishData]: AnyRecord[] = await Promise.all([
        consultarTMDB(
          "search/movie",
          {
            query: normalizedQuery,
            page: candidatePage,
            ...(withGenres && { with_genres: withGenres }),
          },
          { includeDefaultLanguage: false }
        ),
        consultarTMDB(
          "search/movie",
          {
            query: normalizedQuery,
            page: candidatePage,
            ...(withGenres && { with_genres: withGenres }),
            language: "es-ES",
          },
          { includeDefaultLanguage: false }
        ),
      ])

      return { primaryData, spanishData }
    },
    { concurrency: 2 }
  )

  const primaryResults = pagePayloads.flatMap((payload) =>
    Array.isArray(payload.primaryData?.results)
      ? payload.primaryData.results
      : ([] as AnyRecord[])
  )
  const spanishResults = pagePayloads.flatMap((payload) =>
    Array.isArray(payload.spanishData?.results)
      ? payload.spanishData.results
      : ([] as AnyRecord[])
  )

  const { merged } = mergeEnglishAndSpanishResults(
    primaryResults,
    spanishResults
  )

  const rankedResults = await pMap(
    merged,
    async (movie: AnyRecord) => {
      const [credits, titles]: AnyRecord[] = await Promise.all([
        consultarTMDB(
          `movie/${movie.id}/credits`,
          { language: "en-US" },
          { includeDefaultLanguage: false }
        ),
        consultarTMDB(
          `movie/${movie.id}/alternative_titles`,
          {},
          { includeDefaultLanguage: false }
        ),
      ])

      const director = credits.crew?.find(
        (person: AnyRecord) => person.job === "Director"
      )?.name
      const withTitles = attachAlternativeTitles(movie, titles.titles || [])

      return {
        ...withTitles,
        director,
        _title_rank: rankMovieByQuery(withTitles, normalizedQuery),
      }
    },
    { concurrency: 3 }
  )

  rankedResults.sort(
    (a: AnyRecord, b: AnyRecord) =>
      Number(b._title_rank || 0) - Number(a._title_rank || 0)
  )

  const primaryPayload = pagePayloads[0] || { primaryData: {}, spanishData: {} }

  return {
    results:
      currentPage === 1
        ? rankedResults.slice(0, SEARCH_PAGE_SIZE)
        : rankedResults,
    total_pages: Math.max(
      Number(primaryPayload.primaryData?.total_pages || 1),
      Number(primaryPayload.spanishData?.total_pages || 1)
    ),
    total_results: Math.max(
      Number(primaryPayload.primaryData?.total_results || rankedResults.length),
      Number(primaryPayload.spanishData?.total_results || rankedResults.length)
    ),
    page: Number(
      primaryPayload.primaryData?.page ||
        primaryPayload.spanishData?.page ||
        page
    ),
  }
}

const collectPersonCandidates = (
  query: string,
  queryTokens: string[],
  personResults: AnyRecord[] = [],
  tokenPersonResults: AnyRecord[] = []
): PersonCandidate[] => {
  const normalizedQuery = normalizeQuery(query).toLowerCase()
  const minPersonNameScore = queryTokens.length >= 2 ? 0.72 : 0.82

  const computePersonNameScore = (personName: string) => {
    const fullScore = calcularPersonNameScore(normalizedQuery, personName)
    if (queryTokens.length < 3) return fullScore

    const tokenScores = queryTokens
      .map((token) => calcularPersonNameScore(token, personName))
      .filter((score) => Number.isFinite(score))

    const bestTokenScore = tokenScores.length > 0 ? Math.max(...tokenScores) : 0
    return Math.max(fullScore, bestTokenScore * 0.98)
  }

  const byId = new Map<number, PersonCandidate>()
  for (const person of [...personResults, ...tokenPersonResults]) {
    if (!person?.id || !person?.name) continue
    if (byId.has(person.id)) continue

    const personNameScore = computePersonNameScore(String(person.name || ""))
    if (personNameScore < minPersonNameScore) continue

    byId.set(person.id, {
      id: person.id,
      name: person.name,
      personNameScore,
      popularity: Number(person.popularity || 0),
      profile_path: person.profile_path || null,
      known_for_department: person.known_for_department,
      known_for: Array.isArray(person.known_for)
        ? person.known_for
            .filter(
              (item: AnyRecord) => (item.title || item.name) && item.poster_path
            )
            .slice(0, 3)
            .map((item: AnyRecord) => ({
              id: item.id,
              title: item.title,
              name: item.name,
              poster_path: item.poster_path || null,
            }))
        : [],
    })
  }

  const scored = Array.from(byId.values())
    .map((candidate) => {
      const nameNormalized = normalizeQuery(candidate.name || "").toLowerCase()
      const department = String(
        candidate.known_for_department || ""
      ).toLowerCase()
      const knownForTitles = Array.isArray(candidate.known_for)
        ? candidate.known_for
            .map((item) => String(item.title || item.name || ""))
            .filter(Boolean)
        : []
      const nameTokenCount = nameNormalized.split(/\s+/).filter(Boolean).length

      let score = Number(candidate.popularity || 0) * 0.05
      score += candidate.personNameScore * 500
      if (nameNormalized === normalizedQuery) score += 600
      if (
        nameNormalized.includes(normalizedQuery) &&
        normalizedQuery.length >= 4
      )
        score += 320
      if (queryTokens.length === 1 && normalizedQuery.length >= 5) {
        if (nameTokenCount === 1 && nameNormalized === normalizedQuery)
          score -= 380
        if (nameTokenCount >= 2 && nameNormalized.includes(normalizedQuery))
          score += 220
      }
      if (fuzzyTokenMatchAny(queryTokens, [candidate.name])) score += 260
      if (fuzzyTokenMatchAny(queryTokens, knownForTitles)) score += 120
      if (department.includes("direct")) score += 80
      if (department.includes("act")) score += 50

      return { candidate, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, 12).map((item) => item.candidate)
}

const fetchCreditsForPerson = async (person: PersonCandidate) =>
  getOSet(
    buildPersonCreditsCacheKey(person.id),
    () =>
      consultarTMDB(
        `person/${person.id}/movie_credits`,
        { language: "en-US" },
        { includeDefaultLanguage: false }
      ),
    TTL_BUSQUEDA
  )

const mergeMovieFromPersonCredit = (
  map: Map<number, MovieAggregate>,
  movieCredit: AnyRecord,
  role: PersonRole,
  personNameScore: number
) => {
  if (!movieCredit?.id) return

  const personRoleBase =
    role === "director" ? DIRECTOR_CREDIT_BOOST : ACTOR_CREDIT_BOOST
  const personRoleScore = personRoleBase * personNameScore

  const existing = map.get(movieCredit.id)
  if (!existing) {
    map.set(movieCredit.id, {
      movie: {
        id: movieCredit.id,
        title: movieCredit.title || movieCredit.original_title || "Sin título",
        original_title: movieCredit.original_title || null,
        overview: movieCredit.overview || null,
        release_date: movieCredit.release_date || null,
        poster_path: movieCredit.poster_path || null,
        popularity: Number(movieCredit.popularity || 0),
        vote_count: Number(movieCredit.vote_count || 0),
        media_type: "movie",
      },
      hasTitleSource: false,
      hasTokenSource: false,
      tokenMatches: 0,
      personRoleScore,
      personNameScore,
    })
    return
  }

  if (personRoleScore > existing.personRoleScore) {
    existing.personRoleScore = personRoleScore
    existing.personNameScore = personNameScore
  }

  map.set(movieCredit.id, existing)
}

const mergeMovieFromTitleSearch = (
  map: Map<number, MovieAggregate>,
  movie: AnyRecord
) => {
  if (!movie?.id) return

  const existing = map.get(movie.id)
  if (!existing) {
    map.set(movie.id, {
      movie: {
        ...movie,
        media_type: "movie",
      },
      hasTitleSource: true,
      hasTokenSource: false,
      tokenMatches: 0,
      personRoleScore: 0,
      personNameScore: 0,
    })
    return
  }

  existing.movie = {
    ...movie,
    ...existing.movie,
    media_type: "movie",
  }
  existing.hasTitleSource = true
  map.set(movie.id, existing)
}

const mergeMovieFromTokenSearch = (
  map: Map<number, MovieAggregate>,
  movie: AnyRecord,
  matchedTokenCount: number
) => {
  if (!movie?.id) return

  const existing = map.get(movie.id)
  if (!existing) {
    map.set(movie.id, {
      movie: {
        ...movie,
        media_type: "movie",
      },
      hasTitleSource: false,
      hasTokenSource: true,
      tokenMatches: matchedTokenCount,
      personRoleScore: 0,
      personNameScore: 0,
    })
    return
  }

  existing.movie = {
    ...movie,
    ...existing.movie,
    media_type: "movie",
  }
  existing.hasTokenSource = true
  existing.tokenMatches = Math.max(existing.tokenMatches, matchedTokenCount)
  map.set(movie.id, existing)
}

const runPersonMovieMatches = async (
  candidates: PersonCandidate[]
): Promise<Map<number, MovieAggregate>> => {
  const map = new Map<number, MovieAggregate>()

  await pMap(
    candidates,
    async (person) => {
      const credits: AnyRecord = await fetchCreditsForPerson(person)

      const directedMovies = Array.isArray(credits?.crew)
        ? credits.crew
            .filter((item: AnyRecord) => item?.job === "Director")
            .slice(0, 20)
        : []
      const actedMovies = Array.isArray(credits?.cast)
        ? credits.cast.slice(0, 20)
        : []

      for (const movie of directedMovies) {
        mergeMovieFromPersonCredit(
          map,
          movie,
          "director",
          person.personNameScore
        )
      }
      for (const movie of actedMovies) {
        mergeMovieFromPersonCredit(map, movie, "actor", person.personNameScore)
      }
    },
    { concurrency: 2 }
  )

  return map
}

export const extractTmdbResults = (payload: AnyRecord) =>
  Array.isArray(payload?.results) ? payload.results : []

const EMPTY_SEARCH_PAYLOAD = {
  results: [],
  total_pages: 1,
  total_results: 0,
  page: 1,
}

const localSignalScore = (counts?: {
  vault_count?: number
  review_count?: number
  watchlist_count?: number
}) => {
  if (!counts) return 0

  const vault = Math.log10((counts.vault_count || 0) + 1) * LOCAL_VAULT_BOOST
  const reviews =
    Math.log10((counts.review_count || 0) + 1) * LOCAL_REVIEW_BOOST
  const watchlist =
    Math.log10((counts.watchlist_count || 0) + 1) * LOCAL_WATCHLIST_BOOST

  return vault + reviews + watchlist
}

const tmdbRatingSignalScore = (movie: AnyRecord) => {
  const voteCount = Number(movie?.vote_count || 0)
  const voteAverage = Number(movie?.vote_average || 0)

  const voteCountBoost = Math.log10(voteCount + 1) * VOTE_COUNT_BOOST_WEIGHT
  const voteAverageBoost =
    Math.max(0, Math.min(voteAverage, 10)) * VOTE_AVERAGE_BOOST_WEIGHT

  return {
    voteCountBoost,
    voteAverageBoost,
    total: voteCountBoost + voteAverageBoost,
  }
}

const hasMinimumMetadata = (item: AnyRecord) => {
  const hasPoster = Boolean(item?.poster_path)
  const hasOverview = normalizeQuery(String(item?.overview || "")).length > 0
  return hasPoster && hasOverview
}

export const shouldAllowSearchDebug = (req: Request) => {
  if (process.env.NODE_ENV !== "production") return true

  const configured = String(process.env.SEARCH_DEBUG_KEY || "").trim()
  if (!configured) return false

  const headerKey = String(req.headers["x-search-debug-key"] || "").trim()
  const queryKey = String(req.query.debug_key || "").trim()
  return headerKey === configured || queryKey === configured
}

/**
 * Orquestador principal de búsqueda inteligente.
 * 1. Analiza la intención (Persona, Película o Mixto).
 * 2. Ejecuta búsquedas paralelas en TMDB.
 * 3. Expande resultados mediante la filmografía de personas detectadas.
 * 4. Aplica motor de ranking (Boosting/Penalties).
 * 5. Enriquece con métricas locales de CineVault.
 */
export const runSmartUnifiedSearch = async ({
  query,
  page,
  includeDebug = false,
}: {
  query: string
  page: string
  includeDebug?: boolean
}) => {
  const normalizedQuery = normalizeQuery(query)
  const currentPage = Math.max(1, Number(page || "1") || 1)
  const analisis = analizarQuery(normalizedQuery)
  const { tokens, queries_tmdb } = analisis
  const isCombinedQuery = tokens.length > 1
  const personIntentMultiplier =
    analisis.tipo_detectado === "persona"
      ? 2.8
      : analisis.tipo_detectado === "mixto"
        ? 2.2
        : 1

  const [movieData, personData, tvData] = await Promise.all([
    queries_tmdb.buscar_peliculas
      ? runRankedMovieSearch({
          query: queries_tmdb.termino_pelicula || normalizedQuery,
          page,
        })
      : Promise.resolve(EMPTY_SEARCH_PAYLOAD),
    queries_tmdb.buscar_personas
      ? consultarTMDB(
          "search/person",
          { query: queries_tmdb.termino_persona || normalizedQuery, page },
          { includeDefaultLanguage: false }
        )
      : Promise.resolve(EMPTY_SEARCH_PAYLOAD),
    queries_tmdb.buscar_tv
      ? consultarTMDB(
          "search/tv",
          { query: queries_tmdb.termino_tv || normalizedQuery, page },
          { includeDefaultLanguage: false }
        )
      : Promise.resolve(EMPTY_SEARCH_PAYLOAD),
  ])

  const likelyPersonTokens = selectLikelyPersonTokens(tokens)

  const tokenPersonPayloads =
    isCombinedQuery && queries_tmdb.buscar_personas
      ? await pMap(
          likelyPersonTokens,
          async (token) =>
            consultarTMDB(
              "search/person",
              { query: token, page: "1" },
              { includeDefaultLanguage: false }
            ),
          { concurrency: 2 }
        )
      : []

  const personCandidates = collectPersonCandidates(
    normalizedQuery,
    tokens,
    extractTmdbResults(personData),
    tokenPersonPayloads.flatMap((payload) => extractTmdbResults(payload))
  )

  if (
    personCandidates.length === 0 &&
    isCombinedQuery &&
    queries_tmdb.buscar_personas
  ) {
    const tokenPersonFallbackPayloads = await pMap(
      likelyPersonTokens,
      async (token) =>
        consultarTMDB(
          "search/person",
          { query: token, page: "2" },
          { includeDefaultLanguage: false }
        ),
      { concurrency: 2 }
    )

    personCandidates.push(
      ...collectPersonCandidates(
        normalizedQuery,
        tokens,
        extractTmdbResults(personData),
        [
          ...tokenPersonPayloads.flatMap((payload) =>
            extractTmdbResults(payload)
          ),
          ...tokenPersonFallbackPayloads.flatMap((payload) =>
            extractTmdbResults(payload)
          ),
        ]
      )
    )
  }

  const topPersonDepartment = String(
    personCandidates[0]?.known_for_department || ""
  ).toLowerCase()
  const preferDirectorCredits = topPersonDepartment.includes("direct")

  const personMovieMatches = await runPersonMovieMatches(personCandidates)

  const movieMap = new Map<number, MovieAggregate>()
  for (const movie of extractTmdbResults(movieData)) {
    mergeMovieFromTitleSearch(movieMap, movie)
  }

  for (const [movieId, fromPerson] of personMovieMatches.entries()) {
    const existing = movieMap.get(movieId)
    if (!existing) {
      movieMap.set(movieId, fromPerson)
      continue
    }

    existing.personRoleScore = Math.max(
      existing.personRoleScore,
      fromPerson.personRoleScore
    )
    existing.personNameScore = Math.max(
      existing.personNameScore,
      fromPerson.personNameScore
    )
    movieMap.set(movieId, existing)
  }

  if (
    isCombinedQuery &&
    (analisis.tipo_detectado === "mixto" ||
      analisis.tipo_detectado === "persona")
  ) {
    const tokenMoviePayloads = await pMap(
      tokens,
      async (token) =>
        consultarTMDB(
          "search/movie",
          { query: token, page: "1" },
          { includeDefaultLanguage: false }
        ),
      { concurrency: 2 }
    )

    for (const payload of tokenMoviePayloads) {
      for (const movie of extractTmdbResults(payload).slice(0, 8)) {
        const matchedTokenCount = tokens.filter((token) =>
          fuzzyTokenMatchAny([token], toContextCandidates(movie))
        ).length
        mergeMovieFromTokenSearch(movieMap, movie, matchedTokenCount)
      }
    }
  }

  const localCountsMap = await enriquecerConDatosLocalesService(
    Array.from(movieMap.keys())
  )

  let rankedMovies = Array.from(movieMap.values()).map((entry) => {
    const localCounts = localCountsMap.get(Number(entry.movie.id))

    const titleRank = rankMovieByQuery(entry.movie, normalizedQuery)
    const titleSourceBoost = entry.hasTitleSource ? TITLE_SOURCE_BOOST : 0
    const tokenSourceBoost = entry.hasTokenSource ? TOKEN_SOURCE_BOOST : 0
    const exactTitleBoost = hasExactTitleMatch(entry.movie, normalizedQuery)
      ? TITLE_EXACT_BOOST
      : 0
    const exactTokenBoost =
      tokens.length > 1 && hasExactTokenTitleMatch(entry.movie, tokens)
        ? 3200
        : 0
    const fuzzyBoost = hasFuzzyTokenTitleMatch(entry.movie, tokens) ? 900 : 0
    const contextualTokenBoost =
      entry.tokenMatches > 0 ? entry.tokenMatches * 550 : 0
    const personBoost = entry.personRoleScore * personIntentMultiplier
    const personNameScore = Number(entry.personNameScore || 0)
    const roleThreshold =
      (preferDirectorCredits ? DIRECTOR_CREDIT_BOOST : ACTOR_CREDIT_BOOST) *
      Math.max(0.75, personNameScore)
    const hasStrongRoleSignal = entry.personRoleScore >= roleThreshold
    const strongPersonMatchBoost =
      personNameScore >= 0.82 && hasStrongRoleSignal
        ? PERSON_STRONG_MATCH_BOOST * personNameScore
        : 0
    const personTitleNoisePenalty =
      (analisis.tipo_detectado === "persona" ||
        analisis.tipo_detectado === "mixto") &&
      personNameScore >= 0.8 &&
      entry.hasTitleSource &&
      !hasStrongRoleSignal
        ? PERSON_TITLE_NOISE_PENALTY
        : 0
    const localBoost = localSignalScore(localCounts)
    const tmdbSignal = tmdbRatingSignalScore(entry.movie)

    const score =
      titleRank +
      titleSourceBoost +
      tokenSourceBoost +
      exactTitleBoost +
      exactTokenBoost +
      fuzzyBoost +
      contextualTokenBoost +
      personBoost +
      strongPersonMatchBoost +
      localBoost -
      personTitleNoisePenalty +
      tmdbSignal.total

    return {
      ...entry.movie,
      media_type: "movie",
      _smart_rank: score,
      ...(includeDebug
        ? {
            _score_debug: {
              title_rank: titleRank,
              title_source_boost: titleSourceBoost,
              token_source_boost: tokenSourceBoost,
              exact_title_boost: exactTitleBoost,
              exact_token_boost: exactTokenBoost,
              fuzzy_boost: fuzzyBoost,
              contextual_token_boost: contextualTokenBoost,
              token_matches: entry.tokenMatches,
              person_role_boost: personBoost,
              person_name_score: personNameScore,
              strong_person_match_boost: strongPersonMatchBoost,
              person_title_noise_penalty: personTitleNoisePenalty,
              local_boost: localBoost,
              vote_count_boost: tmdbSignal.voteCountBoost,
              vote_average_boost: tmdbSignal.voteAverageBoost,
              local_counts: {
                vault_count: localCounts?.vault_count || 0,
                review_count: localCounts?.review_count || 0,
                watchlist_count: localCounts?.watchlist_count || 0,
              },
            },
          }
        : {}),
    }
  })

  let rankedTV = extractTmdbResults(tvData).map((tv: AnyRecord) => {
    let score = getMatchStrength(tv.name, normalizedQuery)
    score += Number(tv.popularity || 0) * 0.02
    const hasExact = hasExactTVNameMatch(tv, normalizedQuery)
    if (hasExact) score += TV_EXACT_BOOST
    else score -= TV_NON_EXACT_PENALTY
    if (getMatchStrength(tv.name || tv.original_name, normalizedQuery) >= 70)
      score += TV_SOURCE_BOOST

    return {
      ...tv,
      media_type: "tv",
      _smart_rank: score,
    }
  })

  rankedMovies = rankedMovies.filter(hasMinimumMetadata)
  rankedTV = rankedTV.filter(hasMinimumMetadata)

  if (rankedMovies.length === 0 && isCombinedQuery) {
    const fallbackById = new Map<number, AnyRecord>()
    const fallbackTVById = new Map<number, AnyRecord>()
    const tokenBuckets = await pMap(
      tokens,
      async (token) => {
        const [moviePayload, tvPayload] = await Promise.all([
          consultarTMDB(
            "search/movie",
            { query: token, page: "1" },
            { includeDefaultLanguage: false }
          ),
          consultarTMDB(
            "search/tv",
            { query: token, page: "1" },
            { includeDefaultLanguage: false }
          ),
        ])
        return { moviePayload, tvPayload }
      },
      { concurrency: 2 }
    )

    for (const payload of tokenBuckets) {
      for (const movie of extractTmdbResults(payload.moviePayload)) {
        if (!movie?.id) continue
        const current = fallbackById.get(movie.id)
        if (!current) {
          fallbackById.set(movie.id, { ...movie, media_type: "movie" })
          continue
        }

        fallbackById.set(movie.id, {
          ...movie,
          ...current,
          media_type: "movie",
        })
      }

      for (const tv of extractTmdbResults(payload.tvPayload)) {
        if (!tv?.id) continue
        const current = fallbackTVById.get(tv.id)
        if (!current) {
          fallbackTVById.set(tv.id, { ...tv, media_type: "tv" })
          continue
        }

        fallbackTVById.set(tv.id, {
          ...tv,
          ...current,
          media_type: "tv",
        })
      }
    }

    rankedMovies = Array.from(fallbackById.values()).map((movie) => ({
      ...movie,
      _smart_rank: rankMovieByQuery(movie, normalizedQuery),
    }))
    rankedTV = Array.from(fallbackTVById.values()).map((tv) => ({
      ...tv,
      _smart_rank:
        getMatchStrength(tv.name, normalizedQuery) +
        Number(tv.popularity || 0) * 0.02,
    }))
  } else {
    rankedTV.sort(
      (a: AnyRecord, b: AnyRecord) =>
        Number(b._smart_rank || 0) - Number(a._smart_rank || 0)
    )
  }

  rankedMovies.sort((a, b) => {
    const aExact = hasExactTitleMatch(a, normalizedQuery)
    const bExact = hasExactTitleMatch(b, normalizedQuery)
    const directorRoleThreshold =
      ((DIRECTOR_CREDIT_BOOST + ACTOR_CREDIT_BOOST) / 2) *
      personIntentMultiplier

    if (aExact && bExact) {
      const byVotes = Number(b.vote_count || 0) - Number(a.vote_count || 0)
      if (byVotes !== 0) return byVotes
    }

    if (aExact !== bExact) return aExact ? -1 : 1

    const aPersonNameScore = Number(a?._score_debug?.person_name_score || 0)
    const bPersonNameScore = Number(b?._score_debug?.person_name_score || 0)
    const aRoleBoost = Number(a?._score_debug?.person_role_boost || 0)
    const bRoleBoost = Number(b?._score_debug?.person_role_boost || 0)

    const aDirectorLike =
      aPersonNameScore >= 0.82 && aRoleBoost >= directorRoleThreshold
    const bDirectorLike =
      bPersonNameScore >= 0.82 && bRoleBoost >= directorRoleThreshold
    if (aDirectorLike !== bDirectorLike) return aDirectorLike ? -1 : 1

    if (aRoleBoost !== bRoleBoost) return bRoleBoost - aRoleBoost

    return Number(b._smart_rank || 0) - Number(a._smart_rank || 0)
  })

  if (
    currentPage === 1 &&
    (analisis.tipo_detectado === "persona" ||
      analisis.tipo_detectado === "mixto")
  ) {
    const forcedTopMovie = rankedMovies.find(
      (movie) => Number(movie?._score_debug?.strong_person_match_boost || 0) > 0
    )
    if (forcedTopMovie) {
      rankedMovies = [
        forcedTopMovie,
        ...rankedMovies.filter((movie) => movie.id !== forcedTopMovie.id),
      ]
    }
  }

  let mergedMainResults = [...rankedMovies, ...rankedTV].sort(
    (a, b) => Number(b._smart_rank || 0) - Number(a._smart_rank || 0)
  )

  if (currentPage === 1) {
    const hasExactMovieMatch = rankedMovies.some((movie: AnyRecord) =>
      hasExactTitleMatch(movie, normalizedQuery)
    )
    const exactTVMatches = rankedTV
      .filter((tv: AnyRecord) => hasExactTVNameMatch(tv, normalizedQuery))
      .slice(0, 2)
    if (exactTVMatches.length > 0 && !hasExactMovieMatch) {
      const promotedIds = new Set(
        exactTVMatches.map((item: AnyRecord) => item.id)
      )
      mergedMainResults = [
        ...exactTVMatches,
        ...mergedMainResults.filter(
          (item: AnyRecord) =>
            !promotedIds.has(item.id) || item.media_type !== "tv"
        ),
      ]
    }
  }

  const start = (currentPage - 1) * SEARCH_PAGE_SIZE
  const pageSlice = mergedMainResults.slice(start, start + SEARCH_PAGE_SIZE)
  const movieResults = pageSlice.filter((item) => item.media_type === "movie")
  const tvResults = pageSlice.filter((item) => item.media_type === "tv")

  return {
    results: pageSlice,
    movie_results: movieResults,
    tv_results: tvResults,
    people_results: currentPage === 1 ? personCandidates.slice(0, 3) : [],
    total_results: mergedMainResults.length,
    total_pages: Math.max(
      1,
      Math.ceil(mergedMainResults.length / SEARCH_PAGE_SIZE)
    ),
    page: currentPage,
    ...(includeDebug
      ? {
          _debug: {
            query: normalizedQuery,
            analysis: analisis,
            counts: {
              movie_candidates: rankedMovies.length,
              tv_candidates: rankedTV.length,
              person_candidates: personCandidates.length,
            },
          },
        }
      : {}),
  }
}

/**
 * Obtiene el detalle exhaustivo de una serie de TV, incluyendo créditos, temporadas
 * y metadatos extendidos, con una capa de persistencia en caché.
 */
export const obtenerDetalleTVService = async (id: string) => {
  const cacheKey = `tmdb:search:${SEARCH_CACHE_VERSION}:tv-detail:${id}`

  return getOSet(
    cacheKey,
    async () => {
      const detail: any = await consultarTMDB(
        `tv/${id}`,
        {
          language: "es-ES",
          append_to_response: "credits,watch/providers,images,similar",
        },
        { includeDefaultLanguage: false }
      )

      const seasons = Array.isArray(detail?.seasons) ? detail.seasons : []
      const seasonNumbers = seasons
        .map((season: any) => Number(season?.season_number))
        .filter(
          (seasonNumber: number) =>
            Number.isFinite(seasonNumber) && seasonNumber >= 0
        )
        .slice(0, 20)

      const seasonDetails = await pMap(
        seasonNumbers,
        async (seasonNumber: number) =>
          consultarTMDB(
            `tv/${id}/season/${seasonNumber}`,
            { language: "es-ES" },
            { includeDefaultLanguage: false }
          ),
        { concurrency: 3 }
      )

      return {
        ...detail,
        season_details: seasonDetails,
      }
    },
    TTL_BUSQUEDA
  )
}
