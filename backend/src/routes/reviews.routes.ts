import {
  getReviews,
  addReview,
  removeReview,
  getReviewsByMovieId,
  removeLikeReview,
  likeReview,
} from "../controllers/ReviewsController.js"
import { Router } from "express"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

// Rutas para las reseñas envueltas en manejadorAsincrono
router.get("/", manejadorAsincrono(getReviews))
router.get("/:movieId", manejadorAsincrono(getReviewsByMovieId))
router.post("/", manejadorAsincrono(addReview))
router.post("/:reviewId/like", manejadorAsincrono(likeReview))
router.delete("/:reviewId", manejadorAsincrono(removeReview))
router.delete("/:reviewId/like", manejadorAsincrono(removeLikeReview))

export default router
