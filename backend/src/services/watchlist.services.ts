/**
 * @file watchlist.services.ts
 * @description Capa de servicios para la gestión de la lista de seguimiento (Watchlist).
 * Permite a los usuarios administrar su colección de "Películas por Ver", gestionando 
 * la persistencia y la integridad referencial con el catálogo base.
 */

import { ConflictError } from "../errors/AppErrors.js"
import { watchlistRepository } from "../repositories/WatchlistRepository.js"
import type {
  AgregarWatchlistDTO,
  EliminarWatchlistDTO,
} from "../schemas/watchlist.js"
import {
  ensureMovieRefId,
  findMovieRefIdByCandidate,
} from "./movieRef.services.js"

// --- Servicios de Gestión de Watchlist ---

/**
 * Recupera la lista completa de películas pendientes del usuario.
 */
export const obtenerWatchlistService = (userId: number) =>
  watchlistRepository.buildRichResponse(userId)

/**
 * Añade una película a la lista de seguimiento.
 * Valida la existencia previa para evitar duplicados en la colección.
 * 
 * @param userId ID del usuario.
 * @param data DTO con el identificador de la película (TMDB ID).
 * @throws ConflictError si la película ya se encuentra en la lista.
 */
export const agregarAWatchlistService = async (
  userId: number,
  data: AgregarWatchlistDTO
) => {
  const movieId = await ensureMovieRefId(data.movie_id)
  const yaExiste = await watchlistRepository.exists(userId, movieId)
  
  if (yaExiste) {
    throw new ConflictError(`La película ${data.movie_id} ya se encuentra en su lista de seguimiento`)
  }

  return watchlistRepository.create(userId, movieId)
}

/**
 * Elimina una película de la lista de seguimiento.
 */
export const eliminarDeWatchlistService = (
  userId: number,
  data: EliminarWatchlistDTO
) =>
  findMovieRefIdByCandidate(data.movie_id).then((resolvedMovieId) => {
    if (!resolvedMovieId) return
    return watchlistRepository.deleteByMovieId(userId, resolvedMovieId)
  })
