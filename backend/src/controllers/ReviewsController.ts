import { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

/**
 * Obtiene todas las reseñas del feed global.
 */
export const getReviews = async (req: Request, res: Response) => {
    const reviews = await prisma.reviews.findMany({
        select: {
            user_id: true,
            movie_id: true,
            content: true,
            rating: true,
            likes: true,
        },
        orderBy: {
            created_at: 'desc',
        },
    })
    res.status(200).json(reviews)
}

/**
 * Agrega una nueva reseña.
 */
export const addReview = async (req: Request, res: Response) => {
    const review = await prisma.reviews.create({
        data: req.body,
    })
    res.status(201).json(review)
}

/**
 * Elimina una reseña existente.
 */
export const removeReview = async (req: Request, res: Response) => {
    const review = await prisma.reviews.delete({
        where: {
            id: Number(req.params.reviewId),
        },
    })
    res.status(200).json(review)
}

/**
 * Obtiene todas las reseñas de una película específica.
 */
export const getReviewsByMovieId = async (req: Request, res: Response) => {
    const reviews = await prisma.reviews.findMany({
        where: {
            movie_id: Number(req.params.movieId),
        },
        select: {
            user_id: true,
            movie_id: true,
            content: true,
            rating: true,
            likes: true,
        },
    })
    res.status(200).json(reviews)
}

/**
 * Incrementa el contador de "likes" de una reseña.
 */
export const likeReview = async (req: Request, res: Response) => {
    const review = await prisma.reviews.update({
        where: {
            id: Number(req.params.reviewId),
        },
        data: {
            likes: {
                increment: 1,
            },
        },
    })
    res.status(200).json(review)
}

/**
 * Decrementa el contador de "likes" de una reseña.
 */
export const removeLikeReview = async (req: Request, res: Response) => {
    const review = await prisma.reviews.update({
        where: {
            id: Number(req.params.reviewId),
        },
        data: {
            likes: {
                decrement: 1,
            },
        },
    })
    res.status(200).json(review)
}