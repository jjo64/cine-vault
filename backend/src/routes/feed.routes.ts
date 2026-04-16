/**
 * @file feed.routes.ts
 * @description Rutas para el Feed Social de actividades.
 * Permite a los usuarios interactuar con los eventos de su red social mediante
 * likes, bookmarks, ocultación de contenido y compartición de eventos.
 */

import { Router } from "express"
import {
  getFeed,
  postFeedBookmark,
  postFeedHide,
  postFeedLike,
  postFeedShare,
} from "../controllers/FeedController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  validarBody,
  validarQuery,
} from "../middlewares/validation.middleware.js"
import {
  feedBookmarkActionSchema,
  feedHideActionSchema,
  feedLikeActionSchema,
  feedQuerySchema,
  feedShareActionSchema,
} from "../schemas/feed.js"

/**
 * @swagger
 * tags:
 *   name: Feed
 *   description: Interacción con el flujo social de actividades
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: LECTURA DEL FLOW
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /feed:
 *   get:
 *     summary: Obtener el feed social personalizado
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/",
  middlewareAutenticacion,
  validarQuery(feedQuerySchema),
  manejadorAsincrono(getFeed)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: ACCIONES SOCIALES
 * ---------------------------------------------------------------------------
 */

/**
 * Reaccionar con "Me gusta" a un evento del feed.
 */
router.post(
  "/actions/like",
  middlewareAutenticacion,
  validarBody(feedLikeActionSchema),
  manejadorAsincrono(postFeedLike)
)

/**
 * Guardar un evento en marcadores para consulta posterior.
 */
router.post(
  "/actions/bookmark",
  middlewareAutenticacion,
  validarBody(feedBookmarkActionSchema),
  manejadorAsincrono(postFeedBookmark)
)

/**
 * Ocultar un evento específico del feed del usuario.
 */
router.post(
  "/actions/hide",
  middlewareAutenticacion,
  validarBody(feedHideActionSchema),
  manejadorAsincrono(postFeedHide)
)

/**
 * Compartir un evento del feed con otros usuarios o redes.
 */
router.post(
  "/actions/share",
  middlewareAutenticacion,
  validarBody(feedShareActionSchema),
  manejadorAsincrono(postFeedShare)
)

export default router
