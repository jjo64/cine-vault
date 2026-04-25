/**
 * @file WatchlistController.ts
 * @description Controlador para la gestión de la lista de seguimiento (Watchlist).
 * Permite a los usuarios organizar las películas que desean ver en el futuro,
 * facilitando la planificación de su consumo cinematográfico.
 */

import { Request, Response } from "express"
import * as watchlistService from "../services/watchlist.services.js"

/**
 * Recupera la lista de seguimiento del usuario actualmente autenticado.
 */
export const getMyWatchlist = async (req: Request, res: Response) => {
  const watchlist = await watchlistService.obtenerWatchlistService(
    req.user!.user_id
  )
  res.json(watchlist)
}

/**
 * Obtiene la lista de seguimiento pública de un usuario específico.
 */
export const getWatchlistByUser = async (req: Request, res: Response) => {
  const idUser = Number(req.params.id_user)
  const watchlist = await watchlistService.obtenerWatchlistService(idUser)
  res.json(watchlist)
}

/**
 * Añade una película a la lista de seguimiento del usuario.
 */
export const addMovieToWatchlist = async (req: Request, res: Response) => {
  await watchlistService.agregarAWatchlistService(req.user!.user_id, req.body)
  res.status(201).json({
    message: "Película añadida con éxito a la watchlist",
  })
}

/**
 * Elimina una película de la lista de seguimiento del usuario.
 */
export const removeMovieFromWatchlist = async (req: Request, res: Response) => {
  const { movie_id } = req.params
  const { mediaType } = req.query
  await watchlistService.eliminarDeWatchlistService(req.user!.user_id, {
    movie_id: Number(movie_id),
    media_type: mediaType as string,
  } as any)
  res.json({ message: "La obra ha sido eliminada de la watchlist con éxito" })
}
