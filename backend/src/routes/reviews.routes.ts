/**
 * @file reviews.routes.ts
 * @description Motor de gestión de críticas y comentarios.
 * Permite a los usuarios publicar reseñas sobre películas, interactuar con ellas
 * mediante likes y comentarios, y reportar contenido inapropiado.
 * Es uno de los componentes más extensos del sistema social de CineVault.
 */

import { Router } from "express"
import {
  addComment,
  getCommentsByReviewId,
  removeComment,
  updateComment,
} from "../controllers/ReviewCommentsController.js"
import {
  addReview,
  getReviewByUsernameAndMovieSlug,
  getReviews,
  getReviewsByMovieId,
  getReviewsByUserId,
  likeReview,
  removeLikeReview,
  removeReview,
  reportReview,
  updateReview,
} from "../controllers/ReviewsController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { limitarSpikesIP } from "../middlewares/rateLimit.middleware.js"
import {
  validarBody,
  validarParams,
} from "../middlewares/validation.middleware.js"
import {
  actualizarComentarioSchema,
  actualizarResenaSchema,
  commentIdParamsSchema,
  commentParamsSchema,
  crearComentarioSchema,
  crearResenaSchema,
  movieIdParamsSchema,
  reportarResenaSchema,
  reviewIdParamsSchema,
  userIdParamsSchema,
  usernameMovieSlugParamsSchema,
} from "../schemas/reviews.js"

/**
 * @swagger
 * tags:
 *   name: Reseñas
 *   description: Críticas cinematográficas y flujo de debate
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: CONSULTA DE RESEÑAS
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Obtener todas las reseñas del usuario autenticado
 *     tags: [Reseñas]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", middlewareAutenticacion, manejadorAsincrono(getReviews))

/**
 * @swagger
 * /reviews/user/{userId}:
 *   get:
 *     summary: Consultar las reseñas publicadas por un usuario específico
 *     tags: [Reseñas]
 */
router.get(
  "/user/:userId",
  validarParams(userIdParamsSchema),
  manejadorAsincrono(getReviewsByUserId)
)

/**
 * @swagger
 * /reviews/movie/{movieId}:
 *   get:
 *     summary: Listar todas las reseñas críticas de una película
 *     tags: [Reseñas]
 */
router.get(
  "/movie/:movieId",
  validarParams(movieIdParamsSchema),
  manejadorAsincrono(getReviewsByMovieId)
)

/**
 * Buscar una reseña específica mediante el slug de la película y el username.
 */
router.get(
  "/:username/:movieSlug",
  validarParams(usernameMovieSlugParamsSchema),
  manejadorAsincrono(getReviewByUsernameAndMovieSlug)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GESTIÓN DE CRÍTICAS (CRUD)
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Publicar una nueva crítica cinematográfica
 *     tags: [Reseñas]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  middlewareAutenticacion,
  limitarSpikesIP,
  validarBody(crearResenaSchema),
  manejadorAsincrono(addReview)
)

/**
 * @swagger
 * /reviews/{reviewId}:
 *   patch:
 *     summary: Editar el contenido o puntuación de una reseña existente
 *     tags: [Reseñas]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/:reviewId",
  middlewareAutenticacion,
  limitarSpikesIP,
  validarParams(reviewIdParamsSchema),
  validarBody(actualizarResenaSchema),
  manejadorAsincrono(updateReview)
)

/**
 * @swagger
 * /reviews/{reviewId}:
 *   delete:
 *     summary: Eliminar permanentemente una crítica
 *     tags: [Reseñas]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:reviewId",
  middlewareAutenticacion,
  limitarSpikesIP,
  validarParams(reviewIdParamsSchema),
  manejadorAsincrono(removeReview)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: INTERACCIÓN SOCIAL (Likes y Reportes)
 * ---------------------------------------------------------------------------
 */

/**
 * Añadir "Me gusta" a una crítica de otro usuario.
 */
router.post(
  "/:reviewId/like",
  middlewareAutenticacion,
  limitarSpikesIP,
  validarParams(reviewIdParamsSchema),
  manejadorAsincrono(likeReview)
)

/**
 * Retirar "Me gusta" de una crítica.
 */
router.delete(
  "/:reviewId/like",
  middlewareAutenticacion,
  limitarSpikesIP,
  validarParams(reviewIdParamsSchema),
  manejadorAsincrono(removeLikeReview)
)

/**
 * @swagger
 * /reviews/{reviewId}/report:
 *   post:
 *     summary: Denunciar una reseña por violar las normas de la comunidad
 *     tags: [Reseñas]
 */
router.post(
  "/:reviewId/report",
  middlewareAutenticacion,
  limitarSpikesIP,
  validarParams(reviewIdParamsSchema),
  validarBody(reportarResenaSchema),
  manejadorAsincrono(reportReview)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: SISTEMA DE COMENTARIOS
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /reviews/{reviewId}/comments:
 *   get:
 *     summary: Listar todos los comentarios de una reseña
 *     tags: [Reseñas]
 *   post:
 *     summary: Añadir un nuevo comentario al hilo de debate
 *     tags: [Reseñas]
 */
router.get(
  "/:reviewId/comments",
  validarParams(reviewIdParamsSchema),
  manejadorAsincrono(getCommentsByReviewId)
)

router.post(
  "/:reviewId/comments",
  middlewareAutenticacion,
  validarParams(reviewIdParamsSchema),
  validarBody(crearComentarioSchema),
  manejadorAsincrono(addComment)
)

/**
 * Editar un comentario propio.
 */
router.patch(
  "/:reviewId/comments/:commentId",
  middlewareAutenticacion,
  validarParams(commentParamsSchema),
  validarBody(actualizarComentarioSchema),
  manejadorAsincrono(updateComment)
)

/**
 * Eliminar un comentario propio.
 */
router.delete(
  "/:reviewId/comments/:commentId",
  middlewareAutenticacion,
  validarParams(commentParamsSchema),
  manejadorAsincrono(removeComment)
)

/**
 * Alias de compatibilidad para gestión de comentarios por ID único.
 */
router.put(
  "/comments/:commentId",
  middlewareAutenticacion,
  validarParams(commentIdParamsSchema),
  validarBody(actualizarComentarioSchema),
  manejadorAsincrono(updateComment)
)

router.delete(
  "/comments/:commentId",
  middlewareAutenticacion,
  validarParams(commentIdParamsSchema),
  manejadorAsincrono(removeComment)
)

export default router
