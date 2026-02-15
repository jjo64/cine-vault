import { Router } from "express"
import { getFavorites, addMovieToFavorites, removeMovieFromFavorites } from "../controllers/FavoritiesController.js"

const router = Router()

router.get('/', getFavorites)
router.post('/:movieId', addMovieToFavorites)
router.delete('/:movieId', removeMovieFromFavorites)

export default router