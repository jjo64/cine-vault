import { consultarTMDB } from "../helpers/fetchTMDB.js"
import { getOSet } from "../config/redis.js"
import pMap from "p-map"
import { Request, Response } from "express"
import { checkIPSpike } from "../services/security.services.js"
import { TooManyRequestsError } from "../errors/AppErrors.js"
import {
  attachAlternativeTitles,
  mergeEnglishAndSpanishResults,
  rankMovieByQuery,
} from "../helpers/titleRanking.js"

const TTL_BUSQUEDA = 60 * 60 * 2
const SEARCH_PAGE_SIZE = 20
const FIRST_PAGE_CANDIDATE_PAGES = ["1", "2", "3"]
const SEARCH_CACHE_VERSION = "v10"

const TITLE_EXACT_BOOST = 4200
const TITLE_SOURCE_BOOST = 1200
const DIRECTOR_CREDIT_BOOST = 700
const ACTOR_CREDIT_BOOST = 450
const TV_SOURCE_BOOST = 2200
const TV_EXACT_BOOST = 5000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = any

type PersonCandidate = {
  id: number
  name: string
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
  personRoleScore: number
}

const normalizeQuery = (raw: string) =>
  String(raw || "")
    .trim()
    .replace(/\s+/g, " ")

const getMatchStrength = (candidateRaw: string | null | undefined, rawQuery: string) => {
  const candidate = normalizeQuery(candidateRaw || "").toLowerCase()
  const query = normalizeQuery(rawQuery).toLowerCase()
  if (!candidate || !query) return 0
  if (candidate === query) return 100
  if (candidate.startsWith(query)) return 70
  if (candidate.includes(query)) return 40
  return 0
}

