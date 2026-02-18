import { Router } from "express"
import {
  getWatchlistByUser,
  addMovieToWatchlist,
  removeMovieFromWatchlist,
} from "../controllers/WatchlistController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * Aplicamos manejadorAsincrono a cada ruta para que cualquier error en el controlador
 * sea capturado por el middleware global automáticamente.
 */
router.get("/:id_user", manejadorAsincrono(getWatchlistByUser))
router.post(
  "/add/:movieId",
  middlewareAutenticacion,
  manejadorAsincrono(addMovieToWatchlist)
)
router.delete(
  "/remove/:movieId",
  middlewareAutenticacion,
  manejadorAsincrono(removeMovieFromWatchlist)
)

export default router
