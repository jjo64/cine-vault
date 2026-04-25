/**
 * @file FavoritiesRepository.ts
 * @description Capa de persistencia para la gestión de películas favoritas de los usuarios.
 * Nota histórica: Se mantiene la nomenclatura "Favorities" para preservar la coherencia 
 * con los identificadores de tablas y esquemas de la base de datos (Legacy Schema Compliance).
 * Provee métodos para clasificar y organizar las obras predilectas de la comunidad.
 */

import { favorites } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import type { AgregarFavoritoDTO } from "../schemas/favorites.js"

/** 
 * Contrato de acceso a datos para la gestión de favoritos.
 * Define las operaciones atómicas necesarias para el control de la colección personal.
 */
export interface IFavoritiesRepository {
  /**
   * Recupera la lista completa de favoritos de un usuario.
   * Integra automáticamente el ID de TMDB para facilitar la carga de arte en el cliente.
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
   * Localiza un registro de favorito específico.
   * Útil para validaciones de existencia o de-duplicación.
   */
  findFirst(userId: number, movieId: number): Promise<favorites | null>

  /**
   * Registra una nueva película en el podio de favoritos.
   */
  create(userId: number, data: AgregarFavoritoDTO): Promise<favorites>

  /**
   * Elimina una película de la lista de favoritos.
   */
  delete(id: number): Promise<void>
}

/**
 * Repositorio de Favoritos
 * Implementa la interfaz contractual utilizando Prisma ORM como motor de persistencia.
 */
export class FavoritiesRepository implements IFavoritiesRepository {
  /**
   * Recupera la colección de favoritos hidratada con referencias cruzadas.
   * Realiza un JOIN implícito para obtener el 'tmdb_id' desde la tabla de referencia global.
   * 
   * @param userId - Propietario de la colección.
   */
  async findByUserId(userId: number) {
    const rows = await prisma.favorites.findMany({
      where: { user_id: userId },
      orderBy: [
        { rank_position: "asc" },
        { id: "desc" }
      ],
      select: {
        movie_id: true,
        rank_position: true,
        movies_ref: {
          select: { tmdb_id: true, media_type: true },
        },
      },
    })

    return rows.map((row) => ({
      movie_id: row.movie_id,
      rank_position: row.rank_position,
      tmdb_id: row.movies_ref?.tmdb_id ?? null,
      media_type: row.movies_ref?.media_type ?? "movie",
    }))
  }

  /**
   * Verifica si una película ya reside en la colección de favoritos del usuario.
   */
  async findFirst(userId: number, movieId: number) {
    return prisma.favorites.findFirst({
      where: { user_id: userId, movie_id: movieId },
    })
  }

  /**
   * Persiste una nueva vinculación de favoritismo.
   * Permite asignar una 'rank_position' para organizar visualmente el top de películas.
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
   * Elimina la entrada de favorito especificada.
   * 
   * @param id - Identificador único del registro en la tabla de favoritos.
   */
  async delete(id: number) {
    await prisma.favorites.delete({ where: { id } })
  }
}

/** Instancia exportada para su consumo en la capa de servicios */
export const favoritiesRepository = new FavoritiesRepository()
