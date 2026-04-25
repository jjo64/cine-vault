/**
 * @file seo.routes.ts
 * @description Rutas para la gestión de SEO y visibilidad en motores de búsqueda.
 * Responsable de entregar dinámicamente el Sitemap XML y el archivo Robots.txt.
 * Incluye lógica de redirección para normalizar URLs de películas con slugs.
 *
 * @note Las peticiones son delegadas a SeoController tras la estandarización en Fase 5.
 */

import { Router } from "express"
import {
  getRobots,
  getSitemap,
  getSitemapByCategory,
  redirectMovieToSlug,
} from "../controllers/SeoController.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GENERACIÓN DE SITEMAPS
 * ---------------------------------------------------------------------------
 */

/**
 * Sitemap principal e índice de sitemaps segmentados.
 */
router.get("/sitemap.xml", manejadorAsincrono(getSitemap))

/**
 * Sitemaps específicos por categoría (pages, movies, profiles, news).
 */
router.get("/sitemaps/:type.xml", manejadorAsincrono(getSitemapByCategory))

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: CONFIGURACIÓN ROBOTS Y REDIRECCIONES
 * ---------------------------------------------------------------------------
 */

/**
 * Entrega del archivo robots.txt estandarizado.
 */
router.get("/robots.txt", manejadorAsincrono(getRobots))

/**
 * Normalización de URLs de películas (Redirección 301).
 * Soporta formatos legacy para asegurar la migración SEO fluida.
 */
router.get(["/film/:id", "/movie/:id"], manejadorAsincrono(redirectMovieToSlug))

export default router
