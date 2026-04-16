/**
 * @file movieRef.services.ts
 * @description Capa de servicios para la resolución y gestión de referencias locales de películas.
 * Actúa como puente entre los identificadores externos (TMDB) y las llaves primarias 
 * locales, gestionando la persistencia perezosa y la integridad ante peticiones concurrentes.
 */

import { Prisma } from "@prisma/client"
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
  candidate: number
): Promise<number | null> => {
  const byId = await movieRefRepository.findById(candidate)
  if (byId) return byId.id

  const byTmdb = await movieRefRepository.findByTmdbId(candidate)
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
export const ensureMovieRefId = async (candidate: number): Promise<number> => {
  const existing = await findMovieRefIdByCandidate(candidate)
  if (existing) return existing

  try {
    const created = await movieRefRepository.create(candidate)
    return created.id
  } catch (error) {
    /**
     * Condición de carrera: otro proceso pudo insertar el mismo tmdb_id entre la 
     * comprobación inicial y la inserción. Capturamos el error de restricción única
     * y realizamos un lookup final para retornar el ID existente.
     */
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raceSafeLookup = await movieRefRepository.findByTmdbId(candidate)
      if (raceSafeLookup) return raceSafeLookup.id
    }
    throw error
  }
}
