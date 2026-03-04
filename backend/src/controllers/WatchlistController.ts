import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { buildWatchlistResponse } from "../helpers/WatchlistHelper.js"

/**
 * Obtiene la lista de seguimiento de un usuario.
 * El manejo de errores (try/catch) ahora es automático gracias al Global Error Handler.
 */
export const getMyWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.user_id
    const result = await buildWatchlistResponse(userId)
    return res.json(result)
  } catch (error) {
    console.error("Error getMyWatchlist:", error)
    return res.status(500).json({ error: "Error al obtener la watchlist" })
  }
}

export const getWatchlistByUser = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id_user)
    const result = await buildWatchlistResponse(userId)
    return res.json(result)
  } catch (error) {
    console.error("Error getWatchlistByUser:", error)
    return res.status(500).json({ error: "Error al obtener la watchlist" })
  }
}

/**
 * Añade una película a la lista de seguimiento.
 */
export const addMovieToWatchlist = async (req: Request, res: Response) => {
  // Tomamos el ID del usuario de la request y la película del body
  try {
    const userId = req.user!.user_id
    const movie_id = Number(req.body.movie_id)

    const watchlist = await prisma.watchlist.create({
      data: { user_id: userId, movie_id },
    })

    return res.status(201).json({ message: "Película " + movie_id + " añadida a la watchlist" })
  } catch (error) {
    console.error("Error addMovieToWatchlist:", error)
    return res
      .status(500)
      .json({ error: "Error al añadir la película a la watchlist" })
  }
}

/**
 * Elimina una película de la lista de seguimiento.
 */
export const removeMovieFromWatchlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.user_id
    const movie_id = Number(req.body.movie_id)

    const watchlist = await prisma.watchlist.deleteMany({
      where: { user_id: userId, movie_id: movie_id },
    })

    return res.json({ message: "Película eliminada de la watchlist" })
  } catch (error) {
    console.error("Error removeMovieFromWatchlist:", error)
    return res
      .status(500)
      .json({ error: "Error al eliminar la película de la watchlist" })
  }
}
