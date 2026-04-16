/**
 * @file FeedController.ts
 * @description Controlador para el ecosistema social y feed de actividad de CineVault.
 * Gestiona la visualización de actividad de amigos, interacciones (likes), marcadores 
 * y compartición de contenido.
 */

import { Request, Response } from "express"
import { FeedQueryDTO } from "../schemas/feed.js"
import {
  getFriendsFeedService,
  setFeedBookmarkService,
  setFeedHideService,
  setFeedLikeService,
  trackFeedShareService,
} from "../services/feed.services.js"

/**
 * Recupera el feed de actividad social para el usuario autenticado.
 */
export const getFeed = async (req: Request, res: Response) => {
  const payload = await getFriendsFeedService(
    req.user!.user_id,
    req.query as unknown as FeedQueryDTO
  )
  res.json(payload)
}

/**
 * Registra o elimina un "Like" en una entrada del feed.
 */
export const postFeedLike = async (req: Request, res: Response) => {
  const payload = await setFeedLikeService(req.user!.user_id, req.body)
  res.json(payload)
}

/**
 * Guarda o elimina una entrada del feed de la sección de marcadores.
 */
export const postFeedBookmark = async (req: Request, res: Response) => {
  const payload = await setFeedBookmarkService(req.user!.user_id, req.body)
  res.json(payload)
}

/**
 * Oculta una publicación específica del feed del usuario.
 */
export const postFeedHide = async (req: Request, res: Response) => {
  const payload = await setFeedHideService(req.user!.user_id, req.body)
  res.json(payload)
}

/**
 * Registra la acción de compartir una publicación del feed.
 */
export const postFeedShare = async (req: Request, res: Response) => {
  const payload = await trackFeedShareService(req.user!.user_id, req.body)
  res.status(201).json(payload)
}
