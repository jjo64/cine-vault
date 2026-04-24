/**
 * @file diary.routes.ts
 * @description Gestión del Diario de Visionado (Letterboxd-style).
 * Permite a los usuarios registrar las películas que ven, con fecha específica,
 * permitiendo construir un historial cronológico de su experiencia cinematográfica.
 */

import { Router } from "express"
import {
  createDiary,
  getDiaryUser,
  getMyDiary,
  removeDiary,
  getMyDiarySessions,
  createDiarySession,
} from "../controllers/DiaryController.js"
import { middlewareAutenticacion } from "../middlewares/auth.middlewares.js"
import { manejadorAsincrono } from "../middlewares/error.middlewares.js"
import { limitarSpikesIP } from "../middlewares/rateLimit.middleware.js"
import { validarBody, validarParams } from "../middlewares/validation.middleware.js"
import {
  crearEntradaDiarioSchema,
  diaryIdParamsSchema,
  diaryUserParamsSchema,
} from "../schemas/diary.js"

/**
 * @swagger
 * tags:
 *   name: Diario
 *   description: Registro cronológico de visionado
 */

const router = Router()

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: LECTURA DE ENTTRADAS
 * ---------------------------------------------------------------------------
 */

/**
 * @swagger
 * /diary:
 *   get:
 *     summary: Recuperar el historial de visionado del usuario autenticado
 *     tags: [Diario]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", middlewareAutenticacion, manejadorAsincrono(getMyDiary))

/**
 * /diary/sessions:
 *   get:
 *     summary: Recuperar el historial de sesiones del usuario
 *     tags: [Diario]
 *     security:
 *       - bearerAuth: []
 */
router.get("/sessions", middlewareAutenticacion, manejadorAsincrono(getMyDiarySessions))

/**
 * @swagger
 * /diary/{id_user}:
 *   get:
 *     summary: Consultar el diario público de otro usuario
 *     tags: [Diario]
 *     parameters:
 *       - in: path
 *         name: id_user
 *         required: true
 *         schema:
 *           type: integer
 */
router.get(
  "/:id_user",
  validarParams(diaryUserParamsSchema),
  manejadorAsincrono(getDiaryUser)
)

/**
 * ---------------------------------------------------------------------------
 * BLOQUE: GESTIÓN DE ENTRADAS
 * ---------------------------------------------------------------------------
 */

/**
 * /diary/sessions:
 *   post:
 *     summary: Crear una sesión de visionado (múltiples películas)
 *     tags: [Diario]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/sessions",
  middlewareAutenticacion,
  limitarSpikesIP,
  manejadorAsincrono(createDiarySession)
)

/**
 * @swagger
 * /diary:
 *   post:
 *     summary: Registrar una nueva película vista en el historial
 *     tags: [Diario]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  middlewareAutenticacion,
  limitarSpikesIP,
  validarBody(crearEntradaDiarioSchema),
  manejadorAsincrono(createDiary)
)

/**
 * @swagger
 * /diary/{id}:
 *   delete:
 *     summary: Eliminar una entrada específica del diario
 *     tags: [Diario]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id",
  middlewareAutenticacion,
  limitarSpikesIP,
  validarParams(diaryIdParamsSchema),
  manejadorAsincrono(removeDiary)
)

export default router
