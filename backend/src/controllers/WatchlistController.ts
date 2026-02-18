import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"

/**
 * Obtiene la lista de seguimiento de un usuario.
 * El manejo de errores (try/catch) ahora es automático gracias al Global Error Handler.
 */
export const getWatchlistByUser = async (req: Request, res: Response) => {
  const { id_user } = req.params

  const watchlist = await prisma.watchlist.findMany({
    where: { user_id: Number(id_user) },
    select: {
      movie_id: true,
      added_at: true,
    },
  })

  return res.json(watchlist)
}

/**
 * Añade una película a la lista de seguimiento.
 */
export const addMovieToWatchlist = async (req: Request, res: Response) => {
  // Tomamos el ID del usuario de la request y la película del body
  const user_id = Number(req.params.id)
  const movie_id = Number(req.body.movie_id)

  const watchlist = await prisma.watchlist.create({
    data: { user_id, movie_id },
  })

  return res.json(watchlist)
}

/**
 * Elimina una película de la lista de seguimiento.
 */
export const removeMovieFromWatchlist = async (req: Request, res: Response) => {
  const { id } = req.params

  const watchlist = await prisma.watchlist.delete({
    where: { id: Number(id) },
  })

  return res.json(watchlist)
}
