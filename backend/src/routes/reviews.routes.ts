import { getReviews, addReview, removeReview, getReviewsByMovieId, removeLikeReview, likeReview } from "../controllers/ReviewsController.js"
import { Router } from "express"
import { asyncHandler } from "../middlewares/error.middlewares.js"

const router = Router()

// Rutas para las reviews
// Rutas para las reviews envueltas en asyncHandler
router.get('/', asyncHandler(getReviews))
router.get('/:movieId', asyncHandler(getReviewsByMovieId))
router.post('/', asyncHandler(addReview))
router.post('/:reviewId/like', asyncHandler(likeReview))
router.delete('/:reviewId', asyncHandler(removeReview))
router.delete('/:reviewId/like', asyncHandler(removeLikeReview))

export default router