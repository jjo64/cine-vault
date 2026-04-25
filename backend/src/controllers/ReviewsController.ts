/**
 * @file ReviewsController.ts
 * @description Controlador para el ecosistema de Críticas y Valoraciones de CineVault.
 * Gestiona el ciclo de vida de las reseñas de películas, incluyendo la creación,
 * edición, borrado, interacciones sociales (likes) y reportes de moderación.
 */

import { Request, Response } from "express"
import type { z } from "zod"
import type {
  movieIdParamsSchema,
  reviewIdParamsSchema,
  userIdParamsSchema,
  usernameMovieSlugParamsSchema,
} from "../schemas/reviews.js"
import * as reviewsService from "../services/reviews.services.js"

type ReviewIdParams = z.infer<typeof reviewIdParamsSchema>
type UserIdParams = z.infer<typeof userIdParamsSchema>
type MovieIdParams = z.infer<typeof movieIdParamsSchema>
type UsernameMovieSlugParams = z.infer<typeof usernameMovieSlugParamsSchema>

/**
 * Recupera el listado de reseñas publicadas por el usuario actualmente autenticado.
 */
export const getReviews = async (req: Request, res: Response) => {
  const resenas = await reviewsService.obtenerResenasPorUsuarioService(
    req.user!.user_id
  )
  res.json(resenas)
}

/**
 * Obtiene el catálogo de reseñas de un usuario específico identificado por su ID.
 */
export const getReviewsByUserId = async (req: Request, res: Response) => {
  const { userId } = req.params as unknown as UserIdParams
  const resenas = await reviewsService.obtenerResenasPorUsuarioService(userId)
  res.json(resenas)
}

/**
 * Registra una nueva crítica cinematográfica en el sistema.
 */
export const addReview = async (req: Request, res: Response) => {
  const resena = await reviewsService.crearResenaService(
    req.user!.user_id,
    req.body
  )
  res.status(201).json(resena)
}

/**
 * Elimina de forma permanente una reseña del usuario autenticado.
 */
export const removeReview = async (req: Request, res: Response) => {
  const { reviewId } = req.params as unknown as ReviewIdParams
  await reviewsService.eliminarResenaService(req.user!.user_id, reviewId)
  res.json({ message: "La reseña ha sido eliminada con éxito" })
}

/**
 * Consulta todas las reseñas y críticas asociadas a una película específica.
 */
export const getReviewsByMovieId = async (req: Request, res: Response) => {
  const { movieId } = req.params as unknown as MovieIdParams
  const resenas = await reviewsService.obtenerResenasPorPeliculaService(movieId)
  res.json(resenas)
}

/**
 * Recupera una reseña detallada mediante la ruta semántica (slug).
 */
export const getReviewByUsernameAndMovieSlug = async (
  req: Request,
  res: Response
) => {
  const { username, movieSlug } =
    req.params as unknown as UsernameMovieSlugParams
  const review = await reviewsService.obtenerResenaPorUsernameYMovieSlugService(
    username,
    movieSlug
  )
  res.json(review)
}

/**
 * Registra una reacción positiva ("Like") en una reseña de otro usuario.
 */
export const likeReview = async (req: Request, res: Response) => {
  const userId = req.user!.user_id
  const { reviewId } = req.params as unknown as ReviewIdParams

  const { like, review } = await reviewsService.darLikeResenaService(
    userId,
    reviewId
  )

  res.status(201).json({ review, like })
}

/**
 * Retira la reacción de "Like" de una reseña previamente marcada.
 */
export const removeLikeReview = async (req: Request, res: Response) => {
  const { reviewId } = req.params as unknown as ReviewIdParams
  const { like, review } = await reviewsService.quitarLikeResenaService(
    req.user!.user_id,
    reviewId
  )
  res.json({ review, like })
}

/**
 * Actualiza el contenido, nota o modo (estándar/crítico) de una reseña existente.
 */
export const updateReview = async (req: Request, res: Response) => {
  const { reviewId } = req.params as unknown as ReviewIdParams
  const resena = await reviewsService.actualizarResenaService(
    req.user!.user_id,
    reviewId,
    req.body
  )
  res.json(resena)
}

/**
 * Denuncia una reseña por contenido inapropiado para su revisión por moderadores.
 */
export const reportReview = async (req: Request, res: Response) => {
  const { reviewId } = req.params as unknown as ReviewIdParams
  const reporte = await reviewsService.reportarResenaService(
    req.user!.user_id,
    reviewId,
    req.body
  )
  res.json(reporte)
}
