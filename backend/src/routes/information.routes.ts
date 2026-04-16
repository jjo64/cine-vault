/**
 * @file information.routes.ts
 * @description Rutas para la consulta de información bibliográfica y créditos.
 * Proporciona acceso a los perfiles de personas (actores, directores) y su
 * historial completo de trabajos en cine y televisión.
 */

import { Router } from "express"
import {
  personInformation,
  personInformationCombined,
} from "../controllers/InformationController.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

/**
 * @swagger
 * tags:
 *   name: Información
 *   description: Datos de personas (Cast & Crew) desde TMDB
 */

const router = Router()

/**
 * @swagger
 * /information/person/{id}:
 *   get:
 *     summary: Obtener biografía y perfil de una persona
 *     tags: [Información]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get("/person/:id", manejadorAsincrono(personInformation))

/**
 * @swagger
 * /information/person/{id}/combined_credits:
 *   get:
 *     summary: Listar filmografía completa (Cine y TV) de una persona
 *     tags: [Información]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get(
  "/person/:id/combined_credits",
  manejadorAsincrono(personInformationCombined)
)

export default router
