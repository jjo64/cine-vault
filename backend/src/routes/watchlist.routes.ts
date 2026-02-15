import { Router } from "express"
import { getWatchlistByUser, addMovieToWatchlist, removeMovieFromWatchlist } from "../controllers/WatchlistController.js"
import { authMiddleware } from "../middlewares/auth.middlewares.js"
import { asyncHandler } from "../middlewares/error.middlewares.js"

const router = Router()

/**
 * Aplicamos asyncHandler a cada ruta para que cualquier error en el controlador
 * sea capturado por el middleware global automáticamente.
 */
router.get('/:id_user', asyncHandler(getWatchlistByUser))
router.post('/add/:movieId', authMiddleware, asyncHandler(addMovieToWatchlist))
router.delete('/remove/:movieId', authMiddleware, asyncHandler(removeMovieFromWatchlist))

export default router