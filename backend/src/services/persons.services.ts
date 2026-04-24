/**
 * @file persons.services.ts
 * @description Lógica de negocio para el seguimiento de personas (directores, actores, etc.).
 * Gestiona el índice local de personas de TMDB y las relaciones de seguimiento.
 */

import { prisma } from "../lib/prisma.js"
import { NotFoundError, ConflictError } from "../errors/AppErrors.js"

/**
 * Garantiza que una persona de TMDB exista en el índice local de CineVault.
 * 
 * @param tmdbId - ID único de TMDB.
 * @param name - Nombre de la persona.
 * @param profilePath - URL parcial de la imagen de perfil.
 */
export const ensurePersonRef = async (
  tmdbId: number,
  name: string,
  profilePath?: string | null
) => {
  const existing = await prisma.persons_ref.findUnique({
    where: { tmdb_id: tmdbId },
    select: { id: true }
  })

  if (existing) return existing.id

  const created = await prisma.persons_ref.create({
    data: {
      tmdb_id: tmdbId,
      name,
      profile_path: profilePath
    },
    select: { id: true }
  })

  return created.id
}

/**
 * Registra que un usuario sigue a una persona específica de la industria.
 */
export const followPersonService = async (
  userId: number,
  tmdbId: number,
  name: string,
  profilePath?: string | null
) => {
  const personId = await ensurePersonRef(tmdbId, name, profilePath)

  try {
    return await prisma.user_followed_persons.create({
      data: {
        user_id: userId,
        person_id: personId
      }
    })
  } catch (error) {
    // Si ya lo sigue (restricción única), devolvemos error de conflicto
    throw new ConflictError("Ya sigues a esta persona")
  }
}

/**
 * Elimina la relación de seguimiento entre un usuario y una persona usando el ID de TMDB.
 */
export const unfollowPersonService = async (userId: number, tmdbId: number) => {
  const person = await prisma.persons_ref.findUnique({
    where: { tmdb_id: tmdbId },
    select: { id: true }
  })

  if (!person) throw new NotFoundError("Persona no encontrada en el índice local")

  await prisma.user_followed_persons.delete({
    where: {
      user_id_person_id: {
        user_id: userId,
        person_id: person.id
      }
    }
  })
}

/**
 * Recupera la lista de personas que sigue un usuario.
 */
export const getFollowedPersonsService = async (userId: number) => {
  return prisma.user_followed_persons.findMany({
    where: { user_id: userId },
    include: {
      persons: true
    },
    orderBy: { followed_at: "desc" }
  })
}

/**
 * Verifica si un usuario sigue a una persona específica.
 */
export const isFollowingPersonService = async (userId: number, tmdbId: number) => {
  const person = await prisma.persons_ref.findUnique({
    where: { tmdb_id: tmdbId },
    select: { id: true }
  })

  if (!person) return false

  const connection = await prisma.user_followed_persons.findUnique({
    where: {
      user_id_person_id: {
        user_id: userId,
        person_id: person.id
      }
    }
  })

  return !!connection
}
