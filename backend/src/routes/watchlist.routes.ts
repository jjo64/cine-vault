import { Router } from "express"
import {
  getWatchlistByUser,
  addMovieToWatchlist,
  removeMovieFromWatchlist,
  getMyWatchlist,
} from "../controllers/WatchlistController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * Aplicamos manejadorAsincrono a cada ruta para que cualquier error en el controlador
 * sea capturado por el middleware global automáticamente.
 */
router.get("/", middlewareAutenticacion, manejadorAsincrono(getMyWatchlist)) // obtener la watchlist del usuario
router.get("/:id_user", manejadorAsincrono(getWatchlistByUser)) // obtener la watchlist de otro usuario
router.post(
  "/",
  middlewareAutenticacion,
  manejadorAsincrono(addMovieToWatchlist)
) // añadir película a la watchlist
router.delete(
  "/:movie_id",
  middlewareAutenticacion,
  manejadorAsincrono(removeMovieFromWatchlist)
) // eliminar película de la watchlist

export default router
