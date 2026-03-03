import {
  getReviews,
  addReview,
  removeReview,
  getReviewsByMovieId,
  removeLikeReview,
  likeReview,
  getReviewsByUserId,
  updateReview,
  reportReview,
} from "../controllers/ReviewsController.js"
import { Router } from "express"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

const router = Router()

// Rutas públicas
router.get("/", middlewareAutenticacion, manejadorAsincrono(getReviews)) // Obtener todas mis reseñas
router.get("/user/:userId", manejadorAsincrono(getReviewsByUserId)) // Obtener las reseñas de un usuario
router.get("/movie/:movieId", manejadorAsincrono(getReviewsByMovieId)) // Obtener las reseñas de una pelicula

// Reseñas (privadas)
router.post("/", middlewareAutenticacion, manejadorAsincrono(addReview)) // Crear una review
router.patch("/:reviewId", middlewareAutenticacion, manejadorAsincrono(updateReview)) // Actualizar una review
router.delete("/:reviewId", middlewareAutenticacion, manejadorAsincrono(removeReview)) // Eliminar una review

// Likes (privadas)
router.post("/:reviewId/like", middlewareAutenticacion, manejadorAsincrono(likeReview)) // Dar like a una review
router.delete("/:reviewId/like", middlewareAutenticacion, manejadorAsincrono(removeLikeReview)) // Quitar like a una review

// Reportes (privadas)
router.post("/:reviewId/report", middlewareAutenticacion, manejadorAsincrono(reportReview)) // Reportar una review

// Comentarios (privados) — cuando los implementes
// router.post("/:reviewId/comment", middlewareAutenticacion, manejadorAsincrono(addComment))
// router.delete("/:reviewId/comment/:commentId", middlewareAutenticacion, manejadorAsincrono(removeComment))
export default router
