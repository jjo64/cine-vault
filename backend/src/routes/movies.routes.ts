/**
 * @file movies.routes.ts
 * @description Rutas para la consulta de información de películas.
 * Integra la API de TMDB con una capa de caché Redis para optimizar el rendimiento.
 * Gestiona el descubrimiento de estrenos, rankings y el detalle profundo de títulos.
 */

import { Request, Response, Router } from "express"
import { getOSet } from "../config/redis.js"
import { consultarTMDB } from "../helpers/fetchTMDB.js"
import {
  mergeEnglishAndSpanishResults,
  rankMovieByQuery,
} from "../helpers/titleRanking.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

/**
 * @swagger
 * tags:
 *   name: Películas
 *   description: Consulta de películas y metadatos desde TMDB
 */

const router = Router()

/**
 * Tiempos de vida (TTL) para la caché de Redis.
 */
const TTL = {
  LISTAS: 60 * 60, // 1 hora
  DETALLE: 60 * 60 * 6, // 6 horas
}

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: DESCUBRIMIENTO (Listas Globales)
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /movies/upcoming:
 *   get:
 *     summary: Obtener próximos estrenos cinematográficos
 *     tags: [Películas]
 */
router.get(
  "/upcoming",
  manejadorAsincrono(async (req: Request, res: Response) => {
    const data = await getOSet(
      "tmdb:movies:upcoming",
      () => consultarTMDB("movie/upcoming", { region: "es" }),
      TTL.LISTAS
    )
    res.json(data)
  })
)

/**
 * @swagger
 * /movies/top-rated:
 *   get:
 *     summary: Listar películas con mayor valoración de la historia
 *     tags: [Películas]
 */
router.get(
  "/top-rated",
  manejadorAsincrono(async (req: Request, res: Response) => {
    const data = await getOSet(
      "tmdb:movies:top-rated",
      () => consultarTMDB("movie/top_rated", { region: "es" }),
      TTL.LISTAS
    )
    res.json(data)
  })
)

/**
 * @swagger
 * /movies/popular:
 *   get:
 *     summary: Consultar tendencias mundiales actuales
 *     tags: [Películas]
 */
router.get(
  "/popular",
  manejadorAsincrono(async (req: Request, res: Response) => {
    const data = await getOSet(
      "tmdb:movies:popular",
      () => consultarTMDB("movie/popular", { region: "es" }),
      TTL.LISTAS
    )
    res.json(data)
  })
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: BÚSQUEDA Y DETALLE
 * ---------------------------------------------------------------------------
 */

/**
 * Búsqueda optimizada por título.
 */
router.get(
  "/search",
  manejadorAsincrono(async (req: Request, res: Response) => {
    const query = String(req.query.q || "").trim()
    const page = String(req.query.page || "1").trim()

    if (!query) {
      return res.status(400).json({ message: "Se requiere un término de búsqueda." })
    }

    const data = await getOSet(
      `tmdb:movies:search:${query.toLowerCase()}:p${page}`,
      () => consultarTMDB("search/movie", { query, page }),
      TTL.LISTAS
    )

    res.json(data)
  })
)

/**
 * @swagger
 * /movies/{idOrSlug}:
 *   get:
 *     summary: Detalle profundo de una película (incluye créditos e imágenes)
 *     tags: [Películas]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: ID numérico o slug amigable de la película
 */
router.get(
  "/:idOrSlug",
  manejadorAsincrono(async (req: Request, res: Response) => {
    const idOSlug = req.params.idOrSlug as string
    let idPelicula: number = parseInt(idOSlug)

    // Resolución de Slug a ID TMDB
    if (isNaN(idPelicula)) {
      const nombreLimpio = idOSlug.replace(/-/g, " ")

      const datosBusqueda = (await getOSet(
        `tmdb:slug:${idOSlug}`,
        async () => {
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

          return { results: ranked }
        },
        TTL.DETALLE
      )) as { results: { id: number }[] }

      if (!datosBusqueda.results?.length) {
        return res.status(404).json({ message: "Referencia no encontrada." })
      }

      idPelicula = datosBusqueda.results[0].id
    }

    // Recuperación de metadatos expandidos
    const detalle = await getOSet(
      `tmdb:movie:${idPelicula}`,
      async () => {
        const [detalles, creditos, proveedores, titulos, imagenes] = (await Promise.all([
          consultarTMDB(`movie/${idPelicula}`),
          consultarTMDB(`movie/${idPelicula}/credits`),
          consultarTMDB(`movie/${idPelicula}/watch/providers`, { language: "es-ES" }),
          consultarTMDB(`movie/${idPelicula}/alternative_titles`, { language: "" }, { includeDefaultLanguage: false }),
          consultarTMDB(`movie/${idPelicula}/images`, { include_image_language: "en,null" }, { includeDefaultLanguage: false }),
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
      },
      TTL.DETALLE
    )

    res.json(detalle)
  })
)

export default router
