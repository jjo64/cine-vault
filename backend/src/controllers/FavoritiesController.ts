import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"

export const getFavorites = async (req: Request, res: Response) => {
  const userId = req.user!.user_id
  const favorites = await prisma.favorites.findMany({
    where: { user_id: userId },
    select: {
      movie_id: true,
      rank_position: true,
    },
  })

  if (favorites.length === 0) {
    return res.status(404).json({ error: "No tienes favoritos" })
  }

  return res.json(favorites)
}

export const getFavoritesByUserId = async (req: Request, res: Response) => {
  const { userId } = req.params
  const favorites = await prisma.favorites.findMany({
    where: { user_id: Number(userId) },
    select: {
      movie_id: true,
      rank_position: true,
    },
  })

  if (favorites.length === 0) {
    return res.status(404).json({ error: "Favoritos no encontrados" })
  }

  return res.json(favorites)
}

export const addMovieToFavorites = async (req: Request, res: Response) => {
  const userId = req.user!.user_id
  const { movieId, rank_position } = req.body

  const favorite = await prisma.favorites.create({
    data: {
      user_id: userId,
      movie_id: Number(movieId),
      rank_position: rank_position ?? null,
    },
  })

  return res.status(201).json(favorite)
}

export const removeMovieFromFavorites = async (req: Request, res: Response) => {
  const userId = req.user!.user_id
  const { movieId } = req.params

  const favorite = await prisma.favorites.findFirst({
    where: { user_id: userId, movie_id: Number(movieId) },
  })

  if (!favorite) {
    return res.status(404).json({ error: "Favorito no encontrado" })
  }

  await prisma.favorites.delete({ where: { id: favorite.id } })

  return res.json({ message: "Eliminado de favoritos" })
}
