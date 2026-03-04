import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import type { SolicitudAutenticada } from "../middlewares/auth.middlewares.js"

/**
 * Obtiene todas las reseñas de mi usuario.
 */
export const getReviews = async (req: Request, res: Response) => {
  const user_id = req.user!.user_id
  const reviews = await prisma.reviews.findMany({
    where: {
      user_id: user_id,
    },
    select: {
      user_id: true,
      movie_id: true,
      content: true,
      rating: true,
      likes: true,
      created_at: true,
    },
    orderBy: {
      created_at: "desc",
    },
  })
  res.status(200).json(reviews)
}

export const getReviewsByUserId = async (req: Request, res: Response) => {
  const user_id = Number(req.params.userId)
  const reviews = await prisma.reviews.findMany({
    where: {
      user_id: user_id,
    },
    select: {
      user_id: true,
      movie_id: true,
      content: true,
      rating: true,
      likes: true,
      created_at: true,
    },
    orderBy: {
      created_at: "desc",
    },
  })
  res.status(200).json(reviews)
}

/**
 * Agrega una nueva reseña.
 */
export const addReview = async (req: SolicitudAutenticada, res: Response) => {
  const user_id = req.user!.user_id
  const review = await prisma.reviews.create({
    data: {
      user_id: user_id,
      movie_id: Number(req.body.movie_id),
      content: req.body.content,
      rating: Number(req.body.rating),
    },
  })
  res.status(201).json(review)
}

/**
 * Elimina una reseña existente.
 */
export const removeReview = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const user_id = req.user!.user_id
  const review_id = Number(req.params.reviewId)

  const review_found = await prisma.reviews.findUnique({
    where: {
      id: review_id,
    },
  })

  if (!review_found) {
    return res.status(404).json({ message: "Reseña no encontrada" })
  }

  if (review_found.user_id !== user_id) {
    return res
      .status(403)
      .json({ message: "No tienes permiso para eliminar esta reseña" })
  }

  const review = await prisma.reviews.delete({
    where: {
      id: Number(req.params.reviewId),
    },
  })
  res.status(200).json({ message: "Reseña eliminada correctamente" })
}

/**
 * Obtiene todas las reseñas de una película específica.
 */
export const getReviewsByMovieId = async (req: Request, res: Response) => {
  const movie_id = Number(req.params.movieId)
  const reviews = await prisma.reviews.findMany({
    where: {
      movie_id: movie_id,
    },
    select: {
      user_id: true,
      movie_id: true,
      content: true,
      rating: true,
      likes: true,
      created_at: true,
    },
    orderBy: {
      created_at: "desc",
    },
  })
  res.status(200).json(reviews)
}

/**
 * Incrementa el contador de "likes" de una reseña.
 */
export const likeReview = async (req: SolicitudAutenticada, res: Response) => {
  const user_id = req.user!.user_id
  const review_id = Number(req.params.reviewId)

  const existingLike = await prisma.review_likes.findUnique({
    where: {
      user_id_review_id: {
        user_id: user_id,
        review_id: review_id,
      },
    },
  })

  if (existingLike) {
    return res.status(400).json({ message: "Ya has dado like a esta reseña" })
  }

  // Usar transacción para que ambas operaciones sean atómicas
  const [like, review] = await prisma.$transaction([
    prisma.review_likes.create({
      data: { user_id, review_id },
    }),
    prisma.reviews.update({
      where: { id: review_id },
      data: { likes: { increment: 1 } },
    }),
  ])

  res.status(201).json({ review, like })
}

/**
 * Decrementa el contador de "likes" de una reseña.
 */
export const removeLikeReview = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const user_id = req.user!.user_id
  const review_id = Number(req.params.reviewId)

  const existingLike = await prisma.review_likes.findUnique({
    where: {
      user_id_review_id: {
        user_id: user_id,
        review_id: review_id,
      },
    },
  })

  if (!existingLike) {
    return res.status(400).json({ message: "No has dado like a esta reseña" })
  }

  // Usar transacción para que ambas operaciones sean atómicas
  const [like, review] = await prisma.$transaction([
    prisma.review_likes.delete({
      where: {
        user_id_review_id: {
          user_id: user_id,
          review_id: review_id,
        },
      },
    }),
    prisma.reviews.update({
      where: { id: review_id },
      data: { likes: { decrement: 1 } },
    }),
  ])

  res.status(200).json({ review, like })
}

export const updateReview = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const user_id = req.user!.user_id
  const review_id = Number(req.params.reviewId)

  const existingReview = await prisma.reviews.findUnique({
    where: {
      id: review_id,
    },
  })

  if (!existingReview) {
    return res.status(404).json({ message: "Reseña no encontrada" })
  }

  if (existingReview.user_id !== user_id) {
    return res
      .status(403)
      .json({ message: "No tienes permiso para editar esta reseña" })
  }

  const review = await prisma.reviews.update({
    where: {
      id: review_id,
    },
    data: {
      content: req.body.content,
      rating: Number(req.body.rating),
    },
  })

  res.status(200).json(review)
}

export const reportReview = async (
  req: SolicitudAutenticada,
  res: Response
) => {
  const user_id = req.user!.user_id
  const review_id = Number(req.params.reviewId)
  const reason = req.body.reason

  const existingReview = await prisma.reviews.findUnique({
    where: {
      id: review_id,
    },
  })

  if (!existingReview) {
    return res.status(404).json({ message: "Reseña no encontrada" })
  }

  const report = await prisma.reports.create({
    data: {
      reporter_id: user_id,
      review_id: review_id,
      reason: reason,
      status: "pending",
    },
  })

  res.status(200).json(report)
}
