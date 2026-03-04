import { reviewsRepository } from "../repositories/ReviewsRepository.js"
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../errors/AppErrors.js"
import type {
  CrearResenaDTO,
  ActualizarResenaDTO,
  ReportarResenaDTO,
  CrearComentarioDTO,
  ActualizarComentarioDTO,
} from "../schemas/reviews.js"

/* ==========================================================================
   REVIEWS SERVICE
   --------------------------------------------------------------------------
   Contiene TODA la lógica de negocio de reseñas, likes, comentarios y
   reportes. Los controladores solo llaman estas funciones y devuelven res.
   Si algo falla, se lanza un AppError que el manejadorErrores captura.
   ========================================================================== */

// ---------------------------------------------------------------------------
// RESEÑAS
// ---------------------------------------------------------------------------

export const obtenerResenasPorUsuarioService = (userId: number) =>
  reviewsRepository.findByUserId(userId)

export const obtenerResenasPorPeliculaService = (movieId: number) =>
  reviewsRepository.findByMovieId(movieId)

export const crearResenaService = (userId: number, data: CrearResenaDTO) =>
  reviewsRepository.create(userId, data)

export const actualizarResenaService = async (
  userId: number,
  reviewId: number,
  data: ActualizarResenaDTO
) => {
  const resena = await reviewsRepository.findById(reviewId)
  if (!resena) throw new NotFoundError("Reseña no encontrada")
  if (resena.user_id !== userId)
    throw new ForbiddenError("No tienes permiso para editar esta reseña")
  return reviewsRepository.update(reviewId, data)
}

export const eliminarResenaService = async (
  userId: number,
  reviewId: number
) => {
  const resena = await reviewsRepository.findById(reviewId)
  if (!resena) throw new NotFoundError("Reseña no encontrada")
  if (resena.user_id !== userId)
    throw new ForbiddenError("No tienes permiso para eliminar esta reseña")
  await reviewsRepository.delete(reviewId)
}

export const reportarResenaService = async (
  userId: number,
  reviewId: number,
  data: ReportarResenaDTO
) => {
  const resena = await reviewsRepository.findById(reviewId)
  if (!resena) throw new NotFoundError("Reseña no encontrada")
  return reviewsRepository.createReport(userId, reviewId, data.reason)
}

// ---------------------------------------------------------------------------
// LIKES
// ---------------------------------------------------------------------------

export const darLikeResenaService = async (
  userId: number,
  reviewId: number
) => {
  const likeExistente = await reviewsRepository.findLike(userId, reviewId)
  if (likeExistente)
    throw new ConflictError("Ya has dado like a esta reseña")

  const { like, review } = await reviewsRepository.addLikeTransaction(
    userId,
    reviewId
  )
  return { like, review }
}

export const quitarLikeResenaService = async (
  userId: number,
  reviewId: number
) => {
  const likeExistente = await reviewsRepository.findLike(userId, reviewId)
  if (!likeExistente)
    throw new NotFoundError("No has dado like a esta reseña")

  return reviewsRepository.removeLikeTransaction(userId, reviewId)
}

// ---------------------------------------------------------------------------
// COMENTARIOS
// ---------------------------------------------------------------------------

export const obtenerComentariosService = (reviewId: number) =>
  reviewsRepository.findCommentsByReviewId(reviewId)

export const crearComentarioService = async (
  userId: number,
  reviewId: number,
  data: CrearComentarioDTO
) => {
  const resena = await reviewsRepository.findById(reviewId)
  if (!resena) throw new NotFoundError("Reseña no encontrada")
  const comentario = await reviewsRepository.createComment(
    reviewId,
    userId,
    data.content
  )
  // Devolvemos la review (para que el caller pueda emitir notificación)
  return { comentario, review: resena }
}

export const actualizarComentarioService = async (
  userId: number,
  commentId: number,
  data: ActualizarComentarioDTO
) => {
  const comentario = await reviewsRepository.findCommentById(commentId)
  if (!comentario) throw new NotFoundError("Comentario no encontrado")
  if (comentario.user_id !== userId)
    throw new ForbiddenError("No tienes permiso para editar este comentario")
  return reviewsRepository.updateComment(commentId, data.content)
}

export const eliminarComentarioService = async (
  userId: number,
  commentId: number
) => {
  const comentario = await reviewsRepository.findCommentById(commentId)
  if (!comentario) throw new NotFoundError("Comentario no encontrado")
  if (comentario.user_id !== userId)
    throw new ForbiddenError("No tienes permiso para eliminar este comentario")
  await reviewsRepository.deleteComment(commentId)
}
