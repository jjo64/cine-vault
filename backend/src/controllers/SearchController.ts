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

// 2 horas — las búsquedas de TMDB no cambian entre requests
const TTL_BUSQUEDA = 60 * 60 * 2
const SEARCH_PAGE_SIZE = 20
const FIRST_PAGE_CANDIDATE_PAGES = ["1", "2", "3"]

const buildMovieSearchCacheKey = (
  scope: "general" | "movie",
  query: string,
  page: string,
  withGenres?: string
) =>
  `tmdb:search:v2:${scope}:${query.toLowerCase().trim()}:p${page}:g${
    withGenres || "all"
  }`

const runRankedMovieSearch = async ({
  query,
  page,
  withGenres,
}: {
  query: string
  page: string
  withGenres?: string
}) => {
  const currentPage = Math.max(1, Number(page || "1") || 1)
  const candidatePages =
    currentPage === 1 ? FIRST_PAGE_CANDIDATE_PAGES : [String(currentPage)]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pagePayloads: Array<{ englishData: any; spanishData: any }> =
    await pMap(
      candidatePages,
      async (candidatePage) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [englishData, spanishData]: any[] = await Promise.all([
          consultarTMDB(
            "search/movie",
            {
              query,
              page: candidatePage,
              ...(withGenres && { with_genres: withGenres }),
              language: "en-US",
            },
            { includeDefaultLanguage: false }
          ),
          consultarTMDB(
            "search/movie",
            {
              query,
              page: candidatePage,
              ...(withGenres && { with_genres: withGenres }),
              language: "es-ES",
            },
            { includeDefaultLanguage: false }
          ),
        ])

        return {
          englishData,
          spanishData,
        }
      },
      { concurrency: 2 }
    )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const englishResults = pagePayloads.flatMap((payload) =>
    Array.isArray(payload.englishData?.results) ? payload.englishData.results : ([] as any[])
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spanishResults = pagePayloads.flatMap((payload) =>
    Array.isArray(payload.spanishData?.results) ? payload.spanishData.results : ([] as any[])
  )

  const { merged } = mergeEnglishAndSpanishResults(englishResults, spanishResults)

  const rankedResults = await pMap(
    merged,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (movie: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [credits, titles]: any[] = await Promise.all([
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (person: any) => person.job === "Director"
      )?.name

      const withTitles = attachAlternativeTitles(movie, titles.titles || [])

      return {
        ...withTitles,
        director,
        _title_rank: rankMovieByQuery(withTitles, query),
      }
    },
    { concurrency: 5 }
  )

  rankedResults.sort(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any, b: any) =>
      Number(b._title_rank || 0) - Number(a._title_rank || 0)
  )

  const primaryPayload = pagePayloads[0] || { englishData: {}, spanishData: {} }

  const paginatedResults =
    currentPage === 1
      ? rankedResults.slice(0, SEARCH_PAGE_SIZE)
      : rankedResults

  return {
    results: paginatedResults,
    total_pages: Math.max(
      Number(primaryPayload.englishData?.total_pages || 1),
      Number(primaryPayload.spanishData?.total_pages || 1)
    ),
    total_results: Math.max(
      Number(primaryPayload.englishData?.total_results || rankedResults.length),
      Number(primaryPayload.spanishData?.total_results || rankedResults.length)
    ),
    page: Number(primaryPayload.englishData?.page || primaryPayload.spanishData?.page || page),
  }
}

export const getSearch = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const q = req.query.q as string
  const pagina = String(req.query.page || "1")

  if (!q) {
    return res
      .status(400)
      .json({ error: "Debe proporcionar un término de búsqueda." })
  }

  const cacheKey = buildMovieSearchCacheKey("general", q, pagina)

  const resultado = await getOSet(cacheKey, () => runRankedMovieSearch({ query: q, page: pagina }), TTL_BUSQUEDA)

  res.status(200).json(resultado)
}

export const getMultiSearch = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const datos = await consultarTMDB("search/multi", {
    query: req.query.q as string,
    ...(req.query.page && { page: req.query.page as string }),
  })
  res.status(200).json(datos)
}

export const getPersonSearch = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const datos = await consultarTMDB("search/person", {
    query: req.query.q as string,
    ...(req.query.page && { page: req.query.page as string }),
  })
  res.status(200).json(datos)
}

export const getMovieSearch = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const q = req.query.q as string
  if (!q) {
    return res
      .status(400)
      .json({ error: "Debe proporcionar un término de búsqueda." })
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
  const datos = await consultarTMDB("search/tv", {
    query: req.query.q as string,
    ...(req.query.page && { page: req.query.page as string }),
  })
  res.status(200).json(datos)
}

const assertNotRateLimited = async (ip: string) => {
  if (await checkIPSpike(ip)) {
    throw new TooManyRequestsError("Demasiadas solicitudes, intenta más tarde")
  }
}
