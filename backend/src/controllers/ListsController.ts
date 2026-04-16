/**
 * @file ListsController.ts
 * @description Controlador para la gestión de Listas Personalizadas y Colecciones Públicas.
 * Permite a los usuarios crear, editar y compartir sus propias colecciones de cine, 
 * así como descubrir listas populares de la comunidad.
 */

import { Request, Response } from "express"
import type { z } from "zod"
import type {
  listIdParamsSchema,
  listItemParamsSchema,
  ListPublicListsQueryDTO,
} from "../schemas/lists.js"
import * as listsService from "../services/lists.services.js"

type ListIdParams = z.infer<typeof listIdParamsSchema>
type ListItemParams = z.infer<typeof listItemParamsSchema>

/**
 * Recupera todas las listas (propias y seguidas) del usuario autenticado.
 */
export const getMyLists = async (req: Request, res: Response) => {
  const lists = await listsService.getMyListsService(req.user!.user_id)
  res.json(lists)
}

/**
 * Obtiene el detalle exhaustivo de una lista privada de la cual el usuario es propietario o colaborador.
 */
export const getMyListDetail = async (req: Request, res: Response) => {
  const { id: listId } = req.params as unknown as ListIdParams
  const detail = await listsService.getMyListDetailService(
    req.user!.user_id,
    listId
  )
  res.json(detail)
}

/**
 * Crea una nueva lista personalizada para el usuario.
 */
export const createList = async (req: Request, res: Response) => {
  const list = await listsService.createListService(req.user!.user_id, req.body)
  res.status(201).json(list)
}

/**
 * Actualiza los metadatos de una lista existente (título, descripción, privacidad).
 */
export const updateList = async (req: Request, res: Response) => {
  const { id: listId } = req.params as unknown as ListIdParams
  const updated = await listsService.updateListService(
    req.user!.user_id,
    listId,
    req.body
  )
  res.json(updated)
}

/**
 * Elimina de forma permanente una lista especificada.
 */
export const deleteList = async (req: Request, res: Response) => {
  const { id: listId } = req.params as unknown as ListIdParams
  await listsService.deleteListService(req.user!.user_id, listId)
  res.json({ message: "La lista ha sido eliminada correctamente" })
}

/**
 * Añade una película a una lista personalizada.
 */
export const addMovieToList = async (req: Request, res: Response) => {
  const { id: listId } = req.params as unknown as ListIdParams
  await listsService.addMovieToListService(req.user!.user_id, listId, req.body)
  res.status(201).json({ message: "Película agregada a la lista con éxito" })
}

/**
 * Retira una película de una lista personalizada.
 */
export const removeMovieFromList = async (req: Request, res: Response) => {
  const { id: listId, movie_id: movieId } =
    req.params as unknown as ListItemParams
  await listsService.removeMovieFromListService(
    req.user!.user_id,
    listId,
    movieId
  )
  res.json({ message: "La película ha sido retirada de la lista" })
}

/**
 * Obtiene un catálogo de listas públicas filtradas por popularidad o fecha.
 */
export const getPublicLists = async (req: Request, res: Response) => {
  const lists = await listsService.getPublicListsService(
    req.query as unknown as ListPublicListsQueryDTO
  )
  res.json(lists)
}

/**
 * Recupera el detalle público de una lista (visible para todos los usuarios).
 */
export const getPublicListDetail = async (req: Request, res: Response) => {
  const { id: listId } = req.params as unknown as ListIdParams
  const detail = await listsService.getPublicListDetailService(listId)
  res.json(detail)
}
