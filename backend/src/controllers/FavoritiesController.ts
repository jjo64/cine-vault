/**
 * @file FavoritiesController.ts
 * @description Controlador para la gestión de la colección de Favoritos de los usuarios.
 * Permite administrar las películas preferidas de un usuario y consultar las de otros.
 */

import { Request, Response } from "express"
import type {
  MovieIdParamsFavDTO,
  UserIdParamsFavDTO,
} from "../schemas/favorites.js"
import * as favoritiesService from "../services/favorities.services.js"

/**
 * Obtiene la lista de películas favoritas del usuario autenticado.
 */
export const getFavorites = async (req: Request, res: Response) => {
  const favoritos = await favoritiesService.obtenerFavoritosService(
    req.user!.user_id
  )
  res.json(favoritos)
}

/**
 * Recupera los favoritos públicos de un usuario específico.
 */
export const getFavoritesByUserId = async (req: Request, res: Response) => {
  const { userId } = req.params as unknown as UserIdParamsFavDTO
  const favoritos = await favoritiesService.obtenerFavoritosPorUsuarioService(userId)
  res.json(favoritos)
}

/**
 * Añade una película a la sección de favoritos del usuario.
 */
export const addMovieToFavorites = async (req: Request, res: Response) => {
  const favorito = await favoritiesService.agregarFavoritoService(
    req.user!.user_id,
    req.body
  )
  res.status(201).json(favorito)
}

/**
 * Elimina una película de la lista de favoritos.
 */
export const removeMovieFromFavorites = async (req: Request, res: Response) => {
  const { movieId } = req.params as unknown as MovieIdParamsFavDTO
  await favoritiesService.eliminarFavoritoService(req.user!.user_id, movieId)
  res.json({ message: "La película ha sido eliminada de sus favoritos" })
}