import { favoritiesRepository } from "../repositories/FavoritiesRepository.js"
import { NotFoundError } from "../errors/AppErrors.js"
import type { AgregarFavoritoDTO } from "../schemas/favorites.js"

/* ==========================================================================
   FAVORITIES SERVICE
   --------------------------------------------------------------------------
   Lógica de negocio de favoritos.
   ========================================================================== */

export const obtenerFavoritosService = async (userId: number) => {
  const favoritos = await favoritiesRepository.findByUserId(userId)
  if (favoritos.length === 0) throw new NotFoundError("No tienes favoritos")
  return favoritos
}

export const obtenerFavoritosPorUsuarioService = async (userId: number) => {
  const favoritos = await favoritiesRepository.findByUserId(userId)
  if (favoritos.length === 0)
    throw new NotFoundError("Favoritos no encontrados")
  return favoritos
}

export const agregarFavoritoService = (
  userId: number,
  data: AgregarFavoritoDTO
) => favoritiesRepository.create(userId, data)

export const eliminarFavoritoService = async (
  userId: number,
  movieId: number
) => {
  const favorito = await favoritiesRepository.findFirst(userId, movieId)
  if (!favorito) throw new NotFoundError("Favorito no encontrado")
  await favoritiesRepository.delete(favorito.id)
}
