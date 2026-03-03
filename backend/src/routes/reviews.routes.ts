import {
  getReviews,
  addReview,
  removeReview,
  getReviewsByMovieId,
  removeLikeReview,
  likeReview,
} from "../controllers/ReviewsController.js"
import { Router } from "express"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

// Rutas públicas
router.get("/", manejadorAsincrono(getReviews))
router.get("/:movieId", manejadorAsincrono(getReviewsByMovieId))

// Reseñas (privadas)
router.post("/", middlewareAutenticacion, manejadorAsincrono(addReview))
router.delete(
  "/:reviewId",
  middlewareAutenticacion,
  manejadorAsincrono(removeReview)
)

// Likes (privadas)
router.post(
  "/:reviewId/like",
  middlewareAutenticacion,
  manejadorAsincrono(likeReview)
)
router.delete(
  "/:reviewId/like",
  middlewareAutenticacion,
  manejadorAsincrono(removeLikeReview)
)

// Comentarios (privados) — cuando los implementes
// router.post("/:reviewId/comment", middlewareAutenticacion, manejadorAsincrono(addComment))
// router.delete("/:reviewId/comment/:commentId", middlewareAutenticacion, manejadorAsincrono(removeComment))
export default router
