/**
 * @file SearchController.ts
 * @description Controlador para el motor de búsqueda y exploración de contenido.
 * Gestiona consultas unificadas, búsquedas especializadas y la recuperación de
 * metadatos detallados de cine y televisión.
 */

import { Request, Response } from "express"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import {
  buildMovieSearchCacheKey,
  normalizeQuery,
  obtenerDetalleTVService,
  runRankedMovieSearch,
  runSmartUnifiedSearch,
  shouldAllowSearchDebug,
  TTL_BUSQUEDA,
} from "../services/unifiedSearch.services.js"
import { getOSet } from "../config/redis.js"

/**
 * Recupera el detalle completo de una serie de TV filtrado y enriquecido.
 */
export const getTVDetail = async (req: Request, res: Response) => {
  const id = String(req.params.id || "").trim()

  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: "Identificador de serie inválido." })
  }

  const datos = await obtenerDetalleTVService(id)
  res.status(200).json(datos)
}

/**
 * Realiza una búsqueda unificada inteligente (Smart Search) balanceando
 * relevancia de TMDB y métricas locales.
 */
export const getSearch = async (req: Request, res: Response) => {
  const q = normalizeQuery(req.query.q as string)
  const pagina = String(req.query.page || "1")

  if (!q) {
    return res
      .status(400)
      .json({ error: "Debe proporcionar un término de búsqueda." })
  }

  const cacheKey = buildMovieSearchCacheKey("general", q, pagina)
  const resultado = await getOSet(
    cacheKey,
    () => runSmartUnifiedSearch({ query: q, page: pagina }),
    TTL_BUSQUEDA
  )

  res.status(200).json(resultado)
}

/**
 * Ejecuta una búsqueda unificada con metadatos de depuración habilitados.
 */
export const getSearchDebug = async (req: Request, res: Response) => {
  if (!shouldAllowSearchDebug(req)) {
    return res
      .status(403)
      .json({ error: "Acceso denegado a herramientas de depuración." })
  }

  const q = normalizeQuery(req.query.q as string)
  const pagina = String(req.query.page || "1")

  if (!q) {
    return res
      .status(400)
      .json({ error: "Debe proporcionar un término de búsqueda." })
  }

  const resultado = await runSmartUnifiedSearch({
    query: q,
    page: pagina,
    includeDebug: true,
  })
  res.status(200).json(resultado)
}

/**
 * Realiza una búsqueda multiobjetivo (Películas, Series y Personas) simultánea.
 */
export const getMultiSearch = async (req: Request, res: Response) => {
  const query = normalizeQuery(req.query.q as string)
  const datos = await consultarTMDB("search/multi", {
    query,
    ...(req.query.page && { page: req.query.page as string }),
  })
  res.status(200).json(datos)
}

/**
 * Ejecuta una búsqueda especializada en personalidades (Actores/Directores).
 */
export const getPersonSearch = async (req: Request, res: Response) => {
  const q = normalizeQuery(req.query.q as string)
  if (!q) {
    return res
      .status(400)
      .json({ error: "Identificador de personalidad inválido." })
  }

  const page = String(req.query.page || "1")
  const cacheKey = buildMovieSearchCacheKey("person", q, page)
  const datos = await getOSet(
    cacheKey,
    () =>
      consultarTMDB(
        "search/person",
        { query: q, page },
        { includeDefaultLanguage: false }
      ),
    TTL_BUSQUEDA
  )
  res.status(200).json(datos)
}

/**
 * Realiza una búsqueda exclusiva de películas con ranking por relevancia de título.
 */
export const getMovieSearch = async (req: Request, res: Response) => {
  const q = normalizeQuery(req.query.q as string)
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

/**
 * Obtiene el catálogo oficial de géneros cinematográficos disponibles.
 */
export const getMovieGenres = async (req: Request, res: Response) => {
  const datos = await consultarTMDB("genre/movie/list", {
    language: (req.query.language as string) || "es-ES",
  })
  res.status(200).json(datos)
}

/**
 * Ejecuta una búsqueda exclusiva de series de televisión.
 */
export const getTVSearch = async (req: Request, res: Response) => {
  const q = normalizeQuery(req.query.q as string)
  if (!q) {
    return res
      .status(400)
      .json({ error: "Debe proporcionar un término de búsqueda." })
  }

  const page = String(req.query.page || "1")
  const cacheKey = buildMovieSearchCacheKey("tv", q, page)
  const datos = await getOSet(
    cacheKey,
    () =>
      consultarTMDB(
        "search/tv",
        { query: q, page },
        { includeDefaultLanguage: false }
      ),
    TTL_BUSQUEDA
  )
  res.status(200).json(datos)
}