const toTitleCandidates = (movie: AnyRecord) => {
  const localized = Array.isArray(movie.localized_titles) ? movie.localized_titles : []
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

const hasExactTitleMatch = (movie: AnyRecord, query: string) => {
  const normalizedQuery = normalizeQuery(query).toLowerCase()
  if (!normalizedQuery) return false
  return toTitleCandidates(movie).some((candidate) => candidate === normalizedQuery)
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

const selectLikelyPersonTokens = (tokens: string[]) => {
  if (tokens.length <= 1) return tokens
  const trailing = tokens.slice(1).filter((token) => normalizeQuery(token).length >= 2)
  return trailing.length > 0 ? trailing : tokens
}

const buildMovieSearchCacheKey = (
  scope: "general" | "movie" | "person" | "tv",
  query: string,
  page: string,
  withGenres?: string
) =>
  `tmdb:search:${SEARCH_CACHE_VERSION}:${scope}:${normalizeQuery(query)
    .toLowerCase()
    .replace(/\s+/g, "+")}:p${page}:g${withGenres || "all"}`

const buildPersonCreditsCacheKey = (personId: number) =>
  `tmdb:search:${SEARCH_CACHE_VERSION}:person-credits:${personId}`

const runRankedMovieSearch = async ({
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
  const candidatePages = currentPage === 1 ? FIRST_PAGE_CANDIDATE_PAGES : [String(currentPage)]

  const pagePayloads: Array<{ primaryData: AnyRecord; spanishData: AnyRecord }> = await pMap(
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
    Array.isArray(payload.primaryData?.results) ? payload.primaryData.results : ([] as AnyRecord[])
  )
  const spanishResults = pagePayloads.flatMap((payload) =>
    Array.isArray(payload.spanishData?.results) ? payload.spanishData.results : ([] as AnyRecord[])
  )

  const { merged } = mergeEnglishAndSpanishResults(primaryResults, spanishResults)

  const rankedResults = await pMap(
    merged,
    async (movie: AnyRecord) => {
      const [credits, titles]: AnyRecord[] = await Promise.all([
        consultarTMDB(`movie/${movie.id}/credits`, { language: "en-US" }, { includeDefaultLanguage: false }),
        consultarTMDB(`movie/${movie.id}/alternative_titles`, {}, { includeDefaultLanguage: false }),
      ])

      const director = credits.crew?.find((person: AnyRecord) => person.job === "Director")?.name
      const withTitles = attachAlternativeTitles(movie, titles.titles || [])

      return {
        ...withTitles,
        director,
        _title_rank: rankMovieByQuery(withTitles, normalizedQuery),
      }
    },
    { concurrency: 3 }
  )

  rankedResults.sort((a: AnyRecord, b: AnyRecord) => Number(b._title_rank || 0) - Number(a._title_rank || 0))

  const primaryPayload = pagePayloads[0] || { primaryData: {}, spanishData: {} }

  return {
    results: currentPage === 1 ? rankedResults.slice(0, SEARCH_PAGE_SIZE) : rankedResults,
    total_pages: Math.max(
      Number(primaryPayload.primaryData?.total_pages || 1),
      Number(primaryPayload.spanishData?.total_pages || 1)
    ),
    total_results: Math.max(
      Number(primaryPayload.primaryData?.total_results || rankedResults.length),
      Number(primaryPayload.spanishData?.total_results || rankedResults.length)
    ),
    page: Number(primaryPayload.primaryData?.page || primaryPayload.spanishData?.page || page),
  }
}

const collectPersonCandidates = (
  personResults: AnyRecord[] = [],
  tokenPersonResults: AnyRecord[] = []
): PersonCandidate[] => {
  const byId = new Map<number, PersonCandidate>()
  for (const person of [...personResults, ...tokenPersonResults]) {
    if (!person?.id || !person?.name) continue
    if (byId.has(person.id)) continue

    byId.set(person.id, {
      id: person.id,
      name: person.name,
      profile_path: person.profile_path || null,
      known_for_department: person.known_for_department,
      known_for: Array.isArray(person.known_for)
        ? person.known_for
            .filter((item: AnyRecord) => (item.title || item.name) && item.poster_path)
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

  return Array.from(byId.values()).slice(0, 5)
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
  role: PersonRole
) => {
  if (!movieCredit?.id) return

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
      personRoleScore: role === "director" ? DIRECTOR_CREDIT_BOOST : ACTOR_CREDIT_BOOST,
    })
    return
  }

  existing.personRoleScore = Math.max(
    existing.personRoleScore,
    role === "director" ? DIRECTOR_CREDIT_BOOST : ACTOR_CREDIT_BOOST
  )
  map.set(movieCredit.id, existing)
}

const mergeMovieFromTitleSearch = (map: Map<number, MovieAggregate>, movie: AnyRecord) => {
  if (!movie?.id) return

  const existing = map.get(movie.id)
  if (!existing) {
    map.set(movie.id, {
      movie: {
        ...movie,
        media_type: "movie",
      },
      hasTitleSource: true,
      personRoleScore: 0,
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

const runPersonMovieMatches = async (candidates: PersonCandidate[]): Promise<Map<number, MovieAggregate>> => {
  const map = new Map<number, MovieAggregate>()

  await pMap(
    candidates,
    async (person) => {
      const credits: AnyRecord = await fetchCreditsForPerson(person)

      const directedMovies = Array.isArray(credits?.crew)
        ? credits.crew.filter((item: AnyRecord) => item?.job === "Director").slice(0, 20)
        : []
      const actedMovies = Array.isArray(credits?.cast) ? credits.cast.slice(0, 20) : []

      for (const movie of directedMovies) {
        mergeMovieFromPersonCredit(map, movie, "director")
      }
      for (const movie of actedMovies) {
        mergeMovieFromPersonCredit(map, movie, "actor")
      }
    },
    { concurrency: 2 }
  )

  return map
}

const extractTmdbResults = (payload: AnyRecord) => (Array.isArray(payload?.results) ? payload.results : [])

const runSmartUnifiedSearch = async ({
  query,
  page,
}: {
  query: string
  page: string
}) => {
  const normalizedQuery = normalizeQuery(query)
  const currentPage = Math.max(1, Number(page || "1") || 1)
  const tokens = normalizedQuery.split(" ").filter(Boolean)
  const isCombinedQuery = tokens.length > 1

  const [movieData, personData, tvData] = await Promise.all([
    runRankedMovieSearch({ query: normalizedQuery, page }),
    consultarTMDB("search/person", { query: normalizedQuery, page }, { includeDefaultLanguage: false }),
    consultarTMDB("search/tv", { query: normalizedQuery, page }, { includeDefaultLanguage: false }),
  ])

  const likelyPersonTokens = selectLikelyPersonTokens(tokens)

  const tokenPersonPayloads = isCombinedQuery
    ? await pMap(
        likelyPersonTokens,
        async (token) =>
          consultarTMDB("search/person", { query: token, page: "1" }, { includeDefaultLanguage: false }),
        { concurrency: 2 }
      )
    : []

  const personCandidates = collectPersonCandidates(
    extractTmdbResults(personData),
    tokenPersonPayloads.flatMap((payload) => extractTmdbResults(payload))
  )

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

    existing.personRoleScore = Math.max(existing.personRoleScore, fromPerson.personRoleScore)
    movieMap.set(movieId, existing)
  }

  let rankedMovies = Array.from(movieMap.values()).map((entry) => {
    let score = rankMovieByQuery(entry.movie, normalizedQuery)
    if (entry.hasTitleSource) score += TITLE_SOURCE_BOOST
    if (hasExactTitleMatch(entry.movie, normalizedQuery)) score += TITLE_EXACT_BOOST
    if (tokens.length > 1 && hasExactTokenTitleMatch(entry.movie, tokens)) score += 3200
    score += entry.personRoleScore

    return {
      ...entry.movie,
      media_type: "movie",
      _smart_rank: score,
    }
  })

  let rankedTV = extractTmdbResults(tvData).map((tv: AnyRecord) => {
    let score = getMatchStrength(tv.name, normalizedQuery)
    score += Number(tv.popularity || 0) * 0.02
    if (hasExactTVNameMatch(tv, normalizedQuery)) score += TV_EXACT_BOOST
    if (getMatchStrength(tv.name || tv.original_name, normalizedQuery) >= 70) score += TV_SOURCE_BOOST

    return {
      ...tv,
      media_type: "tv",
      _smart_rank: score,
    }
  })

  if (rankedMovies.length === 0 && isCombinedQuery) {
    const fallbackById = new Map<number, AnyRecord>()
    const fallbackTVById = new Map<number, AnyRecord>()
    const tokenBuckets = await pMap(
      tokens,
      async (token) => {
        const [moviePayload, tvPayload] = await Promise.all([
          consultarTMDB("search/movie", { query: token, page: "1" }, { includeDefaultLanguage: false }),
          consultarTMDB("search/tv", { query: token, page: "1" }, { includeDefaultLanguage: false }),
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

    rankedMovies = Array.from(fallbackById.values())
      .map((movie) => ({
        ...movie,
        _smart_rank: rankMovieByQuery(movie, normalizedQuery),
      }))
    rankedTV = Array.from(fallbackTVById.values())
      .map((tv) => ({
        ...tv,
        _smart_rank: getMatchStrength(tv.name, normalizedQuery) + Number(tv.popularity || 0) * 0.02,
      }))
  } else {
    rankedTV.sort((a: AnyRecord, b: AnyRecord) => Number(b._smart_rank || 0) - Number(a._smart_rank || 0))
  }

  rankedMovies.sort((a, b) => Number(b._smart_rank || 0) - Number(a._smart_rank || 0))

  let mergedMainResults = [...rankedMovies, ...rankedTV].sort(
    (a, b) => Number(b._smart_rank || 0) - Number(a._smart_rank || 0)
  )

  if (currentPage === 1) {
    const exactTVMatches = rankedTV.filter((tv: AnyRecord) => hasExactTVNameMatch(tv, normalizedQuery)).slice(0, 2)
    if (exactTVMatches.length > 0) {
      const promotedIds = new Set(exactTVMatches.map((item: AnyRecord) => item.id))
      mergedMainResults = [
        ...exactTVMatches,
        ...mergedMainResults.filter((item: AnyRecord) => !promotedIds.has(item.id) || item.media_type !== "tv"),
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
    total_pages: Math.max(1, Math.ceil(mergedMainResults.length / SEARCH_PAGE_SIZE)),
    page: currentPage,
  }
}

export const getTVDetail = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const id = String(req.params.id || "").trim()

  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: "ID de serie invalido." })
  }

  const cacheKey = `tmdb:search:${SEARCH_CACHE_VERSION}:tv-detail:${id}`
  const datos = await getOSet(
    cacheKey,
    () =>
      consultarTMDB(
        `tv/${id}`,
        {
          language: "es-ES",
          append_to_response: "credits,watch/providers,images",
        },
        { includeDefaultLanguage: false }
      ),
    TTL_BUSQUEDA
  )

  res.status(200).json(datos)
}

export const getSearch = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const q = normalizeQuery(req.query.q as string)
  const pagina = String(req.query.page || "1")

  if (!q) {
    return res.status(400).json({ error: "Debe proporcionar un termino de busqueda." })
  }

  const cacheKey = buildMovieSearchCacheKey("general", q, pagina)

  const resultado = await getOSet(
    cacheKey,
    () => runSmartUnifiedSearch({ query: q, page: pagina }),
    TTL_BUSQUEDA
  )

  res.status(200).json(resultado)
}

export const getMultiSearch = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const query = normalizeQuery(req.query.q as string)
  const datos = await consultarTMDB("search/multi", {
    query,
    ...(req.query.page && { page: req.query.page as string }),
  })
  res.status(200).json(datos)
}

export const getPersonSearch = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const q = normalizeQuery(req.query.q as string)
  if (!q) {
    return res.status(400).json({ error: "Debe proporcionar un termino de busqueda." })
  }

  const page = String(req.query.page || "1")
  const cacheKey = buildMovieSearchCacheKey("person", q, page)
  const datos = await getOSet(
    cacheKey,
    () => consultarTMDB("search/person", { query: q, page }, { includeDefaultLanguage: false }),
    TTL_BUSQUEDA
  )
  res.status(200).json(datos)
}

export const getMovieSearch = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const q = normalizeQuery(req.query.q as string)
  if (!q) {
    return res.status(400).json({ error: "Debe proporcionar un termino de busqueda." })
  }

  const page = String(req.query.page || "1")
  const withGenres = req.query.with_genres as string | undefined

  const cacheKey = buildMovieSearchCacheKey("movie", q, page, withGenres)

  const datos = await getOSet(
    cacheKey,
    () => runRankedMovieSearch({ query: q, page, withGenres }),
    TTL_BUSQUEDA
  )

  res.status(200).json(datos)
}

export const getMovieGenres = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const datos = await consultarTMDB("genre/movie/list", {
    language: (req.query.language as string) || "es-ES",
  })
  res.status(200).json(datos)
}

export const getTVSearch = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const q = normalizeQuery(req.query.q as string)
  if (!q) {
    return res.status(400).json({ error: "Debe proporcionar un termino de busqueda." })
  }

  const page = String(req.query.page || "1")
  const cacheKey = buildMovieSearchCacheKey("tv", q, page)
  const datos = await getOSet(
    cacheKey,
    () => consultarTMDB("search/tv", { query: q, page }, { includeDefaultLanguage: false }),
    TTL_BUSQUEDA
  )
  res.status(200).json(datos)
}

const assertNotRateLimited = async (ip: string) => {
  if (await checkIPSpike(ip)) {
    throw new TooManyRequestsError("Demasiadas solicitudes, intenta mas tarde")
  }
}

