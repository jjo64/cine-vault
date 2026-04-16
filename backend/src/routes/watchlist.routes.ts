/**
 * @file watchlist.routes.ts
 * @description Gestión de la lista de películas "Para ver" (Watchlist).
 * Permite a los usuarios organizar su cola de visionado personal,
 * añadiendo títulos que desean ver en el futuro y consultando los de otros usuarios.
 */

import { Router } from "express"
import {
  addMovieToWatchlist,
  getMyWatchlist,
  getWatchlistByUser,
  removeMovieFromWatchlist,
} from "../controllers/WatchlistController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  validarBody,
  validarParams,
} from "../middlewares/validation.middleware.js"
import {
  agregarWatchlistSchema,
  eliminarWatchlistSchema,
} from "../schemas/watchlist.js"

/**
 * @swagger
 * tags:
 *   name: Watchlist
 *   description: Organización de visionados pendientes
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: LECTURA DE WATCHLIST
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /watchlist:
 *   get:
 *     summary: Recuperar la watchlist personal del usuario autenticado
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", middlewareAutenticacion, manejadorAsincrono(getMyWatchlist))

/**
 * @swagger
 * /watchlist/{id_user}:
 *   get:
 *     summary: Consultar la watchlist pública de otro usuario
 *     tags: [Watchlist]
 *     parameters:
 *       - in: path
 *         name: id_user
 *         required: true
 *         schema:
 *           type: integer
 */
router.get("/:id_user", manejadorAsincrono(getWatchlistByUser))

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GESTIÓN DE TÍTULOS (Alta/Baja)
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /watchlist:
 *   post:
 *     summary: Añadir una película a la lista de "Para ver"
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  middlewareAutenticacion,
  validarBody(agregarWatchlistSchema),
  manejadorAsincrono(addMovieToWatchlist)
)

/**
 * @swagger
 * /watchlist/{movie_id}:
 *   delete:
 *     summary: Eliminar una película de la watchlist
 *     tags: [Watchlist]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:movie_id",
  middlewareAutenticacion,
  validarParams(eliminarWatchlistSchema),
  manejadorAsincrono(removeMovieFromWatchlist)
)

export default router
