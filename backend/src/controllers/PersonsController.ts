/**
 * @file PersonsController.ts
 * @description Controlador para el seguimiento de personas de la industria.
 */

import { Request, Response } from "express"
import * as personsService from "../services/persons.services.js"
import { FollowPersonDTO, UnfollowParamsDTO } from "../schemas/persons.js"

/**
 * Registra un nuevo seguimiento de actor o director.
 */
export const followPerson = async (req: Request, res: Response) => {
  const userId = req.user!.user_id
  const data = req.body as FollowPersonDTO

  const connection = await personsService.followPersonService(
    userId,
    data.tmdb_id,
    data.name,
    data.profile_path
  )

  res.status(201).json(connection)
}

/**
 * Elimina un seguimiento existente.
 */
export const unfollowPerson = async (req: Request, res: Response) => {
  const userId = req.user!.user_id
  const { tmdbId } = req.params as unknown as UnfollowParamsDTO

  await personsService.unfollowPersonService(userId, tmdbId)
  res.json({ message: "Has dejado de seguir a esta persona" })
}

/**
 * Obtiene la lista de personas seguidas por el usuario autenticado.
 */
export const getFollowedPersons = async (req: Request, res: Response) => {
  const userId = req.user!.user_id
  const followed = await personsService.getFollowedPersonsService(userId)
  res.json(followed)
}

/**
 * Verifica si el usuario sigue a una persona.
 */
export const checkFollowingStatus = async (req: Request, res: Response) => {
  const userId = req.user!.user_id
  const { tmdbId } = req.params as unknown as UnfollowParamsDTO
  
  const isFollowing = await personsService.isFollowingPersonService(userId, tmdbId)
  res.json({ isFollowing })
}
