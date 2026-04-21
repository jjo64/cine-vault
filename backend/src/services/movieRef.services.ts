/**
 * @file movieRef.services.ts
 * @description Capa de servicios para la resolución y gestión de referencias locales de películas.
 * Actúa como puente entre los identificadores externos (TMDB) y las llaves primarias 
 * locales, gestionando la persistencia perezosa y la integridad ante peticiones concurrentes.
 */

import { Prisma, ReviewMediaType } from "@prisma/client"
import { movieRefRepository } from "../repositories/MovieRefRepository.js"

// --- Servicios Principales ---

/**
 * Intenta resolver una referencia de película a partir de un candidato.
 * El candidato puede ser tanto el ID interno del sistema como el ID de TMDB.
 * 
 * @param candidate ID a verificar (Local o TMDB).
 * @returns El ID local de la película o null si no existe.
 */
export const findMovieRefIdByCandidate = async (
  candidate: number,
  mediaType?: ReviewMediaType
): Promise<number | null> => {
  const byId = await movieRefRepository.findById(candidate)
  if (byId) return byId.id

  if (!mediaType) return null

  const byTmdb = await movieRefRepository.findByTmdbId(candidate, mediaType)
  return byTmdb?.id ?? null
}

/**
 * Garantiza la existencia de una referencia local para una película de TMDB.
 * Si no existe, la crea. Implementa una estrategia de "Race Condition Recovery" 
 * mediante el manejo de errores de unicidad de Prisma (P2002).
 * 
 * @param candidate ID de TMDB para asegurar en la base de datos local.
 * @returns El ID local único y persistente.
 */
export const ensureMovieRefId = async (
  candidate: number,
  mediaType: ReviewMediaType
): Promise<number> => {
  const existing = await findMovieRefIdByCandidate(candidate, mediaType)
  if (existing) return existing

  try {
    const created = await movieRefRepository.create(candidate, mediaType)
    return created.id
  } catch (error) {
    /**
     * Condición de carrera: otro proceso pudo insertar el mismo (tmdb_id, media_type)
     * entre la comprobación inicial y la inserción.
     */
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raceSafeLookup = await movieRefRepository.findByTmdbId(candidate, mediaType)
      if (raceSafeLookup) return raceSafeLookup.id
    }
    throw error
  }
}
