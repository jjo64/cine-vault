/**
 * @file favorities.services.ts
 * @description Capa de servicios para la gestión de "Favoritos" de los usuarios.
 * Permite a los cinéfilos marcar sus obras predilectas, gestionando la resolución 
 * de referencias entre metadatos externos (TMDB) y la base de datos local.
 */

import {
  ensureMovieRefId,
  findMovieRefIdByCandidate,
} from "./movieRef.services.js"
import { NotFoundError } from "../errors/AppErrors.js"
import { favoritiesRepository } from "../repositories/FavoritiesRepository.js"
import type { AgregarFavoritoDTO } from "../schemas/favorites.js"

// --- Servicios Principales ---

/**
 * Obtiene la lista de favoritos del usuario autenticado.
 */
export const obtenerFavoritosService = async (userId: number) => {
  const favoritos = await favoritiesRepository.findByUserId(userId)
  if (favoritos.length === 0) throw new NotFoundError("No tienes favoritos")
  return favoritos
}

/**
 * Obtiene la lista de favoritos de un usuario específico (perfil público).
 */
export const obtenerFavoritosPorUsuarioService = async (userId: number) => {
  const favoritos = await favoritiesRepository.findByUserId(userId)
  if (favoritos.length === 0) {
    throw new NotFoundError("Favoritos no encontrados")
  }
  return favoritos
}

/**
 * Añade una película a la sección de favoritos del usuario.
 * Resuelve el ID de referencia local antes de persistir la relación.
 */
export const agregarFavoritoService = (
  userId: number,
  data: AgregarFavoritoDTO
) =>
  ensureMovieRefId(data.movieId).then((movieId) =>
    favoritiesRepository.create(userId, { ...data, movieId })
  )

/**
 * Elimina una película de la sección de favoritos del usuario.
 * Valida la existencia de la relación antes de proceder con el borrado.
 */
export const eliminarFavoritoService = async (
  userId: number,
  movieId: number
) => {
  const resolvedMovieId = await findMovieRefIdByCandidate(movieId)
  if (!resolvedMovieId) throw new NotFoundError("Favorito no encontrado")

  const favorito = await favoritiesRepository.findFirst(userId, resolvedMovieId)
  if (!favorito) throw new NotFoundError("Favorito no encontrado")
  
  await favoritiesRepository.delete(favorito.id)
}
