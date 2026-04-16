/**
 * @file favorities.routes.ts
 * @description Gestión de la lista de Películas Favoritas (Top 4).
 * Permite a los usuarios destacar sus títulos predilectos en su perfil público,
 * gestionando posiciones de ranking y visibilidad social.
 */

import { Router } from "express"
import {
  addMovieToFavorites,
  getFavorites,
  getFavoritesByUserId,
  removeMovieFromFavorites,
} from "../controllers/FavoritiesController.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { validarParams } from "../middlewares/validation.middleware.js"
import {
  movieIdParamsFavSchema,
  userIdParamsFavSchema,
} from "../schemas/favorites.js"

/**
 * @swagger
 * tags:
 *   name: Favoritos
 *   description: Selección personal de títulos destacados
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: CONSULTA DE FAVORITOS
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Recuperar mi lista personal de películas favoritas
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", middlewareAutenticacion, manejadorAsincrono(getFavorites))

/**
 * @swagger
 * /favorites/user/{userId}:
 *   get:
 *     summary: Consultar los favoritos de un usuario específico
 *     tags: [Favoritos]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 */
router.get(
  "/user/:userId",
  validarParams(userIdParamsFavSchema),
  manejadorAsincrono(getFavoritesByUserId)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GESTIÓN DE FAVORITOS
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /favorites/{movieId}:
 *   post:
 *     summary: Añadir una película al ranking de favoritos
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:movieId",
  middlewareAutenticacion,
  validarParams(movieIdParamsFavSchema),
  manejadorAsincrono(addMovieToFavorites)
)

/**
 * @swagger
 * /favorites/{movieId}:
 *   delete:
 *     summary: Eliminar una película de la selección de favoritos
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:movieId",
  middlewareAutenticacion,
  validarParams(movieIdParamsFavSchema),
  manejadorAsincrono(removeMovieFromFavorites)
)

export default router
