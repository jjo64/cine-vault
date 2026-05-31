/**
 * @file ReviewCommentsController.ts
 * @description Controlador para la gestión de hilos de comentarios en las reseñas.
 * Facilita la interacción social permitiendo a los usuarios debatir sobre críticas de cine.
 * Implementa medidas de seguridad como control de flujo (rate limiting).
 */

import { Request, Response } from "express"
import { TooManyRequestsError } from "../errors/AppErrors.js"
import type { SolicitudAutenticada } from "../middlewares/auth.middlewares.js"
import {
  commentIdParamsSchema,
  reviewIdParamsSchema,
} from "../schemas/reviews.js"
import { checkIPSpike } from "../services/security.services.js"
import * as reviewsService from "../services/reviews.services.js"
import type { z } from "zod"

type ReviewIdParams = z.infer<typeof reviewIdParamsSchema>
type CommentIdParams = z.infer<typeof commentIdParamsSchema>

/**
 * Obtiene todos los comentarios asociados a una reseña específica.
 */
export const getCommentsByReviewId = async (req: Request, res: Response) => {
  const { reviewId } = req.params as unknown as ReviewIdParams
  const comentarios = await reviewsService.obtenerComentariosService(reviewId)
  res.json(comentarios)
}

/**
 * Publica un nuevo comentario en una reseña.
 * Emite automáticamente una notificación al autor de la reseña.
 */
export const addComment = async (req: SolicitudAutenticada, res: Response) => {
  await assertNotRateLimited(req.ip!)
  const userId = req.user!.user_id
  const { reviewId } = req.params as unknown as ReviewIdParams

  const { comentario } = await reviewsService.crearComentarioService(
    userId,
    reviewId,
    req.body
  )

  res.status(201).json(comentario)
}

/**
 * Elimina de forma permanente un comentario del sistema.
 * Solo permitido para el autor del comentario.
 */
export const removeComment = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  await assertNotRateLimited(req.ip!)
  const { commentId } = req.params as unknown as CommentIdParams
  await reviewsService.eliminarComentarioService(req.user!.user_id, commentId)
  res.json({ message: "Comentario eliminado correctamente" })
}

/**
 * Actualiza el contenido de un comentario existente.
 */
export const updateComment = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  await assertNotRateLimited(req.ip!)
  const { commentId } = req.params as unknown as CommentIdParams
  const comentario = await reviewsService.actualizarComentarioService(
    req.user!.user_id,
    commentId,
    req.body
  )
  res.json(comentario)
}

/**
 * Verifica si la IP del solicitante ha excedido el límite de acciones rápidas permitidas (Anti-spam).
 */
const assertNotRateLimited = async (ip: string) => {
  if (await checkIPSpike(ip)) {
    throw new TooManyRequestsError(
      "Ha excedido el límite de velocidad. Por favor, espere unos segundos antes de intentar de nuevo."
    )
  }
}
