/**
 * @file MovieRefRepository.ts
 * @description Repositorio para la tabla de referencia de películas (movies_ref).
 * Esta tabla vincula los IDs internos del sistema con los IDs externos de TMDB, 
 * actuando como un índice local para optimizar las consultas y evitar la 
 * duplicación de metadatos pesados.
 */

import { prisma } from "../lib/prisma.js"

/**
 * Interfaz IMovieRefRepository
 * Define las operaciones de búsqueda y creación de referencias locales.
 */
export interface IMovieRefRepository {
  findById(id: number): Promise<{ id: number } | null>
  findByTmdbId(tmdbId: number): Promise<{ id: number } | null>
  findBySlug(slug: string): Promise<{ id: number } | null>
  create(tmdbId: number): Promise<{ id: number }>
}

/**
 * Clase MovieRefRepository
 * Provee métodos rápidos para validar y recuperar referencias de películas.
 */
class MovieRefRepository implements IMovieRefRepository {
  /**
   * Busca una referencia por su ID interno único.
   */
  async findById(id: number): Promise<{ id: number } | null> {
    return prisma.movies_ref.findUnique({
      where: { id },
      select: { id: true },
    })
  }

  /**
   * Busca una referencia por su ID de TMDB (The Movie Database).
   */
  async findByTmdbId(tmdbId: number): Promise<{ id: number } | null> {
    return prisma.movies_ref.findUnique({
      where: { tmdb_id: tmdbId },
      select: { id: true },
    })
  }

  /**
   * Busca una referencia por su slug (URL-friendly string).
   */
  async findBySlug(slug: string): Promise<{ id: number } | null> {
    return prisma.movies_ref.findUnique({
      where: { slug },
      select: { id: true },
    })
  }

  /**
   * Registra una nueva referencia de TMDB en la base de datos local.
   */
  async create(tmdbId: number): Promise<{ id: number }> {
    return prisma.movies_ref.create({
      data: { tmdb_id: tmdbId },
      select: { id: true },
    })
  }
}

export const movieRefRepository = new MovieRefRepository()
