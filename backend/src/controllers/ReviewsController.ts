import { Request, Response } from "express"
import * as reviewsService from "../services/reviews.services.js"
import { emitirNotificacionService } from "../services/notifications.services.js"
import type { SolicitudAutenticada } from "../middlewares/auth.middlewares.js"
import { checkIPSpike } from "../services/security.services.js"
import { TooManyRequestsError } from "../errors/AppErrors.js"
import type { z } from "zod"
import type {
  reviewIdParamsSchema,
  userIdParamsSchema,
  movieIdParamsSchema,
  usernameMovieSlugParamsSchema,
} from "../schemas/reviews.js"

type ReviewIdParams = z.infer<typeof reviewIdParamsSchema>
type UserIdParams = z.infer<typeof userIdParamsSchema>
type MovieIdParams = z.infer<typeof movieIdParamsSchema>
type UsernameMovieSlugParams = z.infer<typeof usernameMovieSlugParamsSchema>

/* ==========================================================================
   CONTROLADOR DE RESEÑAS
   --------------------------------------------------------------------------
   Responsabilidad ÚNICA: extraer datos del request, llamar al servicio y
   devolver la respuesta HTTP. Sin lógica de negocio. Sin Prisma directo.
   ========================================================================== */

export const getReviews = async (req: Request, res: Response) => {
  const resenas = await reviewsService.obtenerResenasPorUsuarioService(
    req.user!.user_id
  )
  res.json(resenas)
}

export const getReviewsByUserId = async (req: Request, res: Response) => {
  const { userId } = req.params as unknown as UserIdParams
  const resenas = await reviewsService.obtenerResenasPorUsuarioService(userId)
  res.json(resenas)
}

export const addReview = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const resena = await reviewsService.crearResenaService(
    req.user!.user_id,
    req.body
  )
  res.status(201).json(resena)
}

export const removeReview = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const { reviewId } = req.params as unknown as ReviewIdParams
  await reviewsService.eliminarResenaService(req.user!.user_id, reviewId)
  res.json({ message: "Reseña eliminada correctamente" })
}

export const getReviewsByMovieId = async (req: Request, res: Response) => {
  const { movieId } = req.params as unknown as MovieIdParams
  const resenas = await reviewsService.obtenerResenasPorPeliculaService(movieId)
  res.json(resenas)
}

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

export const likeReview = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const userId = req.user!.user_id
  const { reviewId } = req.params as unknown as ReviewIdParams

  const { like, review } = await reviewsService.darLikeResenaService(
    userId,
    reviewId
  )

  if (review.user_id !== userId) {
    await emitirNotificacionService({
      user_id: review.user_id,
      sender_id: userId,
      type: "like",
    })
  }

  res.status(201).json({ review, like })
}

export const removeLikeReview = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  await assertNotRateLimited(req.ip!)
  const { reviewId } = req.params as unknown as ReviewIdParams
  const { like, review } = await reviewsService.quitarLikeResenaService(
    req.user!.user_id,
    reviewId
  )
  res.json({ review, like })
}

export const updateReview = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const { reviewId } = req.params as unknown as ReviewIdParams
  const resena = await reviewsService.actualizarResenaService(
    req.user!.user_id,
    reviewId,
    req.body
  )
  res.json(resena)
}

export const reportReview = async (req: Request, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const { reviewId } = req.params as unknown as ReviewIdParams
  const reporte = await reviewsService.reportarResenaService(
    req.user!.user_id,
    reviewId,
    req.body
  )
  res.json(reporte)
}

const assertNotRateLimited = async (ip: string) => {
  if (await checkIPSpike(ip)) {
    throw new TooManyRequestsError(
      "Demasiadas acciones, intenta en unos segundos"
    )
  }
}
