/**
 * @file mentiras.routes.ts
 * @description Rutas para el experimento social "Ranking de Mentiras".
 * Permite visualizar el listado de las desfachateces más votadas por la comunidad,
 * ofreciendo una perspectiva lúdica sobre la cultura cinematográfica.
 */

import { Router } from "express"
import { getMentirasRanking } from "../controllers/MentirasController.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"

/**
 * @swagger
 * tags:
 *   name: Mentiras
 *   description: Ranking social de desfachateces cinematográficas
 */

const router = Router()

/**
 * @swagger
 * /mentiras/ranking:
 *   get:
 *     summary: Obtener el ranking global de mentiras
 *     tags: [Mentiras]
 */
router.get("/ranking", manejadorAsincrono(getMentirasRanking))

export default router
