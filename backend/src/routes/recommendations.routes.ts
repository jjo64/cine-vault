/**
 * @file recommendations.routes.ts
 * @description Motor de recomendaciones personalizadas de CineVault.
 * Utiliza el historial del Vault, Diario y Reseñas del usuario para sugerir
 * nuevos títulos y directores afines mediante integración con la API de TMDB.
 *
 * @note Las peticiones son delegadas a RecommendationController tras la refactorización en Fase 5.
 */

import { Router } from "express"
import {
  getForYou,
  getSuggestedDirectors,
  getTonight,
  checkStatus,
  getOnboarding,
  postInteraction,
} from "../controllers/RecommendationController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: ONBOARDING & PERFILADO
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /recommendations/onboarding/status:
 *   get:
 *     summary: Verifica si el usuario necesita pasar por el onboarding
 *     tags: [Recomendaciones]
 */
router.get(
  "/onboarding/status",
  middlewareAutenticacion,
  manejadorAsincrono(checkStatus)
)

/**
 * @swagger
 * /recommendations/onboarding:
 *   get:
 *     summary: Obtiene películas para el onboarding
 *     tags: [Recomendaciones]
 */
router.get(
  "/onboarding",
  middlewareAutenticacion,
  manejadorAsincrono(getOnboarding)
)

/**
 * @swagger
 * /recommendations/interact:
 *   post:
 *     summary: Registra una interacción explícita
 *     tags: [Recomendaciones]
 */
router.post(
  "/interact",
  middlewareAutenticacion,
  manejadorAsincrono(postInteraction)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: RECOMENDACIONES DE CONTENIDO
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /recommendations/tonight:
 *   get:
 *     summary: Sugiere la película perfecta y única para la noche
 *     tags: [Recomendaciones]
 *     security:
 *       - bearerAuth: []
 */
router.get("/tonight", middlewareAutenticacion, manejadorAsincrono(getTonight))

/**
 * @swagger
 * /recommendations/for-you:
 *   get:
 *     summary: Obtener flujo personalizado de películas y reseñas sugeridas
 *     tags: [Recomendaciones]
 *     security:
 *       - bearerAuth: []
 */
router.get("/for-you", middlewareAutenticacion, manejadorAsincrono(getForYou))

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
