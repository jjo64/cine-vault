import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import type { SolicitudAutenticada } from "../middlewares/auth.middlewares.js"
import { NotFoundError, ForbiddenError, ValidationError } from "../errors/AppErrors.js"
import { emitirNotificacion } from "./NotificationsController.js"

export const getCommentsByReviewId = async (req: Request, res: Response) => {
  const review_id = Number(req.params.reviewId)

  const comments = await prisma.review_comments.findMany({
    where: { review_id },
    include: {
      users: {
        select: { id: true, username: true, avatar_url: true },
      },
    },
    orderBy: { created_at: "asc" },
  })

  res.json(comments)
}

export const addComment = async (req: SolicitudAutenticada, res: Response) => {
  const user_id = req.user!.user_id
  const review_id = Number(req.params.reviewId)
  const { content } = req.body

  if (!content || content.trim() === "") {
    throw new ValidationError("El comentario no puede estar vacío")
  }

  const review = await prisma.reviews.findUnique({ where: { id: review_id } })
  if (!review) throw new NotFoundError("Reseña no encontrada")

  const comment = await prisma.review_comments.create({
    data: { review_id, user_id, content: content.trim() },
    include: {
      users: {
        select: { id: true, username: true, avatar_url: true },
      },
    },
  })

  // Notificar al dueño de la reseña si no es el mismo usuario
  if (review.user_id !== user_id) {
    await emitirNotificacion({
      user_id: review.user_id,
      sender_id: user_id,
      type: "comment",
    })
  }

  res.status(201).json(comment)
}

export const removeComment = async (req: SolicitudAutenticada, res: Response) => {
  const user_id = req.user!.user_id
  const comment_id = Number(req.params.commentId)

  const comment = await prisma.review_comments.findUnique({
    where: { id: comment_id },
  })

  if (!comment) throw new NotFoundError("Comentario no encontrado")
  if (comment.user_id !== user_id) throw new ForbiddenError("No tienes permiso para eliminar este comentario")

  await prisma.review_comments.delete({ where: { id: comment_id } })

  res.json({ message: "Comentario eliminado correctamente" })
}

export const updateComment = async (req: SolicitudAutenticada, res: Response) => {
  const user_id = req.user!.user_id
  const comment_id = Number(req.params.commentId)
  const { content } = req.body

  if (!content || content.trim() === "") {
    throw new ValidationError("El comentario no puede estar vacío")
  }

  const comment = await prisma.review_comments.findUnique({
    where: { id: comment_id },
  })

  if (!comment) throw new NotFoundError("Comentario no encontrado")
  if (comment.user_id !== user_id) throw new ForbiddenError("No tienes permiso para editar este comentario")

  const updated = await prisma.review_comments.update({
    where: { id: comment_id },
    data: { content: content.trim() },
    include: {
      users: {
        select: { id: true, username: true, avatar_url: true },
      },
    },
  })

  res.json(updated)
}