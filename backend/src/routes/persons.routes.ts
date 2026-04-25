/**
 * @file persons.routes.ts
 * @description Rutas para el seguimiento de personas de la industria (actores, directores).
 */

import { Router } from "express"
import {
  followPerson,
  unfollowPerson,
  getFollowedPersons,
  checkFollowingStatus,
} from "../controllers/PersonsController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import {
  validarBody,
  validarParams,
} from "../middlewares/validation.middleware.js"
import { followPersonSchema, unfollowParamsSchema } from "../schemas/persons.js"

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Persons
 *   description: Seguimiento de actores y directores
 */

router.use(middlewareAutenticacion)

/**
 * @swagger
 * /persons/followed:
 *   get:
 *     summary: Obtener lista de personas seguidas
 *     tags: [Persons]
 *     security:
 *       - bearerAuth: []
 */
router.get("/followed", manejadorAsincrono(getFollowedPersons))

/**
 * @swagger
 * /persons/check/:tmdbId:
 *   get:
 *     summary: Verificar si se sigue a una persona
 *     tags: [Persons]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/check/:tmdbId",
  validarParams(unfollowParamsSchema),
  manejadorAsincrono(checkFollowingStatus)
)

/**
 * @swagger
 * /persons/follow:
 *   post:
 *     summary: Seguir a una persona
 *     tags: [Persons]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/follow",
  validarBody(followPersonSchema),
  manejadorAsincrono(followPerson)
)

/**
 * @swagger
 * /persons/follow/:tmdbId:
 *   delete:
 *     summary: Dejar de seguir a una persona
 *     tags: [Persons]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/follow/:tmdbId",
  validarParams(unfollowParamsSchema),
  manejadorAsincrono(unfollowPerson)
)

export default router
