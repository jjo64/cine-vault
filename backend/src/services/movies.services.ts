/**
 * @file movies.services.ts
 * @description Capa de servicios para la consulta de películas en CineVault.
 * Implementa el consumo avanzado de la API de TMDB, resolución de slugs
 * y agregación de metadatos para minimizar latencia en las rutas.
 */

import { consultarTMDB } from "../helpers/fetchTMDB.js"
import {
  mergeEnglishAndSpanishResults,
  rankMovieByQuery,
} from "../helpers/titleRanking.js"

/**
 * ---------------------------------------------------------------------------
 * DESCUBRIMIENTO
 * ---------------------------------------------------------------------------
 */

export const getUpcomingMovies = async () => {
  return await consultarTMDB("movie/upcoming", { region: "es" })
}

export const getTopRatedMovies = async () => {
  return await consultarTMDB("movie/top_rated", { region: "es" })
}

export const getPopularMovies = async () => {
  return await consultarTMDB("movie/popular", { region: "es" })
}

/**
 * ---------------------------------------------------------------------------
 * BÚSQUEDA Y RESOLUCIÓN
 * ---------------------------------------------------------------------------
 */

export const searchMovies = async (query: string, page: string) => {
  return await consultarTMDB("search/movie", { query, page })
}

/**
 * Resuelve un ID de TMDB a partir de una cadena que puede ser un slug.
 * Implementa lógica de ranking para asegurar precisión en la búsqueda por título.
 */
export const resolveMovieIdFromSlug = async (slug: string) => {
  const nombreLimpio = slug.replace(/-/g, " ")

  const [enData, esData]: any[] = await Promise.all([
    consultarTMDB(
      "search/movie",
      { query: nombreLimpio, language: "en-US" },
      { includeDefaultLanguage: false }
    ),
    consultarTMDB(
      "search/movie",
      { query: nombreLimpio, language: "es-ES" },
      { includeDefaultLanguage: false }
    ),
  ])

  const { merged } = mergeEnglishAndSpanishResults(
    Array.isArray(enData?.results) ? enData.results : [],
    Array.isArray(esData?.results) ? esData.results : []
  )

  const ranked = (merged as any[])
    .map((movie) => ({
      ...movie,
      _title_rank: rankMovieByQuery(movie, nombreLimpio),
    }))
    .sort((a, b) => Number(b._title_rank || 0) - Number(a._title_rank || 0))

  return ranked.length > 0 ? ranked[0].id : null
}

/**
 * ---------------------------------------------------------------------------
 * DETALLE COMPLETO
 * ---------------------------------------------------------------------------
 */

/**
 * Obtiene todos los metadatos necesarios de una película en una sola operación consolidada.
 */
export const getMovieDetails = async (movieId: number) => {
  const [detalles, creditos, proveedores, titulos, imagenes] = (await Promise.all([
    consultarTMDB(`movie/${movieId}`),
    consultarTMDB(`movie/${movieId}/credits`),
    consultarTMDB(`movie/${movieId}/watch/providers`, { language: "es-ES" }),
    consultarTMDB(`movie/${movieId}/alternative_titles`, { language: "" }, { includeDefaultLanguage: false }),
    consultarTMDB(`movie/${movieId}/images`, { include_image_language: "en,null" }, { includeDefaultLanguage: false }),
  ])) as [any, any, any, any, any]

  return {
    ...detalles,
    credits: {
      cast: creditos.cast || [],
      crew: creditos.crew || [],
    },
    watch_providers: proveedores.results || {},
    alternative_titles: titulos.titles || [],
    images: {
      backdrops: imagenes.backdrops || [],
      logos: imagenes.logos || [],
      posters: imagenes.posters || [],
    },
  }
}
