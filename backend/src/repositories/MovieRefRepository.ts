/**
 * @file MovieRefRepository.ts
 * @description Repositorio central de indexación para el catálogo cinematográfico local.
 * Este módulo actúa como el puente de identidad entre los identificadores internos
 * del sistema y los IDs externos de la API de The Movie Database (TMDB).
 * Su función principal es servir de índice rápido para validar la existencia de obras
 * y facilitar el mapeo de recursos sin duplicar metadatos pesados en la base de datos local.
 */

import { prisma } from "../lib/prisma.js"
import { ReviewMediaType } from "@prisma/client"

/** 
 * Interfaz IMovieRefRepository
 * Define las operaciones atómicas de localización y registro de referencias globales.
 */
export interface IMovieRefRepository {
  /** Localiza una referencia por el identificador interno de la plataforma */
  findById(id: number): Promise<{ id: number } | null>
  /** Mapea un ID externo de TMDB a una referencia local */
  findByTmdbId(
    tmdbId: number,
    mediaType: ReviewMediaType
  ): Promise<{ id: number } | null>
  /** Busca todas las referencias locales para un ID de TMDB */
  findByTmdbIdOnly(
    tmdbId: number
  ): Promise<{ id: number; media_type: ReviewMediaType }[]>
  /** Resuelve una película a partir de su identificador amigable para URLs (slug) */
  findBySlug(slug: string): Promise<{ id: number } | null>
  /** Inicializa una nueva referencia local para una película de TMDB */
  create(tmdbId: number, mediaType: ReviewMediaType): Promise<{ id: number }>
}

/**
 * Repositorio de Referencia de Películas
 * Implementación eficiente para la resolución de identidad de obras.
 */
class MovieRefRepository implements IMovieRefRepository {
  /**
   * Busca una referencia por su clave primaria interna.
   */
  async findById(id: number): Promise<{ id: number } | null> {
    return prisma.movies_ref.findUnique({
      where: { id },
      select: { id: true },
    })
  }

  /**
   * Localiza la referencia local vinculada a un ID de TMDB y su tipo.
   * Utilizado para sincronizar datos de la API externa con el ecosistema de CineVault.
   *
   * @param tmdbId - Identificador original de The Movie Database.
   * @param mediaType - Tipo de medio (movie o tv).
   */
  async findByTmdbId(
    tmdbId: number,
    mediaType: ReviewMediaType
  ): Promise<{ id: number } | null> {
    return prisma.movies_ref.findFirst({
      where: {
        tmdb_id: tmdbId,
        media_type: mediaType,
      },
      select: { id: true },
    })
  }

  /**
   * Busca todas las instancias de un ID de TMDB (independientemente del tipo).
   */
  async findByTmdbIdOnly(
    tmdbId: number
  ): Promise<{ id: number; media_type: ReviewMediaType }[]> {
    return prisma.movies_ref.findMany({
      where: { tmdb_id: tmdbId },
      select: { id: true, media_type: true },
    })
  }

  /**
   * Resuelve el identificador de una película mediante su slug SEO.
   * Fundamental para la navegación y carga de fichas técnicas desde la web.
   */
  async findBySlug(slug: string): Promise<{ id: number } | null> {
    return prisma.movies_ref.findUnique({
      where: { slug },
      select: { id: true },
    })
  }

  /**
   * Registra una nueva obra en el índice local de referencias.
   * Se invoca automáticamente cuando un usuario interactúa con una película
   * que aún no reside en la base de datos de CineVault.
   */
  async create(
    tmdbId: number,
    mediaType: ReviewMediaType
  ): Promise<{ id: number }> {
    return prisma.movies_ref.create({
      data: {
        tmdb_id: tmdbId,
        media_type: mediaType,
      },
      select: { id: true },
    })
  }
}

/** Instancia exportada para la resolución de identidades del catálogo */
export const movieRefRepository = new MovieRefRepository()
