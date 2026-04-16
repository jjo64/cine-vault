/**
 * @file FavoritiesRepository.ts
 * @description Repositorio para la gestión de películas favoritas de los usuarios.
 * Nota: Se mantiene el nombre "Favorities" por consistencia con el esquema de base de datos y carpetas del proyecto.
 */

import { favorites } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import type { AgregarFavoritoDTO } from "../schemas/favorites.js"

/**
 * Interfaz IFavoritiesRepository
 * Define el contrato para el acceso a datos de favoritos.
 */
export interface IFavoritiesRepository {
  /**
   * Obtiene todos los favoritos de un usuario con sus posiciones de ranking y TMDB IDs.
   */
  findByUserId(
    userId: number
  ): Promise<
    Array<{
      movie_id: number
      rank_position: number | null
      tmdb_id: number | null
    }>
  >

  /**
   * Busca si una película específica ya está marcada como favorita por el usuario.
   */
  findFirst(userId: number, movieId: number): Promise<favorites | null>

  /**
   * Añade una película a la lista de favoritos de un usuario.
   */
  create(userId: number, data: AgregarFavoritoDTO): Promise<favorites>

  /**
   * Elimina un registro de favorito por su ID de tabla.
   */
  delete(id: number): Promise<void>
}

/**
 * Clase FavoritiesRepository
 * Implementación de la persistencia para el sistema de favoritos usando Prisma ORM.
 */
export class FavoritiesRepository implements IFavoritiesRepository {
  /**
   * Recupera la colección de favoritos hidratada con referencias de películas.
   */
  async findByUserId(userId: number) {
    const rows = await prisma.favorites.findMany({
      where: { user_id: userId },
      select: {
        movie_id: true,
        rank_position: true,
        movies_ref: {
          select: { tmdb_id: true },
        },
      },
    })

    return rows.map((row) => ({
      movie_id: row.movie_id,
      rank_position: row.rank_position,
      tmdb_id: row.movies_ref?.tmdb_id ?? null,
    }))
  }

  /**
   * Verifica la existencia de un favorito para evitar duplicados.
   */
  async findFirst(userId: number, movieId: number) {
    return prisma.favorites.findFirst({
      where: { user_id: userId, movie_id: movieId },
    })
  }

  /**
   * Crea un nuevo registro de favorito.
   */
  async create(userId: number, data: AgregarFavoritoDTO) {
    return prisma.favorites.create({
      data: {
        user_id: userId,
        movie_id: data.movieId,
        rank_position: data.rank_position ?? null,
      },
    })
  }

  /**
   * Elimina fisicamente el registro de la tabla favorites.
   */
  async delete(id: number) {
    await prisma.favorites.delete({ where: { id } })
  }
}

export const favoritiesRepository = new FavoritiesRepository()
