/**
 * @file search.routes.ts
 * @description Rutas para el motor de búsqueda universal de CineVault.
 * Permite buscar películas, series y personas utilizando el ecosistema TMDB.
 * Incluye técnicas de ranking de relevancia y límites de tasa para proteger la API.
 */

import { Router } from "express"
import {
  getMovieGenres,
  getMovieSearch,
  getMultiSearch,
  getPersonSearch,
  getSearch,
  getSearchDebug,
  getTVDetail,
  getTVSearch,
} from "../controllers/SearchController.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { limitarSpikesIP } from "../middlewares/rateLimit.middleware.js"

/**
 * @swagger
 * tags:
 *   name: Búsqueda
 *   description: Consultas avanzadas de contenido multimedia
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: BÚSQUEDA UNIVERSAL (Recomendado)
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Búsqueda general con ranking de relevancia
 *     tags: [Búsqueda]
 */
router.get("/", limitarSpikesIP, manejadorAsincrono(getSearch))

/**
 * Búsqueda combinada de películas, series y personas en un solo flujo.
 */
router.get("/multi", limitarSpikesIP, manejadorAsincrono(getMultiSearch))

/**
 * Endpoint de diagnóstico para validar pesos de ranking.
 */
router.get("/debug", limitarSpikesIP, manejadorAsincrono(getSearchDebug))

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: BÚSQUEDA POR CATEGORÍA
 * ---------------------------------------------------------------------------
 */

/**
 * Búsqueda específica de películas.
 */
router.get("/movie", limitarSpikesIP, manejadorAsincrono(getMovieSearch))

/**
 * Listado de géneros disponibles en TMDB.
 */
router.get("/genres/movie", limitarSpikesIP, manejadorAsincrono(getMovieGenres))

/**
 * Búsqueda de personas (Directores, Actores).
 */
router.get("/person", limitarSpikesIP, manejadorAsincrono(getPersonSearch))

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: SERIES DE TELEVISIÓN
 * ---------------------------------------------------------------------------
 */

/**
 * Búsqueda específica de series de TV.
 */
router.get("/tv", limitarSpikesIP, manejadorAsincrono(getTVSearch))

/**
 * Detalle profundo de una serie de TV por ID.
 */
router.get("/tv/:id", limitarSpikesIP, manejadorAsincrono(getTVDetail))

export default router
