/**
 * @file directors.routes.ts
 * @description Definición de rutas para el análisis de directores.
 * Proporciona acceso a la "Autopsia de Director", una funcionalidad avanzada
 * que compila estadísticas, filmografía y datos biográficos de cineastas.
 */

import { Router } from "express"
import { getDirectorAutopsy } from "../controllers/DirectorsController.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { validarParams } from "../middlewares/validation.middleware.js"
import { directorAutopsyParamsSchema } from "../schemas/directors.js"

/**
 * @swagger
 * tags:
 *   name: Directores
 *   description: Especializado en análisis profundo de cineastas
 */

const router = Router()

/**
 * @swagger
 * /directors/{id}/autopsy:
 *   get:
 *     summary: Obtener autopsia completa de un director
 *     tags: [Directores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.get(
  "/:id/autopsy",
  validarParams(directorAutopsyParamsSchema),
  manejadorAsincrono(getDirectorAutopsy)
)

export default router
