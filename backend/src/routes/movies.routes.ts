/**
 * @file movies.routes.ts
 * @description Rutas para la consulta de información de películas.
 * Integra la API de TMDB con una capa de caché Redis para optimizar el rendimiento.
 * Gestiona el descubrimiento de estrenos, rankings y el detalle profundo de títulos.
 * 
 * @note Las peticiones son delegadas a MoviesController tras la refactorización en Fase 5.
 * @note Fase 6: Validación Final [x]
 */

import { Router } from "express"
import {
  getDetail,
  getPopular,
  getTopRated,
  getUpcoming,
  search,
} from "../controllers/MoviesController.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Películas
 *   description: Consulta de películas y metadatos desde TMDB
 */

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
router.get("/upcoming", manejadorAsincrono(getUpcoming))

/**
 * @swagger
 * /movies/top-rated:
 *   get:
 *     summary: Listar películas con mayor valoración de la historia
 *     tags: [Películas]
 */
router.get("/top-rated", manejadorAsincrono(getTopRated))

/**
 * @swagger
 * /movies/popular:
 *   get:
 *     summary: Consultar tendencias mundiales actuales
 *     tags: [Películas]
 */
router.get("/popular", manejadorAsincrono(getPopular))

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: BÚSQUEDA Y DETALLE
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /movies/search:
 *   get:
 *     summary: Motor de búsqueda optimizada por título
 *     tags: [Películas]
 */
router.get("/search", manejadorAsincrono(search))

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
router.get("/:idOrSlug", manejadorAsincrono(getDetail))

export default router
