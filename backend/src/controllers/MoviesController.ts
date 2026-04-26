/**
 * @file MoviesController.ts
 * @description Controlador para la gestión de información de películas.
 * Orquesta las peticiones hacia TMDB mediante MovieService y gestiona la caché.
 */

import { Request, Response } from "express"
import { getOSet } from "../config/redis.js"
import * as MovieService from "../services/movies.services.js"

const TTL_LISTAS = 3600 // 1 hora
const TTL_DETALLE = 21600 // 6 horas

/**
 * Obtiene películas por estrenar.
 */
export const getUpcoming = async (_req: Request, res: Response) => {
  const data = await getOSet(
    "tmdb:movies:upcoming",
    () => MovieService.getUpcomingMovies(),
    TTL_LISTAS
  )
  res.json(data)
}

/**
 * Obtiene películas mejor valoradas.
 */
export const getTopRated = async (_req: Request, res: Response) => {
  const data = await getOSet(
    "tmdb:movies:top-rated",
    () => MovieService.getTopRatedMovies(),
    TTL_LISTAS
  )
  res.json(data)
}

/**
 * Obtiene películas populares.
 */
export const getPopular = async (_req: Request, res: Response) => {
  const data = await getOSet(
    "tmdb:movies:popular",
    () => MovieService.getPopularMovies(),
    TTL_LISTAS
  )
  res.json(data)
}

/**
 * Motor de búsqueda de películas.
 */
export const search = async (req: Request, res: Response) => {
  const query = String(req.query.q || "").trim()
  const page = String(req.query.page || "1").trim()

  if (!query) {
    return res
      .status(400)
      .json({ message: "Se requiere un término de búsqueda." })
  }

  const data = await getOSet(
    `tmdb:movies:search:${query.toLowerCase()}:p${page}`,
    () => MovieService.searchMovies(query, page),
    TTL_LISTAS
  )

  res.json(data)
}

/**
 * Obtiene el detalle profundo de una película por ID o Slug.
 */
export const getDetail = async (req: Request, res: Response) => {
  const idOrSlug = req.params.idOrSlug as string
  let movieId: number = parseInt(idOrSlug)

  // 1. Resolución de Slug a ID si es necesario
  if (isNaN(movieId)) {
    console.log(`[MoviesController] Resolviendo slug: ${idOrSlug}`)
    movieId = await MovieService.resolveMovieIdFromSlug(idOrSlug)
    if (!movieId) {
      console.warn(`[MoviesController] No se pudo resolver el slug: ${idOrSlug}`)
      return res.status(404).json({ message: "Película no encontrada (Slug no resuelto)" })
    }
  }

  console.log(`[MoviesController] Obteniendo detalle para ID: ${movieId}`)

  // 2. Obtención de metadatos expandidos
  try {
    const detalle = await getOSet(
      `tmdb:movie:${movieId}`,
      () => MovieService.getMovieDetails(movieId),
      TTL_DETALLE
    )

    if (!detalle) {
      console.warn(`[MoviesController] TMDB no devolvió datos para ID: ${movieId}`)
      return res.status(404).json({ message: "La película no existe en TMDB" })
    }

    res.status(200).json(detalle)
  } catch (error: any) {
    console.error(`[MoviesController] ERROR CRÍTICO para ID ${movieId}:`, error)
    // Propagar al manejador global pero con contexto
    throw error
  }
}

/**
 * Obtiene películas similares a una dada por ID o Slug.
 */
export const getSimilar = async (req: Request, res: Response) => {
  const idOrSlug = req.params.idOrSlug as string
  let movieId: number = parseInt(idOrSlug)

  if (isNaN(movieId)) {
    const resolvedId = await getOSet(
      `tmdb:slug:${idOrSlug}`,
      () => MovieService.resolveMovieIdFromSlug(idOrSlug),
      TTL_DETALLE
    )

    if (!resolvedId) {
      return res.status(404).json({ message: "Referencia no encontrada." })
    }
    movieId = resolvedId as number
  }

  const data = await getOSet(
    `tmdb:movie:${movieId}:similar`,
    () => MovieService.getSimilarMovies(movieId),
    TTL_LISTAS
  )

  res.json(data)
}
