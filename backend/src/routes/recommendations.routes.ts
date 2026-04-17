/**
 * @file recommendations.routes.ts
 * @description Motor de recomendaciones personalizadas de CineVault.
 * Utiliza el historial del Vault, Diario y Reseñas del usuario para sugerir
 * nuevos títulos y directores afines mediante integración con la API de TMDB.
 * 
 * @note Las peticiones son delegadas a RecommendationController tras la refactorización en Fase 5.
 */

import { Router } from "express"
import { getForYou, getSuggestedDirectors } from "../controllers/RecommendationController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: RECOMENDACIONES DE CONTENIDO
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /recommendations/for-you:
 *   get:
 *     summary: Obtener flujo personalizado de películas y reseñas sugeridas
 *     tags: [Recomendaciones]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/for-you",
  middlewareAutenticacion,
  manejadorAsincrono(getForYou)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: DESCUBRIMIENTO DE AUTORES
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /recommendations/directors:
 *   get:
 *     summary: Sugerir directores basados en el contenido del Vault
 *     tags: [Recomendaciones]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/directors",
  middlewareAutenticacion,
  manejadorAsincrono(getSuggestedDirectors)
)

export default router
