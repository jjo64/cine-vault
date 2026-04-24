/**
 * @file lists.services.ts
 * @description Capa de servicios para la gestión de "Colecciones" o Listas de Usuario.
 * Permite la creación de listas públicas y privadas, gestión de contenido (películas) 
 * y validación de reglas de integridad (nombres únicos por usuario, evitar duplicados).
 */

import { ConflictError, NotFoundError } from "../errors/AppErrors.js"
import { listsRepository } from "../repositories/ListsRepository.js"
import {
  AddMovieToListDTO,
  CreateListDTO,
  ListPublicListsQueryDTO,
  UpdateListDTO,
} from "../schemas/lists.js"
import {
  ensureMovieRefId,
  findMovieRefIdByCandidate,
} from "./movieRef.services.js"

// --- Servicios de Gestión de Listas Propias ---

/**
 * Recupera todas las listas (públicas y privadas) pertenecientes al usuario.
 */
export const getMyListsService = async (userId: number) => {
  return listsRepository.listByUser(userId)
}

/**
 * Obtiene el detalle completo de una lista propia, incluyendo sus películas.
 */
export const getMyListDetailService = async (
  userId: number,
  listId: number
) => {
  const list = await listsRepository.getDetailForUser(listId, userId)
  if (!list) throw new NotFoundError("Lista no encontrada")
  return list
}

/**
 * Crea una nueva lista validando que el nombre sea único para el usuario actual.
 */
export const createListService = async (
  userId: number,
  data: CreateListDTO
) => {
  const name = data.name.trim()
  const existing = await listsRepository.listByUser(userId)
  const duplicate = existing.some(
    (list) => list.name.toLowerCase() === name.toLowerCase()
  )

  if (duplicate) {
    throw new ConflictError("Ya existe una lista con ese nombre")
  }

  return listsRepository.create(userId, {
    name,
    description: data.description ?? null,
    is_public: data.is_public ?? false,
  })
}

/**
 * Actualiza los metadatos de una lista propia.
 */
export const updateListService = async (
  userId: number,
  listId: number,
  data: UpdateListDTO
) => {
  const list = await listsRepository.findByIdForUser(listId, userId)
  if (!list) throw new NotFoundError("Lista no encontrada")

  if (data.name) {
    const existing = await listsRepository.listByUser(userId)
    const duplicate = existing.some(
      (entry) =>
        entry.id !== listId &&
        entry.name.toLowerCase() === data.name!.trim().toLowerCase()
    )
    if (duplicate) throw new ConflictError("Ya existe una lista con ese nombre")
  }

  return listsRepository.update(listId, {
    name: data.name?.trim(),
    description: data.description ?? undefined,
    is_public: data.is_public,
  })
}

/**
 * Elimina una lista y todas sus asociaciones de películas.
 */
export const deleteListService = async (userId: number, listId: number) => {
  const list = await listsRepository.findByIdForUser(listId, userId)
  if (!list) throw new NotFoundError("Lista no encontrada")

  await listsRepository.delete(listId)
}

// --- Servicios de Gestión de Contenido de Listas ---

/**
 * Añade una película a una lista, garantizando que no exista previamente en ella.
 */
export const addMovieToListService = async (
  userId: number,
  listId: number,
  data: AddMovieToListDTO
) => {
  const list = await listsRepository.findByIdForUser(listId, userId)
  if (!list) throw new NotFoundError("Lista no encontrada")

  const movieRefId = await ensureMovieRefId(data.movie_id, "movie")
  const detail = await listsRepository.getDetailForUser(listId, userId)
  const alreadyInList = detail?.items.some(
    (item) => item.movie_id === movieRefId
  )
  if (alreadyInList) {
    throw new ConflictError("La película ya está en la lista")
  }

  await listsRepository.addMovie(listId, movieRefId)
}

/**
 * Elimina una película de una lista propia.
 */
export const removeMovieFromListService = async (
  userId: number,
  listId: number,
  movieCandidate: number
) => {
  const list = await listsRepository.findByIdForUser(listId, userId)
  if (!list) throw new NotFoundError("Lista no encontrada")

  const movieRefId = await findMovieRefIdByCandidate(movieCandidate)
  if (!movieRefId) return

  await listsRepository.removeMovie(listId, movieRefId)
}

// --- Servicios de Acceso Público ---

/**
 * Recupera un listado paginado de todas las listas marcadas como públicas por la comunidad.
 */
export const getPublicListsService = async (query: ListPublicListsQueryDTO) => {
  return listsRepository.listPublic(query.page, query.limit)
}

/**
 * Obtiene el detalle de una lista pública para visualización general.
 */
export const getPublicListDetailService = async (listId: number) => {
  const list = await listsRepository.getPublicDetail(listId)
  if (!list) throw new NotFoundError("Lista pública no encontrada")
  return list
}
